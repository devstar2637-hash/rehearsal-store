import type {
  ExtendedRunResult,
  StoreDesign,
  VariantResult,
} from "../types.ts";
import {
  escapeHtml,
  formatKrw,
  formatNum,
  formatRelativeDelta,
  isUncalibrated,
  renderComputedChip,
  renderSourceChip,
} from "../format.ts";

export function renderCliffScreen(
  container: HTMLElement,
  result: ExtendedRunResult
): void {
  const cliff = result.cliff;
  const uncalibrated = isUncalibrated(result);
  const tags = result.sourceTags ?? {};

  if (!cliff) {
    container.innerHTML = `
      <section class="screen-section" id="screen-cliff" data-screen="cliff">
        <div class="screen-header">
          <div>
            <div class="screen-kicker">03. 임계 절벽 분석 (Assumption Cliff · AT-07)</div>
            <h2 class="screen-title">
              가정 민감도 절벽 (Cliff Boundary)
              ${
                uncalibrated
                  ? `<span class="uncalibrated-inline-badge">미보정</span>`
                  : ""
              }
            </h2>
          </div>
        </div>
        <div class="cliff-empty-card" data-testid="cliff-null">
          No single assumption flips the #1 design within ±30 %.
          ${renderComputedChip("engine")}
        </div>
      </section>
    `;
    return;
  }

  const designBelow: StoreDesign | undefined = result.designs.find(
    (d) => d.id === cliff.leaderBelow
  );
  const designAbove: StoreDesign | undefined = result.designs.find(
    (d) => d.id === cliff.leaderAbove
  );
  const resultBelow: VariantResult | undefined = result.results.find(
    (r) => r.designId === cliff.leaderBelow
  );
  const resultAbove: VariantResult | undefined = result.results.find(
    (r) => r.designId === cliff.leaderAbove
  );

  interface CompareRow {
    label: string;
    belowVal: string;
    aboveVal: string;
    sourceChip: string;
    highlight?: boolean;
  }

  const compareRows: CompareRow[] = [
    {
      label: "설계 ID (id)",
      belowVal: designBelow?.id ?? cliff.leaderBelow,
      aboveVal: designAbove?.id ?? cliff.leaderAbove,
      sourceChip: renderComputedChip("engine"),
    },
    {
      label: "군 ID (familyId)",
      belowVal: designBelow?.familyId ?? "—",
      aboveVal: designAbove?.familyId ?? "—",
      sourceChip: renderComputedChip("engine"),
    },
    {
      label: "일 기본 판매 잔수 (cupsPerDayBase)",
      belowVal: `${formatNum(designBelow?.cupsPerDayBase)} cups/day`,
      aboveVal: `${formatNum(designAbove?.cupsPerDayBase)} cups/day`,
      sourceChip: renderSourceChip(tags.cupsPerDayBase, true),
      highlight: cliff.variable === "cupsPerDayBase",
    },
    {
      label: "좌석 수 (seats)",
      belowVal: `${formatNum(designBelow?.seats)} 석`,
      aboveVal: `${formatNum(designAbove?.seats)} 석`,
      sourceChip: renderSourceChip(tags.seats, true),
    },
    {
      label: "전용 면적 (floorAreaM2)",
      belowVal: `${formatNum(designBelow?.floorAreaM2)} m²`,
      aboveVal: `${formatNum(designAbove?.floorAreaM2)} m²`,
      sourceChip: renderSourceChip(tags.floorAreaM2, true),
    },
    {
      label: "보증금 (deposit)",
      belowVal: formatKrw(designBelow?.deposit.value),
      aboveVal: formatKrw(designAbove?.deposit.value),
      sourceChip: renderSourceChip(designAbove?.deposit.source, true),
    },
    {
      label: "월 임차료 (monthlyRent)",
      belowVal: formatKrw(designBelow?.monthlyRent.value),
      aboveVal: formatKrw(designAbove?.monthlyRent.value),
      sourceChip: renderSourceChip(designAbove?.monthlyRent.source, true),
    },
    {
      label: "시설·장비비 (fitoutCost)",
      belowVal: formatKrw(designBelow?.fitoutCost.value),
      aboveVal: formatKrw(designAbove?.fitoutCost.value),
      sourceChip: renderSourceChip(designAbove?.fitoutCost.source, true),
    },
    {
      label: "유급 직원 수 (staffFte)",
      belowVal: `${formatNum(designBelow?.staffFte)} FTE`,
      aboveVal: `${formatNum(designAbove?.staffFte)} FTE`,
      sourceChip: renderSourceChip(tags.staffFte, true),
    },
    {
      label: "메뉴 구성 단계 (menuTier)",
      belowVal: `Tier ${formatNum(designBelow?.menuTier)}`,
      aboveVal: `Tier ${formatNum(designAbove?.menuTier)}`,
      sourceChip: renderComputedChip("engine"),
    },
    {
      label: "평균 객단가 (avgTicketKrw)",
      belowVal: formatKrw(designBelow?.avgTicketKrw),
      aboveVal: formatKrw(designAbove?.avgTicketKrw),
      sourceChip: renderSourceChip(tags.avgTicketKrw, true),
    },
    {
      label: "제조 시간 (makeTimeSec)",
      belowVal: `${formatNum(designBelow?.makeTimeSec)} sec`,
      aboveVal: `${formatNum(designAbove?.makeTimeSec)} sec`,
      sourceChip: renderSourceChip(tags.makeTimeSec, true),
    },
    {
      label: "매출원가율 (cogsRatio)",
      belowVal: formatNum(designBelow?.cogsRatio),
      aboveVal: formatNum(designAbove?.cogsRatio),
      sourceChip: renderSourceChip(tags.cogsRatio, true),
    },
    {
      label: "개업 월 (openingMonth)",
      belowVal: `${formatNum(designBelow?.openingMonth)}월`,
      aboveVal: `${formatNum(designAbove?.openingMonth)}월`,
      sourceChip: renderSourceChip(tags.openingMonth, true),
    },
    {
      label: "36개월 생존 개월 (survivedMonths)",
      belowVal: `${formatNum(resultBelow?.survivedMonths)} mo`,
      aboveVal: `${formatNum(resultAbove?.survivedMonths)} mo`,
      sourceChip: renderComputedChip("engine"),
    },
    {
      label: "최저 보유 현금 (cashMin)",
      belowVal: formatKrw(resultBelow?.cashMin),
      aboveVal: formatKrw(resultAbove?.cashMin),
      sourceChip: renderComputedChip("engine"),
    },
    {
      label: "36개월 누적 손익 (cumPnL)",
      belowVal: formatKrw(resultBelow?.cumPnL),
      aboveVal: formatKrw(resultAbove?.cumPnL),
      sourceChip: renderComputedChip("engine"),
    },
  ];

  container.innerHTML = `
    <section class="screen-section" id="screen-cliff" data-screen="cliff">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">03. 임계 절벽 분석 (Assumption Cliff · Single Boundary Flip)</div>
          <h2 class="screen-title">
            선두 설계가 뒤집히는 임계 경계 (Leader Flip Cliff)
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
          <p class="screen-subtitle">
            단일 가정 변수가 임계값(boundaryValue)을 지날 때 1위 설계가 교체되는 지점입니다 (<strong>scenario frequency</strong> 기반 · <strong>rehearsal, not advice</strong>).
          </p>
        </div>
      </div>

      <div class="cliff-card" data-testid="cliff-card">
        <div class="cliff-metrics-grid">
          <div class="cliff-metric-box">
            <span class="cliff-metric-box__label">임계 변수 (variable)</span>
            <div class="cliff-metric-box__value font-mono">
              ${escapeHtml(String(cliff.variable))}
              ${renderComputedChip("engine")}
            </div>
          </div>

          <div class="cliff-metric-box">
            <span class="cliff-metric-box__label">경계 수치 (boundaryValue + unit)</span>
            <div class="cliff-metric-box__value font-mono">
              ${formatNum(cliff.boundaryValue)} ${escapeHtml(cliff.unit)}
              ${renderComputedChip("engine")}
            </div>
          </div>

          <div class="cliff-metric-box">
            <span class="cliff-metric-box__label">기준 대비 상대 변동폭 (relativeDelta)</span>
            <div class="cliff-metric-box__value font-mono" data-testid="cliff-delta">
              ${escapeHtml(formatRelativeDelta(cliff.relativeDelta))}
              ${renderComputedChip("engine")}
            </div>
          </div>

          <div class="cliff-metric-box">
            <span class="cliff-metric-box__label">선두 설계 전환 (leaderBelow → leaderAbove)</span>
            <div class="cliff-metric-box__value font-mono">
              <span>${escapeHtml(cliff.leaderBelow)}</span>
              <span class="mx-1">↔</span>
              <span>${escapeHtml(cliff.leaderAbove)}</span>
              ${renderComputedChip("engine")}
            </div>
          </div>
        </div>

        <div class="cliff-comparison-wrap">
          <h3 class="cliff-comparison-title">
            임계값 하단 선두 (<span class="font-mono">${escapeHtml(
              cliff.leaderBelow
            )}</span> · leaderBelow) vs 임계값 상단 선두 (<span class="font-mono">${escapeHtml(
    cliff.leaderAbove
  )}</span> · leaderAbove) 핵심 설계 비교
          </h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>설계 항목 (Key Field)</th>
                  <th class="text-right">
                    leaderBelow: <span class="font-mono">${escapeHtml(
                      cliff.leaderBelow
                    )}</span>
                    <span class="sub-th">(&lt; ${formatNum(
                      cliff.boundaryValue
                    )} ${escapeHtml(cliff.unit)})</span>
                  </th>
                  <th class="text-right">
                    leaderAbove: <span class="font-mono">${escapeHtml(
                      cliff.leaderAbove
                    )}</span>
                    <span class="sub-th">(&ge; ${formatNum(
                      cliff.boundaryValue
                    )} ${escapeHtml(cliff.unit)})</span>
                  </th>
                  <th>출처 태그 (Source Tag)</th>
                </tr>
              </thead>
              <tbody>
                ${compareRows
                  .map(
                    (row) => `
                  <tr class="${row.highlight ? "row-cliff-highlight" : ""}">
                    <td class="font-mono">${escapeHtml(row.label)}</td>
                    <td class="text-right font-mono">${escapeHtml(
                      row.belowVal
                    )}</td>
                    <td class="text-right font-mono font-semibold">${escapeHtml(
                      row.aboveVal
                    )}</td>
                    <td>${row.sourceChip}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}
