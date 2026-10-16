import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const artifacts = process.env.UI_ARTIFACT_DIR;
if (artifacts) await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl"],
});

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    page.setDefaultTimeout(15000);
    const errors = [];
    const failed = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(baseUrl).origin) {
        failed.push([response.status(), response.url()]);
      }
    });
    await page.addInitScript(() => {
      window.__snapshotLabels = [];
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
        if (this.canvas.width === 1920) window.__snapshotLabels.push(String(text));
        return fillText.call(this, text, ...args);
      };
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("backendEngineStatus")?.textContent?.includes("10,000"));
    await page.locator("#threeSwarmBtn").click();
    assert.equal(await page.locator("#threeSwarmBtn").getAttribute("aria-pressed"), "false");
    await page.locator("#threeSwarmBtn").click();
    assert.equal(await page.locator("#threeSwarmBtn").getAttribute("aria-pressed"), "true");

    const initialFixtures = await page.evaluate(() => window.RehearsalApp.getState().scene.objects);
    await page.locator('[data-wafer-bench="optimal"]').click();
    const selectedWait = await page.locator("#inspWaitDelta").innerText();
    const selectedRun = await page.locator("#inspRunTitle").innerText();
    await page.locator("#loadCellTo3DBtn").click();
    assert.equal(await page.locator("#inspWaitDelta").innerText(), selectedWait);
    assert.equal(await page.locator("#inspRunTitle").innerText(), selectedRun);
    assert.deepEqual(await page.evaluate(() => window.RehearsalApp.getState().scene.objects), initialFixtures);
    assert.match(await page.locator("#threeInfoBody").innerText(), /separate assumptions/);
    await page.locator('[data-wafer-bench="worst"]').click();
    await page.locator("#loadCellTo3DBtn").click();
    assert.match(await page.locator('[data-three-mode="proposed"]').getAttribute("class"), /\bon\b/);
    await page.locator('[data-wafer-mode="delta"]').click();
    assert.match(await page.locator('[data-wafer-mode="delta"]').getAttribute("class"), /active/);
    await page.locator("#resweepTenKBtn").click();
    await page.waitForFunction(() => document.getElementById("tenKExecCounter")?.textContent?.includes("SWEEP"));
    await page.locator("#refreshBackendEngineBtn").click();
    await page.waitForFunction(() => document.getElementById("backendEngineStatus")?.textContent?.includes("fresh run"));

    await page.locator("#headerExport3DBtn").click();
    await page.locator("#threeExportDrawer").waitFor({ state: "visible" });
    const drawer = await page.locator("#threeExportDrawer").boundingBox();
    assert.ok(drawer.x >= 0 && drawer.x + drawer.width <= viewport.width + 1);
    const snapshotPromise = page.waitForEvent("download");
    await page.locator("#export3DSnapBtn").click();
    const snapshot = await snapshotPromise;
    assert.match(snapshot.suggestedFilename(), /\.png$/);
    const snapshotLabels = await page.evaluate(() => window.__snapshotLabels);
    assert.ok(snapshotLabels.some((text) => text.includes("[ASSUMED]")));
    assert.ok(snapshotLabels.every((text) => !/SCENARIOS VERIFIED|VERIFIED BY/.test(text)));
    if (artifacts) await snapshot.saveAs(join(artifacts, `snapshot-${viewport.width}.png`));
    await page.locator("#closeExportDrawerBtn").click();

    await page.locator('[data-select-obj="display"]').first().click();
    await page.locator("#displayX").fill("3.0");
    await page.locator("#displayX").dispatchEvent("change");
    await page.locator("#displayY").fill("7.7");
    await page.locator("#displayY").dispatchEvent("change");
    await page.waitForFunction(() => window.RehearsalApp.getState().results?.plan.routeBlocked);
    await page.locator("#headerExport3DBtn").click();
    const reportPromise = page.waitForEvent("download");
    await page.locator("#export3DReportBtn").click();
    const report = await reportPromise;
    const reportText = await readFile(await report.path(), "utf8");
    assert.match(reportText, /Proposed Layout.*Wait Blocked.*Served 0.*comparison unavailable/);
    assert.doesNotMatch(reportText, /87s faster|SCENARIOS VERIFIED|VERIFIED BY/);
    if (artifacts) await report.saveAs(join(artifacts, `blocked-report-${viewport.width}.md`));
    await page.locator("#closeExportDrawerBtn").click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log(JSON.stringify({ baseUrl, viewport, selectedRun, stableWait: selectedWait, engine: await page.locator("#backendEngineStatus").innerText(), mobileExports: "pass", blockedReport: "pass", errors, failed }));
    if (artifacts) await page.screenshot({ path: join(artifacts, `verified-${viewport.width}.png`), fullPage: false });
    await page.close();
  }
} finally {
  await browser.close();
}
