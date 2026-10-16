import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import fs from "node:fs";
import { createWebServer, type EngineProxyOptions } from "./server.ts";

async function listen(t: TestContext, server: http.Server): Promise<string> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
        server.closeAllConnections();
      })
  );
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

async function proxyWithUpstream(
  t: TestContext,
  handler: http.RequestListener,
  options: EngineProxyOptions = {}
): Promise<string> {
  const engineBaseUrl = await listen(t, http.createServer(handler));
  return listen(t, createWebServer({ engineBaseUrl, ...options }));
}

for (const pathname of ["/api/default", "/api/summary", "/api/health"]) {
  test(`${pathname} preserves upstream JSON, status, and query parameters`, async (t) => {
    let upstreamRequest: { method?: string; url?: string } | undefined;
    const payload = '{ "run": {"runId":"real-run", "results":[]}, "measured":37 }';
    const query = "?seed=7&scenario=a%2Fb&scenario=c&label=hello+world";
    const baseUrl = await proxyWithUpstream(t, (req, res) => {
      upstreamRequest = { method: req.method, url: req.url };
      res.writeHead(207, { "Content-Type": "application/json; charset=utf-8" });
      res.end(payload);
    });

    const response = await fetch(`${baseUrl}${pathname}${query}`);
    assert.equal(response.status, 207);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.text(), payload);
    assert.deepEqual(upstreamRequest, { method: "GET", url: `${pathname}${query}` });
  });
}

test("rehearsal forwards the exact POST body to /api/run with compact results and existing queries", async (t) => {
  let observed: { method?: string; url?: string; contentType?: string; accept?: string; body: string } | undefined;
  const requestBody = '{ "seed": 123, "input": {"label":"a+b", "n":37} }\n';
  const payload = '{"run":{"runId":"measured-new-run","results":[{"constraintsOk":true,"deathMonth":null,"survivedMonths":36}]}}';
  const baseUrl = await proxyWithUpstream(t, (req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      observed = {
        method: req.method,
        url: req.url,
        contentType: req.headers["content-type"],
        accept: req.headers.accept,
        body: Buffer.concat(chunks).toString("utf8"),
      };
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(payload);
    });
  });

  const response = await fetch(`${baseUrl}/api/rehearse?seed=7&scenario=a%2Fb&scenario=c&summary=0&summary=0`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json" },
    body: requestBody,
  });

  assert.equal(response.status, 201);
  assert.equal(await response.text(), payload);
  assert.ok(observed);
  assert.equal(observed.method, "POST");
  const targetUrl = new URL(observed.url!, "http://localhost");
  assert.equal(targetUrl.pathname, "/api/run");
  assert.equal(targetUrl.searchParams.get("seed"), "7");
  assert.deepEqual(targetUrl.searchParams.getAll("scenario"), ["a/b", "c"]);
  assert.deepEqual(targetUrl.searchParams.getAll("summary"), ["1"]);
  assert.equal(observed.contentType, "application/json; charset=utf-8");
  assert.equal(observed.accept, "application/json");
  assert.equal(observed.body, requestBody);
});

test("rehearsal adds summary=1 without requiring a query string and preserves upstream JSON errors", async (t) => {
  let target: string | undefined;
  const payload = '{"error":"Invalid simulation input","field":"seed"}';
  const baseUrl = await proxyWithUpstream(t, (req, res) => {
    target = req.url;
    req.resume();
    res.writeHead(422, { "Content-Type": "application/json" });
    res.end(payload);
  });
  const response = await fetch(`${baseUrl}/api/rehearse`, { method: "POST", body: "{}" });
  assert.equal(target, "/api/run?summary=1");
  assert.equal(response.status, 422);
  assert.equal(await response.text(), payload);
});

test("upstream HTTP failures preserve non-JSON bodies and status instead of inventing replay data", async (t) => {
  const baseUrl = await proxyWithUpstream(t, (_req, res) => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("engine temporarily unavailable\n");
  });
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "engine temporarily unavailable\n");
});

test("redirects are passed through rather than silently followed", async (t) => {
  let requests = 0;
  const baseUrl = await proxyWithUpstream(t, (_req, res) => {
    requests += 1;
    res.writeHead(307, { Location: "/upstream-login", "Content-Type": "text/plain" });
    res.end("authentication required");
  });
  const response = await fetch(`${baseUrl}/api/default`, { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/upstream-login");
  assert.equal(await response.text(), "authentication required");
  assert.equal(requests, 1);
});

for (const [method, pathname] of [
  ["GET", "/api/default"],
  ["GET", "/api/summary"],
  ["GET", "/api/health"],
  ["POST", "/api/rehearse"],
]) {
  test(`${method} ${pathname} returns a clear 503 on connection failure, without sample fallback`, async (t) => {
    const baseUrl = await proxyWithUpstream(t, (req) => req.socket.destroy());
    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      ...(method === "POST" ? { body: "{}" } : {}),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Engine upstream unavailable. No replay fallback was used.",
    });
  });
}

for (const sendHeaders of [false, true]) {
  test(`timeout returns 503 when upstream stalls ${sendHeaders ? "during its body" : "before its headers"}`, { timeout: 5_000 }, async (t) => {
    const baseUrl = await proxyWithUpstream(t, (_req, res) => {
      if (sendHeaders) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"run":');
      }
    }, { timeoutMs: 100 });
    const response = await fetch(`${baseUrl}/api/summary`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Engine upstream timed out. No replay fallback was used.",
    });
  });
}

test("truncated upstream responses return 503 rather than a partial success", async (t) => {
  const baseUrl = await proxyWithUpstream(t, (_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "100" });
    res.end('{"run":');
  }, { timeoutMs: 100 });
  const response = await fetch(`${baseUrl}/api/default`);
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.match(payload.error, /^Engine upstream (unavailable|timed out)\./);
  assert.equal(payload.run, undefined);
});

test("ENGINE_BASE_URL selects the upstream without exposing configuration secrets on failure", async (t) => {
  const previousBaseUrl = process.env.ENGINE_BASE_URL;
  t.after(() => {
    if (previousBaseUrl === undefined) delete process.env.ENGINE_BASE_URL;
    else process.env.ENGINE_BASE_URL = previousBaseUrl;
  });
  process.env.ENGINE_BASE_URL = await listen(t, http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"service":"configured-engine"}');
  }));
  const baseUrl = await listen(t, createWebServer());
  const response = await fetch(`${baseUrl}/api/health`);
  assert.deepEqual(await response.json(), { service: "configured-engine" });

  process.env.ENGINE_BASE_URL = "http://user:private-token@127.0.0.1/";
  const failedResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(failedResponse.status, 503);
  assert.deepEqual(await failedResponse.json(), {
    error: "Engine upstream unavailable. No replay fallback was used.",
  });
});

test("legacy replay, result export, and static assets remain local", async (t) => {
  let upstreamRequests = 0;
  const baseUrl = await proxyWithUpstream(t, (_req, res) => {
    upstreamRequests += 1;
    res.writeHead(500);
    res.end();
  });
  const sampleText = fs.readFileSync(new URL("./public/sample_result.json", import.meta.url), "utf8");
  const sample = JSON.parse(sampleText);
  const runResponse = await fetch(`${baseUrl}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: {}, seed: 7, n: 1000 }),
  });
  assert.equal(runResponse.status, 200);
  assert.deepEqual(await runResponse.json(), { runId: sample.runId });

  const resultResponse = await fetch(`${baseUrl}/runs/${sample.runId}`);
  const { result } = await resultResponse.json();
  assert.equal(resultResponse.status, 200);
  assert.equal(result.status.replay, true);
  assert.equal(result.mode, 1000);
  assert.deepEqual(result.results, sample.results);

  const csvResponse = await fetch(`${baseUrl}/runs/${sample.runId}/export?format=csv`);
  assert.equal(csvResponse.status, 200);
  assert.equal(csvResponse.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal((await csvResponse.text()).trim().split("\n").length, sample.results.length + 1);

  const staticResponse = await fetch(`${baseUrl}/sample_result.json`);
  assert.equal(staticResponse.status, 200);
  assert.equal(await staticResponse.text(), sampleText);
  assert.equal(upstreamRequests, 0);
});
