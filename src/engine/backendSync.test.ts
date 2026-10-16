import test from "node:test";
import assert from "node:assert/strict";
import { summarizeBackendRun } from "./backendSync.ts";

test("backend counts use result rows and oracle constraints, never advertised totals", () => {
  const summary = summarizeBackendRun({
    meta: { totalRuns: 10000 },
    run: {
      runId: "measured-run",
      status: { replay: true },
      results: [
        { constraintsOk: true, deathMonth: null, survivedMonths: 36 },
        { constraintsOk: false, deathMonth: null, survivedMonths: 36 },
        { constraintsOk: true, deathMonth: 12, survivedMonths: 12 },
      ],
    },
  });
  assert.deepEqual(summary, { runId: "measured-run", total: 3, survived: 1, replay: true });
});

test("missing engine results cannot silently become an assumed 84.2 percent success", () => {
  assert.throws(() => summarizeBackendRun({ meta: { totalRuns: 10000 } }));
});
