import type { ExtendedRunResult } from "../types.ts";
import {
  escapeHtml,
  formatNum,
  isUncalibrated,
  renderComputedChip,
} from "../format.ts";

export function renderNextMeasurementScreen(
  container: HTMLElement,
  result: ExtendedRunResult
): void {
  const nm = result.nextMeasurement;
  const uncalibrated = isUncalibrated(result);

  if (!nm) {
    container.innerHTML = `
      <section class="screen-section" id="screen-next-measurement" data-screen="next-measurement">
        <div class="screen-header">
          <div>
            <div class="screen-kicker">04. 다음 현장 측정 과제 (Next Measurement · 7-Day Action)</div>
            <h2 class="screen-title">
              다음 현장 실측 권고 (Next Measurement)
              ${
                uncalibrated
                  ? `<span class="uncalibrated-inline-badge">미보정</span>`
                  : ""
              }
            </h2>
          </div>
        </div>
        <div class="empty-notice">No next measurement recommendation in RunResult.</div>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <section class="screen-section" id="screen-next-measurement" data-screen="next-measurement">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">04. 다음 현장 측정 과제 (Next Measurement · 7-Day Onsite Action)</div>
          <h2 class="screen-title">
            최우선 현장 실측 항목 (Priority Onsite Verification)
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
          <p class="screen-subtitle">
            가정 불확실성을 줄여 선두 설계 판정을 안정화하기 위한 7일 현장 실측 프로토콜입니다 (<strong>rehearsal, not advice</strong>).
          </p>
        </div>
      </div>

      <div class="measurement-card" data-testid="next-measurement-card">
        <div class="measurement-card__top">
          <div class="measurement-stat">
            <span class="measurement-stat__label">측정 대상 변수 (variable)</span>
            <div class="measurement-stat__value font-mono">
              ${escapeHtml(nm.variable)}
              ${renderComputedChip("engine")}
            </div>
          </div>

          <div class="measurement-stat">
            <span class="measurement-stat__label">우선순위 점수 (priorityScore)</span>
            <div class="measurement-stat__value font-mono">
              ${formatNum(nm.priorityScore)}
              ${renderComputedChip("engine")}
            </div>
          </div>

          ${
            nm.uncertaintyWidth !== undefined
              ? `
            <div class="measurement-stat">
              <span class="measurement-stat__label">불확실성 폭 (uncertaintyWidth)</span>
              <div class="measurement-stat__value font-mono">
                ±${formatNum(nm.uncertaintyWidth)}
                ${renderComputedChip("engine")}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <div class="measurement-card__body">
          <div class="measurement-block">
            <div class="measurement-block__label">선정 사유 (why)</div>
            <p class="measurement-block__text">
              ${escapeHtml(nm.why)}
              ${renderComputedChip("engine")}
            </p>
          </div>

          <div class="measurement-block measurement-block--action">
            <div class="measurement-block__label">7일 현장 실측 지침 (howToMeasureOnsite · 7-Day Action)</div>
            <p class="measurement-block__text font-medium">
              ${escapeHtml(nm.howToMeasureOnsite)}
              ${renderComputedChip("engine")}
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}
