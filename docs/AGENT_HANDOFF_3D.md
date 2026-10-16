# Rehearsal — 3D and 10,000-condition agent handoff

Snapshot: 16 October 2026, KST. Preview branch: `codex/rehearsal-3d-preview`. Released runtime: `9930ea224245e307d60c5e09496c50ee6837447d`. Main remains unmerged.

## Copyable Korean handoff prompt

> Rehearsal의 승인된 실제 3D 방향을 유지하면서 업종 4개의 모델 차이와 1만 조건 탐색을 연결해 주세요. 먼저 이 문서와 현재 변경 파일을 읽고, Antigravity의 미커밋 작업을 보존하세요. 작업 브랜치는 `codex/rehearsal-3d-preview`, 검토는 PR #2이며 main에 자동 병합하지 않습니다. `origin/main`의 `4667997` D3 통계 작업은 아직 포함되지 않았으므로 hard reset이나 전체 파일 덮어쓰기 대신 필요한 UI·렌더러 변경을 선택적으로 통합하세요. 담당 경로만 수정하고 `rehearsalCore.ts`·shared·기존 기준 테스트/fixture는 유지하세요. 우클릭 회전·휠 확대는 계산을 바꾸지 않고, 왼쪽 가구 드래그만 유효한 장면 변경과 재계산으로 이어져야 합니다. 1만 조건의 빠른 용량 스크리닝, 선택 조건의 상세 시뮬레이션, 선택적 전체 상세 배치의 실제 완료 수를 각각 표시하세요. 고정 예시를 실제 결과나 생존확률로 바꾸지 마세요. 변경 파일, 실제 확인한 것, 미완료, 정확한 소스/실행 증거를 보고하고 배포는 통합 담당에게 넘기세요.

## Current release and evidence

Released runtime: `9930ea224245e307d60c5e09496c50ee6837447d`.

- Preview: https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app
- Service/revision: `rehearsal-3d-preview` / `rehearsal-3d-preview-00002-sjr`, project `h2gdm-hack26icn-2637`, region `asia-northeast3`.
- Source branch: https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-3d-preview.
- Review: https://github.com/devstar2637-hash/rehearsal-store/pull/2. Main remains unmerged.
- Build/type check and 16 selected tests passed. Independent local UI checks passed 15/15, with a separate final mesh recheck passing 2/2. Public interaction smoke passed 9/9. These are distinct scopes, not a merged benchmark score.
- Four industry model geometries/material signatures and views differ. All four categories expose 10,000 generated unique conditions; the current screen labels analytic, selected-pair and batch counts separately.
- One actual local coffee/proposed-scene worker completed 10,000 unique cases in 11,849.5 ms: 2,500 blocked / 7,500 open / zero conservation failures. Five main-thread recomputations using the same core matched checked compact fields; the downloaded receipt matched.
- One actual public-page coffee client-worker completed in 74,711.6 ms, with all 10,000 compact rows matching the verified local population and an exact 2,928,628-byte receipt download. This is browser-side execution after static deployment, not Cloud server or model timing. No detailed full-run claim is made for the other three categories or a paired 20,000 population.
- Main JavaScript and worker bytes match the checked local build. Public 390 px fit and observed errors/request scope passed; model/API/POST calls were zero.

The current V2 English packet and actual `rehearsal-v2-3d-four-concepts-walkthrough-en.mp4` (114.069987 seconds, English narration/captions, seven local captured-screen states) supersede the prior 2.5D materials for this branch. Video public hosting and authenticated-form submission remain incomplete.

## Ownership and integration contracts

- **UI integrator — `src/main.ts`, `styles.css`:** connects category selection, explorer controls/results and existing state/export flow. Confirm these paths with the active owner before editing.
- **WebGL owner — `src/engine/threeRenderer.ts`:** procedural room/furniture, materials, camera, picking and drag-plane mapping. Category models are implemented/frozen and independent local visual checks passed.
- **Explorer owner — `src/engine/scenarioExplorer.ts`, `src/engine/scenarioExplorer.worker.ts`, `src/engine/scenarioExplorer.test.ts`:** pure condition generation/analytic screening, the bounded worker interface and focused tests. Reuse the owned worker/protocol below rather than creating an overlapping worker.
- **Core/reference boundary — `src/engine/rehearsalCore.ts`, shared contracts, existing core tests and public fixtures:** retain the reviewed behavior and fixed references. New exploratory tests belong in separately owned files.
- **Verifier:** reads exact builds and actual UI/download outputs; keeps evidence outside application source. Prior checks do not certify newly changed features.
- **Release integrator:** owns dependency/build/deployment coordination, frozen commit, PR update and separate preview service. No agent silently merges main or overwrites another agent's dirty files.
- **Documentation owner:** README and `docs/*.md`; no runtime source or release commit changes.

The active dependency graph is `index.html → src/main.ts → rehearsalCore.ts + threeRenderer.ts`, plus the sample-blueprint helper and decorative UI modules. The production server serves Vite assets and `/_health`; the spatial calculation runs in the browser. Older financial/sample API modules are not proof of current runtime behavior.

### Renderer API and pointer semantics

- `drawWorldCanvas(options): ThreeView` reads a scene, calculated result, playback time and presentation state.
- Frozen category contract supplied by the renderer owner: `StoreCategory = 'coffee' | 'bakery' | 'matcha' | 'wine'`; `ThreeDrawWorldOptions` extends `DrawWorldOptions` with `categoryKey?: StoreCategory`. `drawWorldCanvas` accepts this extended options type. Pass the selected category to **both** world views.
- `pickObject(view, px, py) → { id, point, height } | null` selects visible furniture using CSS-pixel canvas coordinates.
- `unproject(view, px, py, planeHeight = 0): Point2D` maps the perspective pointer ray to a drag plane. Keep the picked elevation during dragging; a top-surface pick and ground-plane movement must not be mixed.
- Right-drag belongs to camera orbit; wheel/middle drag to camera dolly; supported two-finger gestures to dolly/rotation. Left click/drag belongs to movable furniture. Camera-only actions must preserve the entire scenario packet and calculation revision.
- A valid furniture placement goes through the existing position-validation/recalculation path. Preserve blocked-route status and null waits; never convert a blocked route into a successful zero wait.

Implemented and independently locally checked visual sets: coffee has espresso equipment, coffee bags/tins; bakery has a double-deck oven, three-tier bread rack and procedural scored loaves; matcha has noren panels, bamboo-window treatment, bowls/canisters and low-table cushions; wine has burgundy/dark surfaces, bottle library, bar stools and dim warm lighting. These are category-specific procedural visuals, not operating-performance models.

### Fast 10,000-condition explorer contract — released

The explorer owner supplied `generateScenarios(categoryId)` with categories `coffee | bakery | matcha | wine`:

- Return: `{ categoryId, candidates, metadata }`.
- Candidate fields: `id`, `index`, `categoryId`, `arrivalPerMin`, `serviceSec`, `orderStaff`, `pickupStaff`, `bodyWidthM`, `seed: 42`, `orderUtilization`, `pickupUtilization`, `bottleneckUtilization`, `status`.
- Metadata: `count: 10000`, `detailedSimulationCount: 0` for the **initial analytic screen**, `executionScope: 'analytic_screen'`, `label`, `axes`, `counts: { withinCapacity, nearCapacity, overCapacity }`, `assumptions`.
- Grid: 10 arrival settings × 10 service settings × 5 order-staff settings × 5 pickup-staff settings × 4 body widths. Count distinct condition tuples, not merely distinct labels.
- Analytic expected requirements: order service `0.45 × serviceSec`, pickup service `serviceSec`. Maximum utilization at least 1 means over-capacity; at least 0.85 means near-capacity; the remainder is within-capacity under these assumptions.
- This screen does **not** solve geometry, queue waiting time, profit or business survival. Body width is an input axis whose spatial effect requires detailed core execution.
- On selection, adapt `arrivalPerMin → arrivalsPerMin` and `bodyWidthM → bodyWidth`, then use the existing paired detailed calculation. Do not silently drop `orderStaff`, `pickupStaff`, `serviceSec` or seed when moving into the detailed view.

Actual enumeration receipt: `deliverables/rehearsal-scenario-explorer/enumeration-receipt.json` in the shared workspace. All four categories each generated 10,000 unique IDs **and unique parameter tuples** (40,000 available across the four category sets, not 40,000 detailed executions). The focused three-test suite, type check and production build passed; the build emitted a dedicated worker asset. Observed within/near/over-capacity counts were coffee `6424 / 540 / 3036`, bakery `6024 / 608 / 3368`, matcha `7688 / 460 / 1852`, wine `7504 / 536 / 1960`. These counts are analytic classifications and every enumeration receipt still has `detailedSimulationCount: 0`. Candidate status values are `within_capacity`, `near_capacity`, `over_capacity`.

### Verified UI wiring at released source 9930ea2

UI-owner report confirms `categoryKey: state.categoryId` is passed to both `drawWorldCanvas` calls. Integration points:

- `openExplorerHeaderBtn` / `openExplorerBtn` open the `scenarioExplorer` dialog; `closeExplorerBtn` closes it.
- `scenarioMap` contains a 100 × 100 map of the actual generated condition rows. Its color shows **arrival intensity**, not profit, survival or measured performance.
- `selectedScenarioId` / `selectedScenarioDetails` describe the selected condition. `applyScenarioBtn` runs the selected condition through two detailed baseline/proposal core calculations.
- `runScenarioBatchBtn` starts the optional one-scene detailed worker. `cancelScenarioBatchBtn` cancels it; `scenarioBatchProgress` / `scenarioBatchStatus` show observed progress/state.
- `downloadScenarioBatchBtn` exports only a completed receipt for the current scene revision and category as `rehearsal-10000-detailed-results.json`, retaining all 10,000 result rows and the scene snapshot.
- Read-only API: `window.RehearsalApp.scenarioExplorer()` returns `{ categoryId, generatedCount, uniqueIdCount, metadata, candidates, selectedId, currentDetailedPairCount, batch }`. Batch fields include `{ status, completedCount, sceneRevision, currentSceneRevision, mode: 'detailed_core_batch', receipt }`.
- The normal `packet()` is version 3 and includes exploration metadata. The count for a selected detailed pair is distinct from completed full-batch scenario count; read these actual fields rather than inferring them from the rendered grid.
- Every immediate/debounced recomputation invalidates active batch work and clears its receipt; job token, scene revision and category guards prevent late completion or export under changed inputs. Local UI checks exercised cancellation/stale guards, and the public smoke confirmed the actual worker and current complete-receipt path.

### Optional detailed worker — coffee full execution verified

Export: `runScenarioBatch(scene, categoryId, onProgress, { signal?, maxDurationMs? }) → Promise<ScenarioBatchReceipt>`. Default time limit: 120,000 ms. The owned worker is `src/engine/scenarioExplorer.worker.ts`.

- Scope: **one snapshot of the current proposed scene × 10,000 conditions**, not paired baseline/proposal execution of 20,000 cases.
- Progress every 100 completed conditions: `{ completed, total: 10000, elapsedMs, routeBlockedCount, conservationFailureCount }`.
- Successful receipt: `{ mode: 'detailed_core_batch', categoryId, completed: 10000, total: 10000, uniqueIdCount: 10000, elapsedMs, seed: 42, durationSec: 600, sceneSnapshot, summary, results }`.
- Summary: `{ routeBlockedCount, routeOpenCount, conservationFailureCount }`.
- Result row: `{ id, index, arrivalCount, completed, active, meanWaitSec, p90WaitSec, routeBlocked, walkDistance, conservation }`. A row's `completed` means customer completions; the receipt's `completed` means completed scenario runs.
- Abort/timeout terminates the worker and rejects the promise. No complete receipt is produced; partial rows are discarded. Progress is an observed partial count, not a completed batch result.

Do not permanently assume execution count is zero once this path runs: display actual requested/completed counts, cancellation/timeout state, partial-result scope and final receipt. “10,000 analytic conditions generated” and “10,000 detailed simulations completed” are separate claims. Actual coffee completion and current-receipt export were verified locally and through the public page; local cancellation/stale-guard checks passed. The other three categories have verified enumeration/visual switching, not full detailed batches.

Observed full-batch timing differs by execution context: one local coffee client worker took 11,849.5 ms; one public-page browser worker took 74,711.6 ms for the same compact population. Neither observation is a general latency guarantee, Cloud server benchmark or model-inference time.

## Locked deterministic reference cases

Use the assertions in `src/engine/rehearsalCore.test.ts`. These are synthetic software references, not real-store measurements. For seed 42, 600 seconds, arrivals 4/min, service 20 seconds, order staff 1 and body width 0.65 m:

- Baseline, pickup staff 1: 53 arrivals, 27 completed, 26 active; walking distance 18.75 m; mean observed wait 104.76 s after the test's two-decimal rounding.
- Proposed layout only, pickup staff 1: 27 completed, 26 active; distance 16.48 m; mean wait 105.63 s.
- Proposed layout plus pickup staff 2: 47 completed, 6 active; mean wait 17.89 s.
- Entrance-blocking display at `(3.0, 7.7)`: `routeBlocked === true`, `meanWaitSec === null`.
- Conservation and final-frame conservation checks must hold. Preserve footprint collision checks and the existing expected values.

The default 27→47 completion comparison changes both layout and pickup staffing; it is not evidence that layout alone adds 20 sales. Use a controlled comparison for such an attribution.

## Honest counts, exports and model boundaries

The frozen improved UI removes the prior hardcoded category survival figures from visible labels and exports. Do not reintroduce them as a completed 1,000/10,000-run population. For each visible population state, distinguish generated conditions, analytic classifications, detailed executions and displayed/selected samples. A selected detailed result does not validate every analytic row.

Export only complete, current scene/settings/result combinations. Clear or invalidate outputs when inputs change, block JSON/TXT/preview while recomputation is pending and include category, seed, calculation revision and actual exploration scope. Do not export previous results under new input labels.

The current product uses synthetic inputs and deterministic code. Category-specific visual models are not new AI inference or evidence of category-level accuracy. Photo obstacles remain manually mapped; addresses remain labels. No new model call, market-data feed, financial calibration or safety certification is established by these changes.

## Upload and concurrent-main safety

`origin/main` advanced separately to `46679971857e5e8df11c85e7ebccf709a3f7a5ca`, including D3 statistics and overlapping changes in main/UI/rendering/style/package files. That work is **not incorporated** into the verified 3D runtime above. Preserve Antigravity's working state and inspect both diffs; selectively integrate needed components rather than hard-resetting to either branch or replacing whole overlapping files.

Keep review PR-only. Freeze the exact improved source, run the agreed build/tests and actual camera/drag/category/explorer/export checks, then update PR #2 and the separate preview service. Deployment archives the committed source, so uncommitted changes are not uploaded merely because they exist locally. Confirm health/source SHA, built assets and actual new category/explorer behavior after deployment before reporting the improvement as live.

Do not include credentials, private images or unrelated workspace files in the upload. Keep the current preview, V1 packet/video, new local working state and latest main distinct until reconciliation is complete. REA 6.5 was a static reference-analysis tool (26 relevant files, 184 nodes, 434 edges), not a new runtime dependency or an execution-equivalence certificate.

## Release evidence and remaining handoff

Frozen runtime: `9930ea224245e307d60c5e09496c50ee6837447d`; preview revision `rehearsal-3d-preview-00002-sjr`. Shared-workspace evidence: `deliverables/rehearsal-3d-industry-verification/actual-10000-receipt.json`, `deliverables/rehearsal-3d-industry-cloud-verification/assets.json` and `receipt.json`, plus `deliverables/rehearsal-demo-v2/video-receipt.json`.

Retain the initial batch harness's raw failed readiness check: it read `__errors` before post-reload initialization. The later ready-state observation resolved that harness classification; do not call the initial raw harness entirely passing or discard its evidence. Final evidence scopes are 16 selected tests, local UI 15/15 plus separate mesh 2/2, and public interaction smoke 9/9.

The core/shared references remain unchanged. Main's concurrent D3 work is still unintegrated; preserve it during selective reconciliation. The remaining organizer steps are authenticated-form details, public video hosting or supported file upload, and actual submission acknowledgement. Submit by 15:20 KST and be seated at the venue by 15:50 KST. Do not describe preparation/deployment as submission acceptance.
