import type { ExtendedRunResult } from "../types.ts";
import {
  escapeHtml,
  formatNum,
  isUncalibrated,
  renderComputedChip,
} from "../format.ts";

export function renderRoundsScreen(
  container: HTMLElement,
  result: ExtendedRunResult
): void {
  const rounds = result.rounds ?? [];
  const uncalibrated = isUncalibrated(result);
  const isEmpty = rounds.length === 0;

  container.innerHTML = `
    <section class="screen-section" id="screen-rounds" data-screen="rounds">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">05. 적대적 스트레스 라운드 (Adversarial Rounds · BankruptcyDesigner)</div>
          <h2 class="screen-title">
            적대적 충격 라운드 이력 (Adversarial Stress Rounds)
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
        </div>
      </div>

      ${
        isEmpty
          ? `
        <div class="rounds-empty-line font-mono" data-testid="rounds-empty">
          adversarial rounds not run
          ${renderComputedChip("engine")}
        </div>
      `
          : ""
      }

      <div class="rounds-table-wrap" ${isEmpty ? "hidden" : ""}>
        <div class="table-scroll">
          <table class="data-table" data-testid="rounds-table">
            <thead>
              <tr>
                <th class="text-right">라운드 (round)</th>
                <th class="text-right">추가된 충격 (shocksAdded)</th>
                <th class="text-right">폐업 수 (deaths)</th>
                <th class="text-right">신규 실패군 (newFailureFamilies)</th>
                <th class="text-right">비지배 생존 (nonDominatedSurvivors)</th>
                <th>변경 주체 (changed)</th>
                <th>중단 사유 (stopReason)</th>
              </tr>
            </thead>
            <tbody>
              ${rounds
                .map(
                  (r) => `
                <tr>
                  <td class="text-right font-mono">${formatNum(
                    r.round
                  )} ${renderComputedChip("engine")}</td>
                  <td class="text-right font-mono">${formatNum(
                    r.shocksAdded
                  )} ${renderComputedChip("engine")}</td>
                  <td class="text-right font-mono">${formatNum(
                    r.deaths
                  )} ${renderComputedChip("engine")}</td>
                  <td class="text-right font-mono">${formatNum(
                    r.newFailureFamilies
                  )} ${renderComputedChip("engine")}</td>
                  <td class="text-right font-mono">${formatNum(
                    r.nonDominatedSurvivors
                  )} ${renderComputedChip("engine")}</td>
                  <td class="font-mono">${escapeHtml(r.changed)}</td>
                  <td class="font-mono">${escapeHtml(r.stopReason ?? "—")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
