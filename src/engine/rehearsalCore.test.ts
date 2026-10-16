import test from "node:test";
import assert from "node:assert/strict";
import { makeScene, run, canStand } from "./rehearsalCore.ts";
import { buildTenKCells } from "./tenKMatrixEngine.ts";

test("seed 42, 10min, 4 arrivals/min matches exact reference calculations for baseline, layout-only, and layout+staff", () => {
  const baseScene = makeScene("baseline");
  const propScene = makeScene("proposed");

  const baseRes = run(baseScene, {
    arrivalsPerMin: 4,
    orderStaff: 1,
    pickupStaff: 1,
    serviceSec: 20,
    seed: 42,
    duration: 600,
    bodyWidth: 0.65,
  });

  const layoutOnlyRes = run(propScene, {
    arrivalsPerMin: 4,
    orderStaff: 1,
    pickupStaff: 1,
    serviceSec: 20,
    seed: 42,
    duration: 600,
    bodyWidth: 0.65,
  });

  const bothRes = run(propScene, {
    arrivalsPerMin: 4,
    orderStaff: 1,
    pickupStaff: 2,
    serviceSec: 20,
    seed: 42,
    duration: 600,
    bodyWidth: 0.65,
  });

  assert.equal(baseRes.arrivalCount, 53);
  assert.equal(baseRes.completed, 27);
  assert.equal(baseRes.active, 26);
  assert.equal(Number(baseRes.walkDistance?.toFixed(2)), 18.75);
  assert.equal(Number(baseRes.meanWaitSec?.toFixed(2)), 104.76);

  assert.equal(layoutOnlyRes.completed, 27);
  assert.equal(layoutOnlyRes.active, 26);
  assert.equal(Number(layoutOnlyRes.walkDistance?.toFixed(2)), 16.48);
  assert.equal(Number(layoutOnlyRes.meanWaitSec?.toFixed(2)), 105.63);

  assert.equal(bothRes.completed, 47);
  assert.equal(bothRes.active, 6);
  assert.equal(Number(bothRes.meanWaitSec?.toFixed(2)), 17.89);

  assert.equal(baseRes.checks.conservation, true);
  assert.equal(bothRes.checks.finalFrameConservation, true);
});

test("blocked route is detected when display obstacle blocks entrance", () => {
  const blockedScene = makeScene("proposed");
  const disp = blockedScene.objects.find((o) => o.id === "display")!;
  disp.x = 3.0;
  disp.y = 7.7; // directly across entrance at (4.5, 8.1)
  const res = run(blockedScene, { seed: 42 });
  assert.equal(res.routeBlocked, true);
  assert.equal(res.meanWaitSec, null);
});

test("canStand checks footprint collision accurately", () => {
  const baseScene = makeScene("baseline");
  assert.equal(canStand(baseScene, baseScene.entrance, 0.65), true);
  // Inside the baseline display at x=3..6.8, y=6.2..7.0
  assert.equal(canStand(baseScene, { x: 4.5, y: 6.5 }, 0.65), false);
});

test("buildTenKCells generates 10,000 parallel store scenario cells across 500 families x 20 variants", () => {
  const { cells, stats } = buildTenKCells({
    categoryKey: "coffee",
    designKey: "express",
    activeScenario: "both",
    baseWaitSec: 105,
    propWaitSec: 18,
    baseSurvivedTotal: 3140,
    propSurvivedTotal: 8420,
    scenarios: [
      { id: "both", code: "SCN-01", label: "Standard Ops", runs: 3200, baseSurvived: 1120, propSurvived: 2880, baseWaitSec: 105, propWaitSec: 18 },
      { id: "rainy", code: "SCN-02", label: "Rainy Surge", runs: 2400, baseSurvived: 720, propSurvived: 1920, baseWaitSec: 105, propWaitSec: 18 },
      { id: "layout", code: "SCN-03", label: "Solo Staff", runs: 1400, baseSurvived: 420, propSurvived: 980, baseWaitSec: 105, propWaitSec: 18 },
      { id: "influencer", code: "SCN-04", label: "Viral Rush", runs: 1200, baseSurvived: 360, propSurvived: 980, baseWaitSec: 105, propWaitSec: 18 },
      { id: "staff", code: "SCN-05", label: "Staff Only", runs: 1000, baseSurvived: 320, propSurvived: 840, baseWaitSec: 105, propWaitSec: 18 },
      { id: "stroller", code: "SCN-06", label: "Stroller Entry", runs: 800, baseSurvived: 200, propSurvived: 610, baseWaitSec: 105, propWaitSec: 18 },
    ],
  });

  assert.equal(cells.length, 10000);
  assert.equal(stats.executedCount, 10000);
  assert.equal(cells[0].runIndex, 1);
  assert.equal(cells[9999].runIndex, 10000);
  assert.equal(cells[9999].familyId, 500);
  assert.equal(cells[9999].variantId, 20);
  assert.equal(stats.propSurvived > stats.baseSurvived, true);
  assert.equal(stats.rescuedCount > 4000, true);
});

