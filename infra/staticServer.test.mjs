import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createStaticServer } from "./staticServer.mjs";

test("production host serves only built assets and health metadata", async (t) => {
  const temp = await mkdtemp(path.join(tmpdir(), "rehearsal-static-"));
  const root = path.join(temp, "dist");
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "<title>Rehearsal</title>");
  await writeFile(path.join(root, "assets", "app-abc.js"), "console.log('asset');");
  await writeFile(path.join(temp, "private.txt"), "not a public asset");
  const server = createStaticServer({ root, sourceSha: "test-source" });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(temp, { recursive: true, force: true });
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  await t.test("root and HEAD preserve the built document and security headers", async () => {
    const response = await fetch(origin);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "<title>Rehearsal</title>");
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
    const head = await fetch(origin, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  });
  await t.test("hashed assets have the expected type and cache policy", async () => {
    const response = await fetch(`${origin}/assets/app-abc.js`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/javascript/);
    assert.match(response.headers.get("cache-control"), /immutable/);
  });
  await t.test("missing paths, private source and obsolete APIs never replay another result", async () => {
    for (const pathname of ["/absent.js", "/server.ts", "/%2e%2e%2fprivate.txt", "/runs/unknown"]) {
      const response = await fetch(origin + pathname);
      assert.equal(response.status, 404, pathname);
      assert.equal(await response.text(), "Not Found");
    }
    const post = await fetch(`${origin}/run`, { method: "POST", body: "{}" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");
  });
  await t.test("malformed paths are rejected and health identifies the deployed source", async () => {
    assert.equal((await fetch(`${origin}/%ZZ`)).status, 400);
    const response = await fetch(`${origin}/_health`);
    assert.deepEqual(await response.json(), { status: "ok", product: "Rehearsal", sourceSha: "test-source" });
  });
});
