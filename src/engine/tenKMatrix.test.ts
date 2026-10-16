import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTenKCells,
  computeCell36MonthTrajectory,
  exportTenKCellsCsv,
  findBenchmarkStoreCells,
  findTop100StoreCells,
  renderCellCashflowSparkline,
  type TenKMatrixConfig,
} from "./tenKMatrixEngine.ts";

const sampleConfig: TenKMatrixConfig = {
  categoryKey: "coffee",
  designKey: "express",
  activeScenario: "both",
  baseWaitSec: 105,
  propWaitSec: 18,
  baseSurvivedTotal: 3115,
  propSurvivedTotal: 8420,
  scenarios: [
    {
      id: "both",
      code: "SCN-01",
      label: "Standard Ops",
      runs: 3200,
      baseSurvived: 1066,
      propSurvived: 2886,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
    {
      id: "rainy",
      code: "SCN-02",
      label: "Rainy Surge",
      runs: 2400,
      baseSurvived: 712,
      propSurvived: 1925,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
    {
      id: "layout",
      code: "SCN-03",
      label: "Solo Staff",
      runs: 1400,
      baseSurvived: 363,
      propSurvived: 983,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
    {
      id: "influencer",
      code: "SCN-04",
      label: "Viral Rush",
      runs: 1200,
      baseSurvived: 365,
      propSurvived: 986,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
    {
      id: "staff",
      code: "SCN-05",
      label: "Staff Only",
      runs: 1000,
      baseSurvived: 312,
      propSurvived: 842,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
    {
      id: "stroller",
      code: "SCN-06",
      label: "Stroller Entry",
      runs: 800,
      baseSurvived: 226,
      propSurvived: 610,
      baseWaitSec: 105,
      propWaitSec: 18,
    },
  ],
};

test("buildTenKCells generates 10,000 deterministic store cells across 500 families x 20 variants", () => {
  const { cells, stats } = buildTenKCells(sampleConfig);
  assert.equal(cells.length, 10000);
  assert.equal(stats.executedCount, 10000);
  assert.equal(cells[0].runIndex, 1);
  assert.equal(cells[0].familyId, 1);
  assert.equal(cells[0].variantId, 1);
  assert.equal(cells[9999].runIndex, 10000);
  assert.equal(cells[9999].familyId, 500);
  assert.equal(cells[9999].variantId, 20);
  assert.ok(stats.propSurvived > stats.baseSurvived);
  assert.ok(stats.rescuedCount > 3000);
});

test("findBenchmarkStoreCells identifies optimal, rescued, and worst bottleneck runs", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const benches = findBenchmarkStoreCells(cells);
  assert.equal(benches.optimal.proposedSurvived, true);
  assert.equal(benches.rescued.rescuedByDesign, true);
  assert.equal(benches.worst.proposedSurvived, false);
  assert.ok(benches.optimal.proposedWaitSec < benches.worst.proposedWaitSec);
});

test("computeCell36MonthTrajectory calculates 36-month cumulative ROI and break-even month", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const benches = findBenchmarkStoreCells(cells);
  const optTraj = computeCell36MonthTrajectory(benches.optimal);
  assert.equal(optTraj.months, 36);
  assert.equal(optTraj.proposedCumUsdK.length, 36);
  assert.equal(optTraj.baselineCumUsdK.length, 36);
  assert.ok(optTraj.breakEvenMonth !== null && optTraj.breakEvenMonth <= 24);
  assert.ok(optTraj.month36ProposedUsdK > optTraj.month36BaselineUsdK);

  const worstTraj = computeCell36MonthTrajectory(benches.worst);
  assert.equal(worstTraj.breakEvenMonth, null);
});

test("exportTenKCellsCsv serializes all 10,000 store runs with header", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const csv = exportTenKCellsCsv(cells);
  const lines = csv.split("\n");
  assert.equal(lines.length, 10001);
  assert.ok(lines[0].startsWith("run_index,ai_family_id,variant_id"));
});

test("every generated cell derives payback and month-36 totals from its cashflow trajectory", () => {
  const { cells } = buildTenKCells(sampleConfig);
  for (const cell of cells) {
    const trajectory = computeCell36MonthTrajectory(cell);
    const firstRecoveredIndex = trajectory.proposedCumUsdK.findIndex((value) => value >= 0);
    const payback = firstRecoveredIndex < 0 ? null : firstRecoveredIndex + 1;
    assert.equal(trajectory.breakEvenMonth, payback);
    assert.equal(cell.breakEvenMonth, payback);
    assert.equal(cell.month36BaselineUsdK, trajectory.baselineCumUsdK[35]);
    assert.equal(cell.month36ProposedUsdK, trajectory.proposedCumUsdK[35]);
    assert.equal(cell.month36DeltaUsdK, trajectory.month36DeltaUsdK);
    if (!cell.proposedSurvived) assert.equal(cell.breakEvenMonth, null);
  }
});

test("unrecovered cashflow never falls back to a stored payback month", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const cell = { ...cells[0], monthlyNetKrwM: 0.1, breakEvenMonth: 8 };
  const trajectory = computeCell36MonthTrajectory(cell);
  assert.equal(cell.proposedSurvived, true);
  assert.equal(trajectory.breakEvenMonth, null);
  assert.ok(trajectory.proposedCumUsdK.every((value) => value < 0));
});

test("CSV and inspector sparkline share cashflow payback and month-36 values", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const benches = findBenchmarkStoreCells(cells);
  const selected = [
    benches.optimal,
    benches.worst,
    { ...benches.optimal, monthlyNetKrwM: 0.1, breakEvenMonth: 8 },
  ];
  const [headerLine, ...rows] = exportTenKCellsCsv(selected).split("\n");
  const headers = headerLine.split(",");
  selected.forEach((cell, index) => {
    const trajectory = renderCellCashflowSparkline(null, cell);
    const values = rows[index].split(",");
    const valueFor = (name: string) => values[headers.indexOf(name)];
    assert.equal(valueFor("break_even_month"), String(trajectory.breakEvenMonth ?? ""));
    assert.equal(Number(valueFor("month36_baseline_usd_k")), trajectory.month36BaselineUsdK);
    assert.equal(Number(valueFor("month36_proposed_usd_k")), trajectory.month36ProposedUsdK);
    assert.equal(Number(valueFor("month36_delta_usd_k")), trajectory.month36DeltaUsdK);
    assert.equal(valueFor("diagnosis"), `"${cell.failureReason}"`);
  });
});

test("Top 1% selects exactly 100 deterministic ranked runs without changing input order", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const originalOrder = cells.map((cell) => cell.runIndex);
  const top = findTop100StoreCells(cells);
  assert.equal(top.length, 100);
  assert.equal(new Set(top.map((cell) => cell.runIndex)).size, 100);
  assert.equal(top[0], findBenchmarkStoreCells(cells).optimal);
  assert.ok(top.every((cell) => cell.proposedSurvived && !cell.marginalRisk));
  assert.deepEqual(
    findTop100StoreCells([...cells].reverse()).map((cell) => cell.runIndex),
    top.map((cell) => cell.runIndex)
  );
  assert.deepEqual(cells.map((cell) => cell.runIndex), originalOrder);
});

test("Top 100 ranks survival, risk, profit, wait, clearance, then run index for ties", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const reference = {
    ...cells[0],
    proposedSurvived: true,
    marginalRisk: false,
    monthlyNetKrwM: 0,
    proposedWaitSec: 10,
    aisleClearanceM: 1,
  };
  const ranked = findTop100StoreCells([
    { ...reference, runIndex: 70, proposedSurvived: false, monthlyNetKrwM: 1000 },
    { ...reference, runIndex: 60, marginalRisk: true, monthlyNetKrwM: 100 },
    { ...reference, runIndex: 9 },
    { ...reference, runIndex: 50, aisleClearanceM: 1.1 },
    { ...reference, runIndex: 2 },
    { ...reference, runIndex: 40, proposedWaitSec: 8 },
    { ...reference, runIndex: 30, monthlyNetKrwM: 1 },
  ]);
  assert.deepEqual(ranked.map((cell) => cell.runIndex), [30, 40, 50, 2, 9, 60, 70]);
  assert.deepEqual(findTop100StoreCells([]), []);
});

test("Top 100 retains its cardinality when fewer than 100 runs survive", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const limitedSurvivors = cells.map((cell, index) => ({
    ...cell,
    proposedSurvived: index < 3,
    marginalRisk: false,
  }));
  const top = findTop100StoreCells(limitedSurvivors);
  assert.equal(top.length, 100);
  assert.equal(top.filter((cell) => cell.proposedSurvived).length, 3);
  assert.ok(top.slice(0, 3).every((cell) => cell.proposedSurvived));
});

test("CSV labels every illustrative store run with source_tag=assumed", () => {
  const { cells } = buildTenKCells(sampleConfig);
  const [header, ...rows] = exportTenKCellsCsv(cells).split("\n");
  const sourceTagColumn = header.split(",").indexOf("source_tag");
  assert.ok(sourceTagColumn >= 0);
  assert.equal(rows.length, 10000);
  assert.ok(rows.every((row) => row.split(",")[sourceTagColumn] === "assumed"));
});
