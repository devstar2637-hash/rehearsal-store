import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const client = resolve(root, "web/client");
const engines = [
  "canvasRenderer.ts", "d3StatsCharts.ts", "rehearsalCore.ts",
  "threeFloorplanStage.ts", "tenKMatrixEngine.ts", "backendSync.ts",
];
// The AI Studio entrypoint is canonical; Cloud Run assets are generated from it.
for (const name of ["main.ts", ...engines.map((file) => "engine/" + file)]) {
  readFileSync(resolve(root, "src", name));
}
mkdirSync(resolve(client, "engine"), { recursive: true });
writeFileSync(resolve(client, "app.ts"), readFileSync(resolve(root, "src/main.ts"), "utf8").trimEnd() + "\n");
copyFileSync(resolve(root, "styles.css"), resolve(client, "styles.css"));
for (const name of engines) {
  copyFileSync(resolve(root, "src/engine", name), resolve(client, "engine", name));
}
const html = readFileSync(resolve(root, "index.html"), "utf8")
  .replace('src="/src/main.ts"', 'src="/app.js"');
writeFileSync(resolve(client, "index.html"), html);
console.log("Synced AI Studio source into web/client.");
