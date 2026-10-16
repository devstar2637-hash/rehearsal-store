import type { ExtendedRunResult } from "../types.ts";
import {
  computeLandscapeCounts,
  escapeHtml,
  formatNum,
  isUncalibrated,
  renderComputedChip,
} from "../format.ts";

export type DecisionChoice = "proceed" | "hold" | "measure" | null;

export interface DecisionCallbacks {
  onSelectDecision: (choice: "proceed" | "hold" | "measure", reason: string) => void;
  onReasonChange: (reason: string) => void;
  onExportCsv: () => Promise<void> | void;
}

export function renderDecisionScreen(
  container: HTMLElement,
  result: ExtendedRunResult,
  currentChoice: DecisionChoice,
  currentReason: string,
  exportStatusMessage: string | null,
  callbacks: DecisionCallbacks
): void {
  const uncalibrated = isUncalibrated(result);
  const counts = computeLandscapeCounts(
    result.results,
    result.constraints.horizonMonths ?? 36
  );

  const choiceStatusLabel =
    currentChoice === "hold"
      ? "Hold: insufficient evidence (보류: 근거 불충분 — 정상 완료 상태)"
      : currentChoice === "measure"
      ? `Measure: 7일 현장 실측 우선 진행 (${
          result.nextMeasurement?.variable ?? "cupsPerDayBase"
        })`
      : currentChoice === "proceed"
      ? `Proceed: 선두 설계(${
          result.leaderDesignId ?? "d-00001"
        }) 기반 리허설 검토 완료`
      : "Hold: insufficient evidence (기본 권고 대기 상태 — 결정을 선택하십시오)";

  container.innerHTML = `
    <section class="screen-section" id="screen-decision" data-screen="decision">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">06. 의사결정 기록 및 내보내기 (Decision & CSV Export)</div>
          <h2 class="screen-title">
            리허설 의사결정 기록 (Rehearsal Decision Record)
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
          <p class="screen-subtitle">
            <strong>Hold: insufficient evidence</strong>는 완전하고 정상적인 최종 종료 상태(complete end state)입니다.
            모든 수치는 <strong>scenario frequency</strong>이며 <strong>rehearsal, not advice</strong> 원칙을 따릅니다.
          </p>
        </div>
      </div>

      <div class="decision-card">
        <div class="decision-summary-strip">
          <div class="decision-summary-item">
            <span class="decision-summary-label">현재 선택된 결정 (decision.choice)</span>
            <span class="decision-summary-val font-mono" data-testid="decision-state">
              ${escapeHtml(choiceStatusLabel)}
            </span>
          </div>
          <div class="decision-summary-item">
            <span class="decision-summary-label">시나리오 집계 요약</span>
            <span class="font-mono text-xs">
              ${formatNum(counts.survivorCount)} survive / ${formatNum(
    counts.failCount
  )} of ${formatNum(counts.totalVariants)} fail by month 36
              ${renderComputedChip("engine")}
            </span>
          </div>
        </div>

        <div class="decision-buttons-row" role="group" aria-label="Decision choice buttons">
          <button
            type="button"
            id="btn-decision-proceed"
            data-choice="proceed"
            class="decision-btn ${
              currentChoice === "proceed" ? "decision-btn--active-proceed" : ""
            }"
          >
            <span class="decision-btn__title">Proceed (진행)</span>
            <span class="decision-btn__desc font-mono">choice: "proceed" · 선두 설계(${escapeHtml(
              result.leaderDesignId ?? "d-00001"
            )}) 조건부 진행</span>
          </button>

          <button
            type="button"
            id="btn-decision-hold"
            data-choice="hold"
            class="decision-btn ${
              currentChoice === "hold" || currentChoice === null
                ? "decision-btn--active-hold"
                : ""
            }"
          >
            <span class="decision-btn__title">Hold (보류)</span>
            <span class="decision-btn__desc font-mono">Hold: insufficient evidence (정상 완료 상태)</span>
          </button>

          <button
            type="button"
            id="btn-decision-measure"
            data-choice="measure"
            class="decision-btn ${
              currentChoice === "measure" ? "decision-btn--active-measure" : ""
            }"
          >
            <span class="decision-btn__title">Measure (현장 실측)</span>
            <span class="decision-btn__desc font-mono">choice: "measure" · ${escapeHtml(
              result.nextMeasurement?.variable ?? "cupsPerDayBase"
            )} 7일 실측 후 재실행</span>
          </button>
        </div>

        <div class="decision-reason-box">
          <label for="decision-reason-input" class="decision-reason-label">
            결정 사유 기록 (decision.reason)
          </label>
          <textarea
            id="decision-reason-input"
            rows="3"
            class="decision-reason-textarea font-mono"
            placeholder="예: Hold: insufficient evidence — cupsPerDayBase 임계값(119.1 cups/day) 인근 현장 실측 전까지 보류"
          >${escapeHtml(currentReason)}</textarea>
        </div>

        <div class="decision-export-row">
          <button
            type="button"
            id="btn-export-csv"
            class="btn-secondary font-mono"
            data-testid="export-csv-btn"
          >
            Export CSV (/runs/${escapeHtml(result.runId)}/export?format=csv)
          </button>
          ${
            exportStatusMessage
              ? `<span class="export-status-msg font-mono" data-testid="export-status">${escapeHtml(
                  exportStatusMessage
                )}</span>`
              : ""
          }
        </div>
      </div>
    </section>
  `;

  const reasonInput = container.querySelector<HTMLTextAreaElement>(
    "#decision-reason-input"
  );
  if (reasonInput) {
    reasonInput.addEventListener("input", () => {
      callbacks.onReasonChange(reasonInput.value);
    });
  }

  const buttons = container.querySelectorAll<HTMLButtonElement>(
    ".decision-btn[data-choice]"
  );
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-choice") as
        | "proceed"
        | "hold"
        | "measure";
      let nextReason = reasonInput ? reasonInput.value.trim() : currentReason;
      if (!nextReason) {
        if (choice === "hold") {
          nextReason =
            "Hold: insufficient evidence — daily cup demand cliff requires onsite verification before commitment.";
        } else if (choice === "measure") {
          nextReason =
            "Measure: execute 7-day onsite cup count at two nearest comparable cafes.";
        } else {
          nextReason = `Proceed with leader design ${
            result.leaderDesignId ?? "d-00001"
          } under 10% reserve rule.`;
        }
      }
      callbacks.onSelectDecision(choice, nextReason);
    });
  });

  const exportBtn = container.querySelector<HTMLButtonElement>(
    "#btn-export-csv"
  );
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      callbacks.onExportCsv();
    });
  }
}
