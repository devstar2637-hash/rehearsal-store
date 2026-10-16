import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export function createStaticServer({ root = DEFAULT_ROOT, sourceSha = process.env.SOURCE_SHA ?? "local" } = {}) {
  const distRoot = path.resolve(root);
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'");
    const finish = (status, message) => {
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      finish(405, "Method Not Allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    } catch {
      finish(400, "Invalid URL");
      return;
    }
    if (pathname === "/_health") {
      const body = JSON.stringify({ status: "ok", product: "Rehearsal", sourceSha });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : body);
      return;
    }
    if (pathname.includes("\0") || pathname.includes("\\")) {
      finish(400, "Invalid path");
      return;
    }
    const target = path.resolve(distRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!target.startsWith(distRoot + path.sep)) {
      finish(404, "Not Found");
      return;
    }
    try {
      const info = await stat(target);
      if (!info.isFile()) {
        finish(404, "Not Found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(target)] ?? "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
      });
      if (req.method === "HEAD") res.end();
      else createReadStream(target).on("error", () => res.destroy()).pipe(res);
    } catch {
      finish(404, "Not Found");
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  const server = createStaticServer();
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.listen(port, "0.0.0.0", () => console.log(`Rehearsal listening on port ${port}`));
}
