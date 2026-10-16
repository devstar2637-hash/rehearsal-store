import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const clientDir = resolve(here, "client");
const outDir = resolve(root, "dist/web/client");
const assetsDir = resolve(outDir, "assets");

mkdirSync(assetsDir, { recursive: true });
cpSync(resolve(clientDir, "index.html"), resolve(outDir, "index.html"));

const hasLocalThree = existsSync(resolve(root, "node_modules/three"));

await build({
  entryPoints: [resolve(clientDir, "app.ts")],
  outfile: resolve(assetsDir, "app.js"),
  bundle: true,
  format: "esm",
  target: ["es2022"],
  platform: "browser",
  external: hasLocalThree ? [] : ["three", "three/*"],
  sourcemap: false,
  minify: false,
  logLevel: "info",
});
