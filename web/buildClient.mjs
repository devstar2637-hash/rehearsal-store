import { build } from "esbuild";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const clientDir = resolve(here, "client");
const outDir = resolve(root, "dist/web/client");
mkdirSync(outDir, { recursive: true });

const hasLocalThree = existsSync(resolve(root, "node_modules/three"));

await build({
  entryPoints: [resolve(clientDir, "app.ts")],
  outfile: resolve(outDir, "app.js"),
  bundle: true,
  format: "esm",
  target: ["es2022"],
  platform: "browser",
  external: hasLocalThree ? [] : ["three", "three/*"],
  sourcemap: false,
  minify: false,
  logLevel: "info",
});
const version = createHash("sha256")
  .update(readFileSync(resolve(outDir, "app.js")))
  .update(readFileSync(resolve(outDir, "styles.css")))
  .digest("hex").slice(0, 12);
const html = readFileSync(resolve(clientDir, "index.html"), "utf8")
  .replace('src="/app.js"', 'src="/app.js?v=' + version + '"')
  .replace('href="/styles.css"', 'href="/styles.css?v=' + version + '"')
  .replace("</head>", '<meta name="ui-build" content="' + version + '" /></head>');
writeFileSync(resolve(outDir, "index.html"), html);
