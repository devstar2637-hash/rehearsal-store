import type {
  Constraints,
  ExtendedRunResult,
  StoreDesign,
} from "./types.ts";
import { buildRunCsv } from "./format.ts";

export interface RunRequestPayload {
  input: {
    constraints: Constraints;
    baseDesign: StoreDesign;
  };
  seed: number;
  n: 1000 | 10000;
}

export async function postRun(
  payload: RunRequestPayload
): Promise<{ runId: string }> {
  const res = await fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`POST /run failed with status ${res.status}`);
  }
  return (await res.json()) as { runId: string };
}

export async function getRun(runId: string): Promise<ExtendedRunResult> {
  try {
    const res = await fetch(`/runs/${encodeURIComponent(runId)}`);
    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as { result: ExtendedRunResult };
        if (body && body.result) {
          return body.result;
        }
      }
    }
  } catch {
    // Fall back to sample_result.json if static server without /runs/:id route
  }

  const fallbackRes = await fetch("/sample_result.json");
  if (!fallbackRes.ok) {
    throw new Error("Failed to load sample_result.json fallback");
  }
  const sample = (await fallbackRes.json()) as ExtendedRunResult;
  if (sample.status) {
    sample.status.replay = true;
  }
  return sample;
}

export function getExportCsvUrl(runId: string): string {
  return `/runs/${encodeURIComponent(runId)}/export?format=csv`;
}

export async function exportRunCsv(
  runId: string,
  currentResult: ExtendedRunResult
): Promise<{ csvText: string; fromServer: boolean }> {
  try {
    const res = await fetch(getExportCsvUrl(runId));
    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
        const csvText = await res.text();
        if (csvText.startsWith("runId,")) {
          return { csvText, fromServer: true };
        }
      }
    }
  } catch {
    // Fallback to client CSV serializer from RunResult if static host
  }
  return { csvText: buildRunCsv(currentResult), fromServer: false };
}
