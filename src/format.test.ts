import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  computeLandscapeCounts,
  formatRelativeDelta,
  formatShortHash,
  isUncalibrated,
  getBaselineHeaderMode,
  buildRunCsv,
} from "./format.ts";
import type { ExtendedRunResult } from "./types.ts";

const samplePath = path.resolve(process.cwd(), "public/sample_result.json");
const sampleData = JSON.parse(
  fs.readFileSync(samplePath, "utf8")
) as ExtendedRunResult;

test("computeLandscapeCounts derives exact variant, survivor, failure, and family counts from sample_result.json", () => {
  const counts = computeLandscapeCounts(sampleData.results, 36);
  assert.equal(counts.totalVariants, 40);
  assert.equal(counts.survivorCount, 28);
  assert.equal(counts.failCount, 4);
  assert.equal(counts.rejectedCount, 8);
  assert.equal(counts.failureFamilyCount, 3);
  assert.equal(
    counts.headline,
    "40 variants, 28 survive, 4 fail in 3 failure families"
  );
  assert.equal(counts.deathCountSummary, "4 of 40 fail by month 36");
});

test("formatRelativeDelta renders ±x % and signed delta from cliff.relativeDelta", () => {
  assert.equal(formatRelativeDelta(-0.12), "±12 % (-12 %)");
  assert.equal(formatRelativeDelta(0.15), "±15 % (+15 %)");
});

test("formatShortHash returns first 8 chars of inputHash", () => {
  assert.equal(
    formatShortHash(
      "ad3812dd7507bf6dcde4c269b4c27b3ffdd3aa74b4271c4c53e234bcc1564854"
    ),
    "ad3812dd"
  );
});

test("isUncalibrated and getBaselineHeaderMode handle failure states", () => {
  assert.equal(isUncalibrated(sampleData), false);
  assert.equal(getBaselineHeaderMode(sampleData), "AI-native");

  const uncal: ExtendedRunResult = {
    ...sampleData,
    calibration: {
      ...sampleData.calibration,
      label: "uncalibrated",
      koLabel: "미보정",
    },
    baseline: sampleData.baseline
      ? {
          ...sampleData.baseline,
          label: "explorer",
          koLabel: "탐색기",
        }
      : null,
  };
  assert.equal(isUncalibrated(uncal), true);
  assert.equal(getBaselineHeaderMode(uncal), "탐색기");
});

test("buildRunCsv produces 41 rows (header + 40 results) without money calculation", () => {
  const csv = buildRunCsv(sampleData);
  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 41);
  assert.ok(lines[0].startsWith("runId,designId,familyId,scenarioId"));
  assert.ok(lines[1].includes("run-sample-7,d-00000"));
});
