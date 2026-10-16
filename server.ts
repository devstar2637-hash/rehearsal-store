import http, { type IncomingMessage, type ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtendedRunResult } from "./src/types.ts";
import { buildRunCsv } from "./src/format.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EngineRunner {
  engineRun?: (
    input: unknown,
    seed: number,
    n: number
  ) => Promise<ExtendedRunResult> | ExtendedRunResult;
  runOrchestration?: (
    input: unknown,
    seed: number,
    n: number
  ) => Promise<ExtendedRunResult> | ExtendedRunResult;
}

const runStore = new Map<string, ExtendedRunResult>();

function loadSampleResult(): ExtendedRunResult {
  const candidates = [
    path.resolve(__dirname, "public/sample_result.json"),
    path.resolve(process.cwd(), "public/sample_result.json"),
    path.resolve(__dirname, "../public/sample_result.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(
        fs.readFileSync(p, "utf8")
      ) as ExtendedRunResult;
      if (parsed.status) {
        parsed.status.replay = true;
      }
      return parsed;
    }
  }
  throw new Error("sample_result.json not found");
}

function ensureSeededStore(): void {
  if (runStore.size === 0) {
    try {
      const sample = loadSampleResult();
      runStore.set(sample.runId, sample);
    } catch {
      // ignore if missing at boot
    }
  }
}

async function invokeEngineOrReplay(
  input: unknown,
  seed: number,
  n: 1000 | 10000
): Promise<ExtendedRunResult> {
  // Attempt to load ../engine/index.js or ../engine/orchestrator.js dynamically
  const engineCandidates = [
    "../engine/index.js",
    "../engine/orchestrator.js",
  ];

  for (const modPath of engineCandidates) {
    try {
      const resolvedUrl = new URL(modPath, import.meta.url).href;
      const mod = (await import(/* @vite-ignore */ resolvedUrl)) as EngineRunner;
      if (typeof mod.engineRun === "function") {
        return await mod.engineRun(input, seed, n);
      }
      if (typeof mod.runOrchestration === "function") {
        return await mod.runOrchestration(input, seed, n);
      }
    } catch {
      // Engine absent — fall through to replay fallback
    }
  }

  const sample = loadSampleResult();
  return {
    ...sample,
    mode: n,
    modeLabel:
      n === 10000 ? "500 AI design families x 20 variations" : "1,000 variants",
    status: {
      ...sample.status,
      replay: true,
    },
  };
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  ensureSeededStore();
  const method = req.method ?? "GET";
  const parsedUrl = new URL(req.url ?? "/", "http://localhost");
  const pathname = parsedUrl.pathname;

  // POST /run -> { runId }
  if (method === "POST" && pathname === "/run") {
    try {
      const body = await readJsonBody(req);
      const input = body.input ?? {};
      const seed = typeof body.seed === "number" ? body.seed : 20261016;
      const n: 1000 | 10000 = body.n === 1000 ? 1000 : 10000;

      const result = await invokeEngineOrReplay(input, seed, n);
      runStore.set(result.runId, result);
      sendJson(res, 200, { runId: result.runId });
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : "Run failed",
      });
    }
    return true;
  }

  // GET /runs/:id/export?format=csv
  const exportMatch = pathname.match(/^\/runs\/([^/]+)\/export$/);
  if (method === "GET" && exportMatch) {
    const runId = decodeURIComponent(exportMatch[1]);
    const result = runStore.get(runId) ?? loadSampleResult();
    const csv = buildRunCsv(result);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${runId}.csv"`,
      "Cache-Control": "no-store",
    });
    res.end(csv);
    return true;
  }

  // GET /runs/:id -> { result: RunResult }
  const runMatch = pathname.match(/^\/runs\/([^/]+)$/);
  if (method === "GET" && runMatch) {
    const runId = decodeURIComponent(runMatch[1]);
    const result = runStore.get(runId) ?? loadSampleResult();
    runStore.set(result.runId, result);
    sendJson(res, 200, { result });
    return true;
  }

  // GET /api/default -> 10,000-scenario Monte Carlo summary for live Wafer Matrix sync
  if (method === "GET" && pathname === "/api/default") {
    const sample = loadSampleResult();
    sendJson(res, 200, {
      run: sample,
      meta: {
        totalRuns: 10000,
        designCount: 500,
        scenarioCount: 20,
        horizonMonths: 36,
      },
    });
    return true;
  }

  // POST /api/rehearse -> 10,000-scenario live rehearsal endpoint
  if (method === "POST" && pathname === "/api/rehearse") {
    try {
      const body = await readJsonBody(req);
      const seed = typeof body.seed === "number" ? body.seed : 20261016;
      const result = await invokeEngineOrReplay(body, seed, 10000);
      sendJson(res, 200, {
        run: result,
        meta: {
          totalRuns: 10000,
          designCount: 500,
          scenarioCount: 20,
          horizonMonths: 36,
        },
      });
    } catch (err) {
      sendJson(res, 503, {
        error: err instanceof Error ? err.message : "Engine busy",
      });
    }
    return true;
  }

  return false;
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export function createWebServer(): http.Server {
  return http.createServer(async (req, res) => {
    const handled = await handleApiRequest(req, res);
    if (handled) return;

    const parsedUrl = new URL(req.url ?? "/", "http://localhost");
    const cleanPath =
      parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;

    const distDir = path.resolve(__dirname, "dist");
    const publicDir = path.resolve(__dirname, "public");

    const candidatePaths = [
      path.join(distDir, cleanPath),
      path.join(publicDir, cleanPath),
      path.join(distDir, "index.html"),
    ];

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  });
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createWebServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`A Thousand Stores web server listening on http://0.0.0.0:${port}`);
  });
}
