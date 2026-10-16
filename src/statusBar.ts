import type { ExtendedRunResult, GateLogEntry } from "./types.ts";
import {
  escapeHtml,
  formatFileName,
  formatNum,
  formatShortHash,
  isUncalibrated,
  renderComputedChip,
} from "./format.ts";

export interface StatusBarCallbacks {
  onModeChange: (newMode: 1000 | 10000) => void;
}

function renderGateBadge(entry: GateLogEntry): string {
  const statusClass =
    entry.passed === true
      ? "gate-item--pass"
      : entry.passed === false
      ? "gate-item--fail"
      : "gate-item--null";
  const stateLabel =
    entry.passed === true ? "PASS" : entry.passed === false ? "FAIL" : "NULL";
  const timeShort = entry.at ? entry.at.replace("T", " ").replace("Z", " UTC") : "—";
  const valPart =
    entry.value !== undefined ? ` (val: ${formatNum(entry.value)})` : "";

  return `
    <div class="gate-item ${statusClass}" title="${escapeHtml(
    `${entry.gate}: ${stateLabel} · ${entry.detail}${valPart} @ ${entry.at}`
  )}">
      <span class="gate-item__name">${escapeHtml(entry.gate)}</span>
      <span class="gate-item__state">${stateLabel}</span>
      <span class="gate-item__detail">${escapeHtml(entry.detail)}${escapeHtml(
    valPart
  )}</span>
      <span class="gate-item__time">${escapeHtml(timeShort)}</span>
    </div>
  `;
}

export function renderStatusBar(
  container: HTMLElement,
  result: ExtendedRunResult,
  selectedMode: 1000 | 10000,
  callbacks: StatusBarCallbacks
): void {
  const st = result.status;
  const shortHash = formatShortHash(st.inputHash);
  const fileNames = (st.inputFiles ?? []).map(formatFileName);
  const endState = st.endState ?? "DONE";
  const endStateClass =
    endState === "DONE"
      ? "end-state--done"
      : endState === "FAIL"
      ? "end-state--fail"
      : "end-state--blocked";

  const modeLabel =
    selectedMode === 10000
      ? result.mode === 10000 && result.modeLabel
        ? result.modeLabel
        : "500 AI design families x 20 variations"
      : "1,000 variants";

  const uncalibrated = isUncalibrated(result);

  const tokenCallsHtml = (st.tokens ?? [])
    .map(
      (t) =>
        `<span class="token-call-item">${escapeHtml(t.model)} · ${escapeHtml(
          t.call
        )} (in:${formatNum(t.inputTokens)} / out:${formatNum(
          t.outputTokens
        )})</span>`
    )
    .join(" ");

  const gateItemsHtml = (st.gateLog ?? []).map(renderGateBadge).join("");

  container.innerHTML = `
    <div class="status-bar__inner">
      <div class="status-bar__primary-row">
        <div class="status-bar__group">
          <span class="status-bar__label">runId</span>
          <span class="status-bar__value font-mono" data-testid="runId">${escapeHtml(
            st.runId
          )}</span>
          ${
            st.replay
              ? `<span class="replay-badge" data-testid="replay" title="${escapeHtml(
                  st.endReason ?? "Replay sample loaded"
                )}">replay</span>`
              : `<span class="replay-badge replay-badge--live" data-testid="replay" hidden>live</span>`
          }
          ${
            uncalibrated
              ? `<span class="uncalibrated-badge" data-testid="uncalibrated-status">미보정 (Uncalibrated)</span>`
              : ""
          }
        </div>

        <div class="status-bar__group">
          <span class="status-bar__label">inputHash</span>
          <span class="status-bar__value font-mono" data-testid="inputHash" title="${escapeHtml(
            st.inputHash ?? ""
          )}">${escapeHtml(shortHash)}</span>
        </div>

        <div class="status-bar__group">
          <span class="status-bar__label">engineSha</span>
          <span class="status-bar__value font-mono" data-testid="engineSha">${escapeHtml(
            st.engineSha ?? "—"
          )}</span>
        </div>

        <div class="status-bar__group">
          <span class="status-bar__label">endState</span>
          <span class="status-bar__endstate ${endStateClass}" data-testid="endState" title="${escapeHtml(
            st.endReason ?? ""
          )}">
            <strong>${escapeHtml(endState)}</strong>
            ${
              st.endReason
                ? `<span class="status-bar__endreason">${escapeHtml(
                    st.endReason
                  )}</span>`
                : ""
            }
          </span>
        </div>

        <div class="status-bar__group status-bar__group--mode">
          <label for="status-n-select" class="status-bar__label">N</label>
          <select id="status-n-select" class="status-bar__select font-mono" aria-label="Variant count mode selector">
            <option value="1000" ${
              selectedMode === 1000 ? "selected" : ""
            }>1,000</option>
            <option value="10000" ${
              selectedMode === 10000 ? "selected" : ""
            }>10,000</option>
          </select>
          <span class="status-bar__modelabel" data-testid="modeLabel">
            mode=${formatNum(selectedMode)} · ${escapeHtml(modeLabel)}
          </span>
          ${renderComputedChip("engine")}
        </div>
      </div>

      <div class="status-bar__secondary-row">
        <div class="status-bar__group status-bar__group--files">
          <span class="status-bar__label">inputFiles (${formatNum(
            fileNames.length
          )})</span>
          <div class="status-bar__files-list" title="${escapeHtml(
            (st.inputFiles ?? []).join("\n")
          )}">
            ${fileNames
              .map(
                (fn) =>
                  `<span class="status-bar__file-item font-mono">${escapeHtml(
                    fn
                  )}</span>`
              )
              .join('<span class="status-bar__sep">·</span>')}
          </div>
        </div>

        <div class="status-bar__group status-bar__group--tokens" data-testid="tokens">
          <span class="status-bar__label">tokens</span>
          <span class="status-bar__value font-mono">
            total in:${formatNum(st.tokenTotal?.input ?? 0)} / out:${formatNum(
    st.tokenTotal?.output ?? 0
  )}
          </span>
          ${renderComputedChip("engine")}
          <div class="status-bar__token-calls font-mono">${tokenCallsHtml}</div>
        </div>
      </div>

      <div class="status-bar__gates-row" data-testid="gateLog">
        <span class="status-bar__label">gateLog</span>
        <div class="status-bar__gates-list">
          ${gateItemsHtml}
        </div>
      </div>
    </div>
  `;

  const selectEl = container.querySelector<HTMLSelectElement>(
    "#status-n-select"
  );
  if (selectEl) {
    selectEl.addEventListener("change", () => {
      const val = Number(selectEl.value) === 1000 ? 1000 : 10000;
      callbacks.onModeChange(val);
    });
  }
}
