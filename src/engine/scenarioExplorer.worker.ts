import { run } from "./rehearsalCore";
import type { Scene } from "./rehearsalCore";
import { generateScenarios, SCENARIO_COUNT } from "./scenarioExplorer";
import type { DetailedScenarioResult, ScenarioCategory, ScenarioWorkerMessage } from "./scenarioExplorer";

const workerScope = globalThis as unknown as {
  postMessage: (message: ScenarioWorkerMessage) => void;
  onmessage: (event: MessageEvent<{ scene: Scene; categoryId: ScenarioCategory }>) => void;
};

workerScope.onmessage = (event) => {
  const { scene, categoryId } = event.data;
  const started = performance.now();
  try {
    const { candidates } = generateScenarios(categoryId);
    const results: DetailedScenarioResult[] = [];
    let routeBlockedCount = 0;
    let conservationFailureCount = 0;
    const progress = () => workerScope.postMessage({ type: "progress", progress: { completed: results.length, total: SCENARIO_COUNT, elapsedMs: performance.now() - started, routeBlockedCount, conservationFailureCount } });
    progress();
    for (const candidate of candidates) {
      const result = run(scene, {
        arrivalsPerMin: candidate.arrivalPerMin,
        serviceSec: candidate.serviceSec,
        orderStaff: candidate.orderStaff,
        pickupStaff: candidate.pickupStaff,
        bodyWidth: candidate.bodyWidthM,
        seed: candidate.seed,
        duration: 600,
      });
      const conservation = result.checks.conservation && result.checks.finalFrameConservation;
      if (result.routeBlocked) routeBlockedCount++;
      if (!conservation) conservationFailureCount++;
      results.push({ id: candidate.id, index: candidate.index, arrivalCount: result.arrivalCount, completed: result.completed, active: result.active, meanWaitSec: result.meanWaitSec, p90WaitSec: result.p90WaitSec, routeBlocked: result.routeBlocked, walkDistance: result.walkDistance, conservation });
      if (results.length % 100 === 0) progress();
    }
    workerScope.postMessage({ type: "complete", receipt: {
      mode: "detailed_core_batch", categoryId, completed: SCENARIO_COUNT, total: SCENARIO_COUNT, uniqueIdCount: new Set(results.map((row) => row.id)).size, elapsedMs: performance.now() - started, seed: 42, durationSec: 600, sceneSnapshot: scene,
      summary: { routeBlockedCount, routeOpenCount: SCENARIO_COUNT - routeBlockedCount, conservationFailureCount }, results,
    } });
  } catch (error) {
    workerScope.postMessage({ type: "error", error: error instanceof Error ? error.message : String(error) });
  }
};
