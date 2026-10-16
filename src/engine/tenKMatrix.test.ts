import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTenKCells,
  computeCell36MonthTrajectory,
  exportTenKCellsCsv,
  findBenchmarkStoreCells,
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
