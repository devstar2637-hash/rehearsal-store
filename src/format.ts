import type {
  ExtendedRunResult,
  SourceTag,
  VariantResult,
} from "./types.ts";

const numFmt = new Intl.NumberFormat("ko-KR");
const decFmt = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNum(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  return Number.isInteger(val) ? numFmt.format(val) : decFmt.format(val);
}

export function formatKrw(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  return `${numFmt.format(val)} KRW`;
}

export function formatRelativeDelta(delta: number | undefined): string {
  if (delta === undefined || delta === null || Number.isNaN(delta)) {
    return "±0 %";
  }
  const absPct = decFmt.format(Math.abs(delta * 100));
  const signedPct = delta < 0 ? `-${absPct} %` : `+${absPct} %`;
  return `±${absPct} % (${signedPct})`;
}

export function formatShortHash(hash: string | undefined): string {
  if (!hash) return "—";
  return hash.slice(0, 8);
}

export function formatFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

export function formatSourceTagText(
  tag: (SourceTag & { note?: string }) | undefined
): string {
  if (!tag) return "computed (by engine)";
  switch (tag.kind) {
    case "public":
      return `public · ${tag.dataset} · asOf ${tag.asOf}`;
    case "onsite":
      return `onsite${tag.field ? ` · ${tag.field}` : ""}${
        tag.note ? ` · ${tag.note}` : ""
      }`;
    case "computed":
      return `computed (by ${tag.by})${tag.note ? ` · ${tag.note}` : ""}`;
    case "assumed":
      return `assumed · ${tag.note}`;
    case "synthetic":
      return `synthetic · ${tag.note}`;
  }
}

export function renderSourceChip(
  tag: (SourceTag & { note?: string }) | undefined,
  compact = false
): string {
  const resolved: SourceTag & { note?: string } = tag ?? {
    kind: "computed",
    by: "engine",
  };
  const fullText = formatSourceTagText(resolved);
  let shortLabel = fullText;
  if (compact) {
    if (resolved.kind === "public") {
      shortLabel = `public · ${resolved.dataset.split(" ")[0]} (${resolved.asOf})`;
    } else if (resolved.kind === "onsite") {
      shortLabel = `onsite${resolved.field ? ` · ${resolved.field}` : ""}`;
    } else if (resolved.kind === "computed") {
      shortLabel = `computed (by ${resolved.by})`;
    } else if (resolved.kind === "assumed") {
      shortLabel = `assumed · ${resolved.note}`;
    } else if (resolved.kind === "synthetic") {
      shortLabel = `synthetic · ${resolved.note}`;
    }
  }
  return `<span class="source-chip source-chip--${escapeHtml(
    resolved.kind
  )}" title="${escapeHtml(fullText)}" data-source-kind="${escapeHtml(
    resolved.kind
  )}">${escapeHtml(shortLabel)}</span>`;
}

export function renderComputedChip(by: "engine" | "oracle" = "engine"): string {
  return renderSourceChip({ kind: "computed", by }, true);
}

export interface LandscapeCounts {
  totalVariants: number;
  survivorCount: number;
  failCount: number;
  rejectedCount: number;
  failureFamilyCount: number;
  failureFamilies: string[];
  headline: string;
  deathCountSummary: string;
}

export function computeLandscapeCounts(
  results: VariantResult[],
  horizonMonths = 36
): LandscapeCounts {
  let survivorCount = 0;
  let failCount = 0;
  let rejectedCount = 0;
  const familySet = new Set<string>();

  for (const r of results) {
    if (!r.constraintsOk || r.deathCause === "constraintReject") {
      rejectedCount += 1;
      continue;
    }
    if (r.survivedMonths === horizonMonths && r.deathMonth === null) {
      survivorCount += 1;
    } else {
      failCount += 1;
      if (r.failureFamily && r.failureFamily !== "survivor") {
        familySet.add(r.failureFamily);
      } else if (r.deathCause) {
        familySet.add(r.deathCause);
      }
    }
  }

  const totalVariants = results.length;
  const failureFamilies = Array.from(familySet);
  const failureFamilyCount = failureFamilies.length;
  const headline = `${formatNum(totalVariants)} variants, ${formatNum(
    survivorCount
  )} survive, ${formatNum(failCount)} fail in ${formatNum(
    failureFamilyCount
  )} failure families`;
  const deathCountSummary = `${formatNum(failCount)} of ${formatNum(
    totalVariants
  )} fail by month ${formatNum(horizonMonths)}`;

  return {
    totalVariants,
    survivorCount,
    failCount,
    rejectedCount,
    failureFamilyCount,
    failureFamilies,
    headline,
    deathCountSummary,
  };
}

export function computeMinMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return { min, max };
}

export function isUncalibrated(result: ExtendedRunResult): boolean {
  return (
    result.calibration?.koLabel === "미보정" ||
    result.calibration?.label === "uncalibrated" ||
    Boolean(result.distributionsHidden)
  );
}

export function getBaselineHeaderMode(result: ExtendedRunResult): string {
  if (
    result.baseline?.koLabel === "탐색기" ||
    result.baseline?.label === "explorer"
  ) {
    return "탐색기";
  }
  return result.baseline?.koLabel ?? "AI-native";
}

export function buildRunCsv(result: ExtendedRunResult): string {
  const headers = [
    "runId",
    "designId",
    "familyId",
    "scenarioId",
    "constraintsOk",
    "rejectedReason",
    "survivedMonths",
    "deathMonth",
    "deathCause",
    "failureFamily",
    "nonDominated",
    "breakEvenMonth",
    "cashMin",
    "cumPnL",
    "seats",
    "floorAreaM2",
    "depositKrw",
    "monthlyRentKrw",
    "fitoutCostKrw",
    "staffFte",
    "avgTicketKrw",
    "makeTimeSec",
    "cupsPerDayBase",
    "cogsRatio",
    "openingMonth",
    "decisionChoice",
    "decisionReason",
  ];

  const designMap = new Map(result.designs.map((d) => [d.id, d]));
  const rows: string[] = [headers.join(",")];

  const csvCell = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const str = String(v);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  for (const r of result.results) {
    const d = designMap.get(r.designId);
    const row = [
      result.runId,
      r.designId,
      d?.familyId ?? "",
      r.scenarioId,
      r.constraintsOk,
      r.rejectedReason ?? "",
      r.survivedMonths,
      r.deathMonth ?? "",
      r.deathCause ?? "",
      r.failureFamily ?? "",
      r.nonDominated ?? false,
      r.breakEvenMonth ?? "",
      r.cashMin,
      r.cumPnL ?? "",
      d?.seats ?? "",
      d?.floorAreaM2 ?? "",
      d?.deposit.value ?? "",
      d?.monthlyRent.value ?? "",
      d?.fitoutCost.value ?? "",
      d?.staffFte ?? "",
      d?.avgTicketKrw ?? "",
      d?.makeTimeSec ?? "",
      d?.cupsPerDayBase ?? "",
      d?.cogsRatio ?? "",
      d?.openingMonth ?? "",
      result.decision?.choice ?? "",
      result.decision?.reason ?? "",
    ];
    rows.push(row.map(csvCell).join(","));
  }

  return rows.join("\n");
}
