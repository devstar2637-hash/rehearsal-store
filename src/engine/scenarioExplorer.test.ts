import test from "node:test";
import assert from "node:assert/strict";
import { generateScenarios, SCENARIO_COUNT } from "./scenarioExplorer.ts";

test("each category enumerates all 10 × 10 × 5 × 5 × 4 unique conditions without claiming detailed execution", () => {
  for (const category of ["coffee", "bakery", "matcha", "wine"] as const) {
    const set = generateScenarios(category);
    assert.equal(set.candidates.length, 10 * 10 * 5 * 5 * 4);
    assert.equal(set.metadata.count, SCENARIO_COUNT);
    assert.equal(set.metadata.detailedSimulationCount, 0);
    assert.equal(set.metadata.executionScope, "analytic_screen");
    assert.equal(new Set(set.candidates.map((row) => row.id)).size, 10000);
    assert.equal(new Set(set.candidates.map((row) => [row.arrivalPerMin, row.serviceSec, row.orderStaff, row.pickupStaff, row.bodyWidthM].join("/"))).size, 10000);
    assert.deepEqual(set.candidates.map((row) => row.index), Array.from({ length: 10000 }, (_, i) => i));
    const { withinCapacity, nearCapacity, overCapacity } = set.metadata.counts;
    assert.equal(withinCapacity + nearCapacity + overCapacity, 10000);
  }
});

test("load screen matches independently hand-calculated limiting cases, with no body-clearance claim", () => {
  const coffee = generateScenarios("coffee");
  const find = (arrival: number, service: number, order: number, pickup: number, width = 0.65) => coffee.candidates.find((r) => r.arrivalPerMin === arrival && r.serviceSec === service && r.orderStaff === order && r.pickupStaff === pickup && r.bodyWidthM === width)!;
  const exactCapacity = find(3, 20, 1, 1);
  assert.equal(exactCapacity.pickupUtilization, 1);
  assert.equal(exactCapacity.orderUtilization, 0.45);
  assert.equal(exactCapacity.status, "over_capacity");
  assert.equal(find(3, 18, 1, 1).status, "near_capacity"); // 54 seconds required per minute = 0.9.
  assert.equal(find(3, 16, 1, 1).status, "within_capacity"); // 48/60 = 0.8.
  assert.equal(find(8, 45, 1, 5).bottleneckUtilization, 2.7); // order bottleneck: 8 × 45 × .45 / 60.
  assert.equal(find(3, 16, 1, 1, 0.5).status, find(3, 16, 1, 1, 1.2).status);
  assert.match(coffee.metadata.assumptions.join(" "), /does not test route accessibility/);
});

test("category defaults are present and invalid categories are rejected", () => {
  for (const [category, arrival, service] of [["coffee", 4, 20], ["bakery", 4.5, 24], ["matcha", 3.5, 18], ["wine", 2.5, 28]] as const) {
    const set = generateScenarios(category);
    assert.ok(set.candidates.some((row) => row.arrivalPerMin === arrival && row.serviceSec === service));
    assert.equal(set.candidates[0].seed, 42);
  }
  assert.throws(() => generateScenarios("unknown" as never), /Unknown scenario category/);
});
