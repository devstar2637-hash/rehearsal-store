import uPlot from "uplot";
import type { ExtendedRunResult, StoreDesign } from "../types.ts";
import {
  computeLandscapeCounts,
  escapeHtml,
  formatKrw,
  formatNum,
  isUncalibrated,
  renderComputedChip,
  renderSourceChip,
} from "../format.ts";

export interface LandscapeCallbacks {
  onFamilyChange: (familyId: string) => void;
}

const FAMILY_PALETTE: Record<string, string> = {
  survivor: "#0d9488", // Teal-600 for 36-month survivors
  "reserveBreach|labour|m1-6": "#e11d48", // Rose-600
  "reserveBreach|labour|m7-18": "#d97706", // Amber-600
  "reserveBreach|labour|m19-36": "#7c3aed", // Violet-600
  constraintReject: "#64748b", // Slate-500
};

const FALLBACK_COLORS = [
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#4f46e5",
  "#059669",
];

function getFamilyColor(family: string, index: number): string {
  if (FAMILY_PALETTE[family]) return FAMILY_PALETTE[family];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

let activePlot: uPlot | null = null;

function renderLeaderAssumptionTable(
  leader: StoreDesign | undefined,
  result: ExtendedRunResult
): string {
  if (!leader) {
    return `<div class="empty-notice">No leader design available in RunResult.</div>`;
  }
  const tags = result.sourceTags ?? {};
  const rows: { label: string; field: string; value: string; tagHtml: string }[] = [
    {
      label: "설계 ID (id)",
      field: "id",
      value: leader.id,
      tagHtml: renderComputedChip("engine"),
    },
    {
      label: "좌석 수 (seats)",
      field: "seats",
      value: formatNum(leader.seats),
      tagHtml: renderSourceChip(tags.seats, true),
    },
    {
      label: "전용 면적 (floorAreaM2)",
      field: "floorAreaM2",
      value: `${formatNum(leader.floorAreaM2)} m²`,
      tagHtml: renderSourceChip(tags.floorAreaM2, true),
    },
    {
      label: "보증금 (deposit)",
      field: "deposit",
      value: formatKrw(leader.deposit.value),
      tagHtml: renderSourceChip(leader.deposit.source, true),
    },
    {
      label: "월 임차료 (monthlyRent)",
      field: "monthlyRent",
      value: formatKrw(leader.monthlyRent.value),
      tagHtml: renderSourceChip(leader.monthlyRent.source, true),
    },
    {
      label: "시설·장비비 (fitoutCost)",
      field: "fitoutCost",
      value: formatKrw(leader.fitoutCost.value),
      tagHtml: renderSourceChip(leader.fitoutCost.source, true),
    },
    {
      label: "유급 인력 (staffFte)",
      field: "staffFte",
      value: `${formatNum(leader.staffFte)} FTE`,
      tagHtml: renderSourceChip(tags.staffFte, true),
    },
    {
      label: "평균 객단가 (avgTicketKrw)",
      field: "avgTicketKrw",
      value: formatKrw(leader.avgTicketKrw),
      tagHtml: renderSourceChip(tags.avgTicketKrw, true),
    },
    {
      label: "제조 시간 (makeTimeSec)",
      field: "makeTimeSec",
      value: `${formatNum(leader.makeTimeSec)} sec`,
      tagHtml: renderSourceChip(tags.makeTimeSec, true),
    },
    {
      label: "일 기본 판매 잔수 (cupsPerDayBase)",
      field: "cupsPerDayBase",
      value: `${formatNum(leader.cupsPerDayBase)} cups/day`,
      tagHtml: renderSourceChip(tags.cupsPerDayBase, true),
    },
    {
      label: "매출원가율 (cogsRatio)",
      field: "cogsRatio",
      value: formatNum(leader.cogsRatio),
      tagHtml: renderSourceChip(tags.cogsRatio, true),
    },
    {
      label: "개업 월 (openingMonth)",
      field: "openingMonth",
      value: `${formatNum(leader.openingMonth)}월`,
      tagHtml: renderSourceChip(tags.openingMonth, true),
    },
  ];

  return `
    <div class="assumption-fallback-card" data-testid="assumption-table">
      <div class="assumption-fallback-card__header">
        <span class="uncalibrated-inline-badge">미보정</span>
        <strong>미보정 상태: 분포도 숨김 — 선두 설계(${escapeHtml(
          leader.id
        )}) 가정 테이블 (Leader Design Assumptions)</strong>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>항목 (Field)</th>
            <th class="text-right">값 (Value)</th>
            <th>출처 태그 (Source Tag)</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td class="font-mono">${escapeHtml(r.label)}</td>
              <td class="text-right font-mono">${escapeHtml(r.value)}</td>
              <td>${r.tagHtml}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderLandscapeScreen(
  container: HTMLElement,
  result: ExtendedRunResult,
  selectedFamily: string,
  activeMode: 1000 | 10000,
  callbacks: LandscapeCallbacks
): void {
  if (activePlot) {
    activePlot.destroy();
    activePlot = null;
  }

  const horizon = result.constraints.horizonMonths ?? 36;
  const counts = computeLandscapeCounts(result.results, horizon);
  const uncalibrated = isUncalibrated(result);

  const allPoints = result.landscape?.points ?? [];
  const filteredPoints =
    selectedFamily === "ALL"
      ? allPoints
      : allPoints.filter((p) => p.familyId === selectedFamily);

  // Collect distinct failureFamily categories from landscape.points
  const familyCounts = new Map<string, number>();
  for (const pt of allPoints) {
    const fam = pt.failureFamily ?? "unknown";
    familyCounts.set(fam, (familyCounts.get(fam) ?? 0) + 1);
  }
  const distinctFamilies = Array.from(familyCounts.keys());

  // Collect distinct design familyIds for mode=10000 selector
  const designFamilyIds = Array.from(
    new Set(allPoints.map((p) => p.familyId).filter(Boolean) as string[])
  ).sort();

  const nonDominatedPoints = filteredPoints.filter((p) => p.nonDominated);
  const leaderDesign =
    result.designs.find((d) => d.id === result.leaderDesignId) ??
    result.designs[0];

  const showMode10000Selector =
    activeMode === 10000 || result.mode === 10000;

  container.innerHTML = `
    <section class="screen-section" id="screen-landscape" data-screen="landscape">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">02. 생존·손익 지형 산점도 (Landscape Scatter · x = survivedMonths, y = cumPnL)</div>
          <h2 class="screen-title" data-testid="landscape-headline">
            ${escapeHtml(counts.headline)}
            ${renderComputedChip("engine")}
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
          <p class="screen-subtitle">
            <span><strong>scenario frequency</strong> 집계 · <strong>rehearsal, not advice</strong></span>
            <span class="mx-2">·</span>
            <span class="font-mono" data-testid="death-count-text">${escapeHtml(
              counts.deathCountSummary
            )}</span>
            ${renderComputedChip("engine")}
            <span class="mx-2">·</span>
            <span class="font-mono">${formatNum(
              counts.rejectedCount
            )} constraint rejections (AT-03)</span>
            ${renderComputedChip("oracle")}
          </p>
        </div>

        ${
          showMode10000Selector
            ? `
          <div class="family-selector-wrap">
            <label for="landscape-family-select" class="family-selector-label">
              Design Family (<span class="font-mono">mode=10000</span>)
            </label>
            <select id="landscape-family-select" class="family-selector-select font-mono" aria-label="Filter landscape by familyId">
              <option value="ALL" ${
                selectedFamily === "ALL" ? "selected" : ""
              }>All families (${formatNum(designFamilyIds.length)})</option>
              ${designFamilyIds
                .map(
                  (fid) =>
                    `<option value="${escapeHtml(fid)}" ${
                      selectedFamily === fid ? "selected" : ""
                    }>${escapeHtml(fid)}</option>`
                )
                .join("")}
            </select>
          </div>
        `
            : ""
        }
      </div>

      <div class="landscape-kpi-strip">
        <div class="kpi-cell">
          <span class="kpi-cell__label">총 검증 설계 (Total Variants · N)</span>
          <div class="kpi-cell__val font-mono">
            ${formatNum(counts.totalVariants)}
            ${renderComputedChip("engine")}
          </div>
        </div>
        <div class="kpi-cell kpi-cell--survivor">
          <span class="kpi-cell__label">36개월 생존 (Survivors · S)</span>
          <div class="kpi-cell__val font-mono">
            ${formatNum(counts.survivorCount)}
            ${renderComputedChip("engine")}
          </div>
        </div>
        <div class="kpi-cell kpi-cell--fail">
          <span class="kpi-cell__label">중도 폐업 빈도 (Failed · D)</span>
          <div class="kpi-cell__val font-mono">
            ${formatNum(counts.failCount)} of ${formatNum(counts.totalVariants)} fail by month ${formatNum(horizon)}
            ${renderComputedChip("engine")}
          </div>
        </div>
        <div class="kpi-cell">
          <span class="kpi-cell__label">실패군 수 (Failure Families · F)</span>
          <div class="kpi-cell__val font-mono">
            ${formatNum(counts.failureFamilyCount)}
            ${renderComputedChip("engine")}
          </div>
        </div>
        <div class="kpi-cell">
          <span class="kpi-cell__label">비지배 생존 설계 (Non-Dominated)</span>
          <div class="kpi-cell__val font-mono">
            ${formatNum(nonDominatedPoints.length)} (${escapeHtml(
    nonDominatedPoints.map((p) => p.designId).join(", ") || "none"
  )})
            ${renderComputedChip("engine")}
          </div>
        </div>
      </div>

      ${uncalibrated ? renderLeaderAssumptionTable(leaderDesign, result) : ""}

      <div
        class="landscape-distribution-box"
        data-screen="landscape-distribution"
        ${uncalibrated ? "hidden" : ""}
      >
        <div class="landscape-legend-bar">
          <div class="landscape-legend-groups">
            <span class="landscape-legend-title">Color by failureFamily:</span>
            ${distinctFamilies
              .map((fam, idx) => {
                const color = getFamilyColor(fam, idx);
                const cnt = familyCounts.get(fam) ?? 0;
                const isSurv = fam === "survivor";
                return `
                  <span class="legend-item ${
                    isSurv ? "legend-item--survivor" : ""
                  }" data-family="${escapeHtml(fam)}">
                    <span class="legend-swatch" style="background:${color};${
                  isSurv ? "box-shadow:0 0 0 2px rgba(13,148,136,0.35);" : ""
                }"></span>
                    <span class="font-mono">${escapeHtml(fam)}</span>
                    <span class="legend-count font-mono">(${formatNum(
                      cnt
                    )})</span>
                  </span>
                `;
              })
              .join("")}
          </div>
          <div class="landscape-legend-markers">
            <span class="legend-marker-note">
              <span class="legend-ring-sample"></span>
              <strong>nonDominated outlined</strong> (${formatNum(
                nonDominatedPoints.length
              )} Pareto points)
            </span>
            <span class="legend-marker-note">
              <span class="legend-survivor-sample"></span>
              <strong>survivors (survivedMonths = 36) highlighted</strong>
            </span>
          </div>
        </div>

        <div id="uplot-scatter-mount" class="uplot-scatter-mount"></div>

        <div class="landscape-points-summary">
          <div class="landscape-points-summary__header">
            <span class="font-semibold text-xs">비지배(Non-Dominated) 및 주요 실패 시나리오 포인트 상세</span>
            ${renderComputedChip("engine")}
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>설계 ID (designId)</th>
                  <th>군 (familyId)</th>
                  <th class="text-right">생존 개월 (survivedMonths)</th>
                  <th class="text-right">누적 손익 (cumPnL)</th>
                  <th class="text-right">최저 현금 (cashMin)</th>
                  <th>실패군 (failureFamily)</th>
                  <th>비지배 (nonDominated)</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPoints
                  .filter(
                    (pt) =>
                      pt.nonDominated ||
                      pt.survivedMonths < horizon ||
                      pt.designId === result.leaderDesignId
                  )
                  .map(
                    (pt) => `
                  <tr class="${
                    pt.nonDominated ? "row-nondominated" : ""
                  } ${pt.survivedMonths === horizon ? "row-survivor" : "row-failed"}">
                    <td class="font-mono font-semibold">
                      ${escapeHtml(pt.designId)}
                      ${
                        pt.designId === result.leaderDesignId
                          ? `<span class="leader-tag">#1 Leader</span>`
                          : ""
                      }
                    </td>
                    <td class="font-mono">${escapeHtml(pt.familyId ?? "—")}</td>
                    <td class="text-right font-mono">${formatNum(
                      pt.survivedMonths
                    )} mo ${renderComputedChip("engine")}</td>
                    <td class="text-right font-mono">${formatKrw(
                      pt.cumPnL ?? pt.y
                    )} ${renderComputedChip("engine")}</td>
                    <td class="text-right font-mono">${formatKrw(
                      pt.cashMin
                    )} ${renderComputedChip("engine")}</td>
                    <td class="font-mono">${escapeHtml(
                      pt.failureFamily ?? "—"
                    )}</td>
                    <td class="font-mono">${
                      pt.nonDominated ? "Yes (Outlined)" : "No"
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="landscape-meta-row">
        <div class="meta-panel">
          <div class="meta-panel__title">
            보정 상태 (calibration · ${escapeHtml(
              result.calibration?.koLabel ?? result.calibration?.label ?? "—"
            )})
          </div>
          <div class="meta-panel__body font-mono text-xs">
            <span>errorPp: ${formatNum(result.calibration?.errorPp)} pp</span>
            ${renderComputedChip("engine")}
            <span class="mx-2">·</span>
            <span>holdoutErrorPp: ${formatNum(
              result.calibration?.holdoutErrorPp
            )}</span>
            ${renderComputedChip("engine")}
            <span class="mx-2">·</span>
            <span>overfitSuspect: ${String(
              result.calibration?.overfitSuspect ?? false
            )}</span>
          </div>
        </div>

        <div class="meta-panel">
          <div class="meta-panel__title">
            비교 기준선 (baseline · ${escapeHtml(
              result.baseline?.koLabel ?? result.baseline?.label ?? "—"
            )})
          </div>
          <div class="meta-panel__body font-mono text-xs">
            <span>argonNewFamilies: ${formatNum(
              result.baseline?.argonNewFamilies
            )} vs random: ${formatNum(
    result.baseline?.randomNewFamilies
  )}</span>
            ${renderComputedChip("engine")}
            <span class="mx-2">·</span>
            <span>argonNonDominated: ${formatNum(
              result.baseline?.argonNonDominated
            )} vs random: ${formatNum(
    result.baseline?.randomNonDominated
  )}</span>
            ${renderComputedChip("engine")}
          </div>
        </div>
      </div>
    </section>
  `;

  const famSelect = container.querySelector<HTMLSelectElement>(
    "#landscape-family-select"
  );
  if (famSelect) {
    famSelect.addEventListener("change", () => {
      callbacks.onFamilyChange(famSelect.value);
    });
  }

  // Mount uPlot scatter chart when distribution is visible
  const chartMount = container.querySelector<HTMLElement>(
    "#uplot-scatter-mount"
  );
  if (chartMount && !uncalibrated && filteredPoints.length > 0) {
    const width = Math.max(chartMount.clientWidth || 880, 320);
    const height = 360;

    // uPlot expects aligned data arrays; we provide x bounds [0, 38] and custom draw hook for rich scatter points
    const xs = filteredPoints.map((p) => p.x);
    const ys = filteredPoints.map((p) => p.y);

    const opts: uPlot.Options = {
      width,
      height,
      legend: { show: false },
      cursor: { show: true },
      scales: {
        x: {
          time: false,
          range: () => [0, 38],
        },
        y: {
          range: (_u, dataMin, dataMax) => {
            const minVal = Math.min(dataMin, -35_000_000);
            const maxVal = Math.max(dataMax, 360_000_000);
            return [minVal * 1.1, maxVal * 1.08];
          },
        },
      },
      axes: [
        {
          label: "survivedMonths (months · 0 to 36)",
          font: "11px 'JetBrains Mono', monospace",
          labelFont: "600 12px 'Plus Jakarta Sans', sans-serif",
          stroke: "#334155",
          grid: { stroke: "rgba(148, 163, 184, 0.2)", width: 1 },
          values: (_u, splits) => splits.map((v) => `${v}m`),
        },
        {
          label: "cumPnL (M KRW)",
          font: "11px 'JetBrains Mono', monospace",
          labelFont: "600 12px 'Plus Jakarta Sans', sans-serif",
          stroke: "#334155",
          size: 76,
          grid: { stroke: "rgba(148, 163, 184, 0.2)", width: 1 },
          values: (_u, splits) =>
            splits.map((v) => `${(v / 1_000_000).toFixed(0)}M`),
        },
      ],
      series: [
        { label: "survivedMonths" },
        {
          label: "cumPnL",
          stroke: "#0d9488",
          paths: () => null,
          points: { show: false },
        },
      ],
      hooks: {
        draw: [
          (u: uPlot) => {
            const ctx = u.ctx;
            ctx.save();

            // Draw zero PnL reference line
            const yZero = u.valToPos(0, "y", true);
            if (Number.isFinite(yZero)) {
              ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(u.bbox.left, yZero);
              ctx.lineTo(u.bbox.left + u.bbox.width, yZero);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Draw vertical survivor highlight band at month 36
            const x36 = u.valToPos(horizon, "x", true);
            if (Number.isFinite(x36)) {
              ctx.fillStyle = "rgba(13, 148, 136, 0.08)";
              ctx.fillRect(x36 - 14, u.bbox.top, 28, u.bbox.height);
            }

            // Render each point colored by failureFamily, survivors highlighted, nonDominated outlined
            for (const pt of filteredPoints) {
              const cx = u.valToPos(pt.x, "x", true);
              const cy = u.valToPos(pt.y, "y", true);
              if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;

              const fam = pt.failureFamily ?? "unknown";
              const famIdx = Math.max(0, distinctFamilies.indexOf(fam));
              const fill = getFamilyColor(fam, famIdx);
              const isSurvivor = pt.survivedMonths === horizon;
              const isNonDom = Boolean(pt.nonDominated);
              const radius = isNonDom ? 7.5 : isSurvivor ? 5.5 : 6;

              if (isSurvivor) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(13, 148, 136, 0.18)";
                ctx.fill();
              }

              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fillStyle = fill;
              ctx.fill();

              if (isNonDom) {
                // Outlined ring for non-dominated points
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#0f172a";
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, radius + 3.5, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#f59e0b";
                ctx.stroke();

                ctx.fillStyle = "#0f172a";
                ctx.font = "600 11px 'JetBrains Mono', monospace";
                ctx.textAlign = "right";
                ctx.fillText(pt.designId, cx - 10, cy + 4);
              } else if (!isSurvivor) {
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();

                ctx.fillStyle = "#881337";
                ctx.font = "500 10px 'JetBrains Mono', monospace";
                ctx.textAlign = "left";
                ctx.fillText(`${pt.designId} (${pt.x}m)`, cx + 9, cy + 3);
              }
            }

            ctx.restore();
          },
        ],
      },
    };

    activePlot = new uPlot(opts, [xs, ys], chartMount);
  }
}
