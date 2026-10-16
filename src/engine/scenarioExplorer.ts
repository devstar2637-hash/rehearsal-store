import type { Scene } from "./rehearsalCore";

export type ScenarioCategory = "coffee" | "bakery" | "matcha" | "wine";
export type ScenarioStatus = "within_capacity" | "near_capacity" | "over_capacity";
export const SCENARIO_COUNT = 10_000 as const;

// Design ranges around existing studio presets, not observed market distributions.
const RANGES: Record<ScenarioCategory, { arrival: number[]; service: number[] }> = {
  coffee: { arrival: [1, 2, 3, 4, 4.5, 5, 5.5, 6, 7, 8], service: [8, 12, 16, 18, 20, 24, 28, 32, 38, 45] },
  bakery: { arrival: [1, 2, 3, 4, 4.5, 5, 5.5, 6, 7, 8], service: [8, 12, 18, 21, 24, 27, 30, 34, 39, 45] },
  matcha: { arrival: [0.5, 1, 2, 3, 3.5, 4, 4.5, 5, 6, 7], service: [8, 10, 12, 15, 18, 21, 24, 28, 34, 42] },
  wine: { arrival: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6], service: [8, 14, 18, 23, 28, 31, 34, 38, 41, 45] },
};

export interface ScenarioCandidate {
  id: string;
  index: number;
  categoryId: ScenarioCategory;
  arrivalPerMin: number;
  serviceSec: number;
  orderStaff: number;
  pickupStaff: number;
  bodyWidthM: number;
  seed: number;
  orderUtilization: number;
  pickupUtilization: number;
  bottleneckUtilization: number;
  status: ScenarioStatus;
}

export interface ScenarioSet {
  categoryId: ScenarioCategory;
  candidates: ScenarioCandidate[];
  metadata: {
    count: typeof SCENARIO_COUNT;
    detailedSimulationCount: 0;
    executionScope: "analytic_screen";
    label: string;
    axes: { arrivalsPerMin: number[]; serviceSec: number[]; orderStaff: number[]; pickupStaff: number[]; bodyWidth: number[] };
    counts: { withinCapacity: number; nearCapacity: number; overCapacity: number };
    assumptions: string[];
  };
}

export function generateScenarios(categoryId: ScenarioCategory): ScenarioSet {
  const range = RANGES[categoryId];
  if (!range) throw new RangeError("Unknown scenario category");
  const axes = {
    arrivalsPerMin: [...range.arrival],
    serviceSec: [...range.service],
    orderStaff: [1, 2, 3, 4, 5],
    pickupStaff: [1, 2, 3, 4, 5],
    bodyWidth: [0.5, 0.65, 0.9, 1.2],
  };
  const candidates: ScenarioCandidate[] = [];
  const counts = { withinCapacity: 0, nearCapacity: 0, overCapacity: 0 };
  for (const arrivalPerMin of axes.arrivalsPerMin)
    for (const serviceSec of axes.serviceSec)
      for (const orderStaff of axes.orderStaff)
        for (const pickupStaff of axes.pickupStaff)
          for (const bodyWidthM of axes.bodyWidth) {
            // Exact means of rehearsalCore.requirements(): order 0.45, pickup 1.
            // This is a load screen only; it does not predict wait or test geometry.
            const orderUtilization = (arrivalPerMin * serviceSec * 0.45) / (60 * orderStaff);
            const pickupUtilization = (arrivalPerMin * serviceSec) / (60 * pickupStaff);
            const bottleneckUtilization = Math.max(orderUtilization, pickupUtilization);
            const status: ScenarioStatus = bottleneckUtilization >= 1 ? "over_capacity" : bottleneckUtilization >= 0.85 ? "near_capacity" : "within_capacity";
            if (status === "over_capacity") counts.overCapacity++;
            else if (status === "near_capacity") counts.nearCapacity++;
            else counts.withinCapacity++;
            const index = candidates.length;
            candidates.push({ id: `${categoryId}-${String(index + 1).padStart(5, "0")}`, index, categoryId, arrivalPerMin, serviceSec, orderStaff, pickupStaff, bodyWidthM, seed: 42, orderUtilization, pickupUtilization, bottleneckUtilization, status });
          }
  if (candidates.length !== SCENARIO_COUNT) throw new Error("Scenario coverage count mismatch");
  return {
    categoryId,
    candidates,
    metadata: {
      count: SCENARIO_COUNT,
      detailedSimulationCount: 0,
      executionScope: "analytic_screen",
      label: "합성 조건 10,000개 · 부하 사전 점검",
      axes,
      counts,
      assumptions: [
        "10 arrival levels × 10 service levels × 5 order staff levels × 5 pickup staff levels × 4 body widths = 10,000 unique conditions per category.",
        "Ranges are design assumptions around existing studio presets; they are not observed market frequencies or equally probable outcomes.",
        "Analytic load = arrivals/minute × mean service seconds ÷ (60 × staff). Core mean order multiplier is 0.45; pickup multiplier is 1.",
        "At or above 1.0 is over capacity; 0.85 to below 1.0 is a design warning. Below 0.85 is only within this assumed service capacity, not a successful business or a verified queue.",
        "The analytic screen does not test route accessibility, body clearance, finite-horizon waiting, sales, profit, or survival. Body width affects the detailed core run only.",
        "Detailed execution is separate and explicitly requested. Each detailed case uses the selected proposed scene, seed 42, and a 600-second synthetic horizon.",
      ],
    },
  };
}

export interface ScenarioBatchProgress {
  completed: number;
  total: typeof SCENARIO_COUNT;
  elapsedMs: number;
  routeBlockedCount: number;
  conservationFailureCount: number;
}

export interface DetailedScenarioResult {
  id: string;
  index: number;
  arrivalCount: number;
  completed: number;
  active: number;
  meanWaitSec: number | null;
  p90WaitSec: number | null;
  routeBlocked: boolean;
  walkDistance: number | null;
  conservation: boolean;
}

export interface ScenarioBatchReceipt {
  mode: "detailed_core_batch";
  categoryId: ScenarioCategory;
  completed: typeof SCENARIO_COUNT;
  total: typeof SCENARIO_COUNT;
  uniqueIdCount: number;
  elapsedMs: number;
  seed: 42;
  durationSec: 600;
  sceneSnapshot: Scene;
  summary: { routeBlockedCount: number; routeOpenCount: number; conservationFailureCount: number };
  results: DetailedScenarioResult[];
}

export type ScenarioWorkerMessage =
  | { type: "progress"; progress: ScenarioBatchProgress }
  | { type: "complete"; receipt: ScenarioBatchReceipt }
  | { type: "error"; error: string };

/** One bounded worker; rejected/aborted work is never reported as 10k completed. */
export function runScenarioBatch(
  scene: Scene,
  categoryId: ScenarioCategory,
  onProgress: (progress: ScenarioBatchProgress) => void,
  options: { signal?: AbortSignal; maxDurationMs?: number } = {},
): Promise<ScenarioBatchReceipt> {
  if (options.signal?.aborted) return Promise.reject(new DOMException("Scenario batch cancelled", "AbortError"));
  if (!RANGES[categoryId]) return Promise.reject(new RangeError("Unknown scenario category"));
  const maxDurationMs = options.maxDurationMs ?? 120_000;
  if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0 || maxDurationMs > 300_000) return Promise.reject(new RangeError("Batch budget must be 1–300000 milliseconds"));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./scenarioExplorer.worker.ts", import.meta.url), { type: "module" });
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const fail = (error: Error) => { if (!settled) { settled = true; cleanup(); reject(error); } };
    const abort = () => fail(new DOMException("Scenario batch cancelled", "AbortError"));
    const timer = setTimeout(() => fail(new Error(`Scenario batch exceeded ${maxDurationMs} ms; incomplete work discarded`)), maxDurationMs);
    options.signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<ScenarioWorkerMessage>) => {
      if (settled) return;
      const message = event.data;
      if (message.type === "progress") onProgress(message.progress);
      else if (message.type === "error") fail(new Error(message.error));
      else if (message.type === "complete") {
        const receipt = message.receipt;
        const ids = new Set(receipt.results.map((row) => row.id));
        if (receipt.completed !== SCENARIO_COUNT || receipt.results.length !== SCENARIO_COUNT || ids.size !== SCENARIO_COUNT) {
          fail(new Error("Incomplete or duplicate detailed scenario result"));
          return;
        }
        settled = true;
        cleanup();
        resolve(receipt);
      }
    };
    worker.onerror = (event) => fail(new Error(event.message || "Scenario worker failed"));
    worker.postMessage({ scene: structuredClone(scene), categoryId });
  });
}
