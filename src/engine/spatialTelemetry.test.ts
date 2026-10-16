import assert from "node:assert/strict";
import { test } from "node:test";
import { makeScene } from "./rehearsalCore.ts";
import { entranceFixtureGap, spatialMetricSummary, spatialWaitDelta, spatialWaitLabel } from "./spatialTelemetry.ts";

test("blocked and unavailable spatial results never fabricate successful metrics", () => {
  const blocked = { routeBlocked: true, meanWaitSec: null, completed: 0, walkDistance: null };
  const valid = { routeBlocked: false, meanWaitSec: 105, completed: 18, walkDistance: 17.8 };
  assert.equal(spatialWaitLabel(blocked), "Blocked");
  assert.match(spatialMetricSummary(blocked), /Wait Blocked.*Served 0.*Walk N\/A/);
  assert.equal(spatialWaitLabel(undefined), "N/A");
  assert.equal(spatialWaitDelta(valid, blocked), "comparison unavailable");
  assert.equal(spatialWaitDelta(valid, { ...valid, meanWaitSec: null }), "comparison unavailable");
  assert.equal(spatialWaitDelta(valid, { ...valid, meanWaitSec: 18 }), "87s faster");
});

test("entrance gap is geometric distance rather than a fabricated choke width", () => {
  const scene = makeScene("proposed");
  const display = scene.objects.find((object) => object.id === "display")!;
  const atEntrance = { ...display, x: 3, y: 7.7 };
  assert.equal(entranceFixtureGap(scene, atEntrance), 0);
  assert.ok(entranceFixtureGap(scene, display) > 0);
});
