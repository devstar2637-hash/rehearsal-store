# Rehearsal — 3D Store and 10,000-Condition Studio

**Rehearse a store layout before changing the physical space.**

Rehearsal combines a real Three.js WebGL room with a deterministic spatial/queue simulator. Coffee, bakery, matcha and wine have distinct procedural interiors. Orbit the room, drag furniture, compare staffing assumptions and open a map of 10,000 actual condition combinations. An optional worker executes the full detailed batch for the current proposed scene and exports its receipt.

- [Live 3D studio](https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app)
- [Submission source branch](https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-3d-preview)
- [Draft review PR #2](https://github.com/devstar2637-hash/rehearsal-store/pull/2)
- Runtime source: `9930ea224245e307d60c5e09496c50ee6837447d`
- Cloud Run revision: `rehearsal-3d-preview-00002-sjr`, separate preview service in `h2gdm-hack26icn-2637` / `asia-northeast3`.

Cloud health identifies this source, and deployed main JavaScript and worker bytes match the checked local build. Independent public interaction smoke passed 9/9; local UI and full-batch evidence are detailed below.

## Run locally

Use Node.js 22 and preserve any existing uncommitted Antigravity work before switching branches.

```bash
git clone --branch codex/rehearsal-3d-preview https://github.com/devstar2637-hash/rehearsal-store.git
cd rehearsal-store
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run dev
```

Open the Vite URL printed in the terminal (default port 3000).

```bash
npm test
npm run lint
npm run build
npm run preview -- --host 0.0.0.0
```

`npm run start:cloud` serves the Vite `dist/` build through a Node.js 22 static host using `PORT`. An authorized update to the separate preview service uses:

```bash
GCP_PROJECT=h2gdm-hack26icn-2637 GCP_SERVICE=rehearsal-3d-preview bash infra/deploy.sh
```

Deployment archives the committed source; local uncommitted edits are not automatically included. Main remains unmerged, and PR review/merge is a separate decision.

## Try the studio

1. Select coffee, bakery, matcha or wine. Inspect the distinct equipment, furniture and materials.
2. Right-drag to orbit; use the wheel/middle drag to zoom. Left-click and drag a movable furniture mesh to change the proposed layout. Camera changes leave the simulation unchanged.
3. Change staffing, arrivals, service time or passage width. Read the actual 600-second synthetic comparison, including blocked-route/null-wait states.
4. Open the explorer: its 100 × 100 map represents 10,000 unique condition tuples for the selected category. Color indicates arrival intensity, not success or survival.
5. Select and apply a row for a detailed baseline/proposal comparison. This is two core runs, not a completed population batch.
6. Optionally start the full detailed batch. The worker runs 10,000 conditions on one snapshot of the current proposed scene, with progress and cancellation. Completed, current-scene receipts can be downloaded as `rehearsal-10000-detailed-results.json`.
7. A local image may be previewed and manually marked/confirmed to add an obstacle. Ordinary JSON preserves scenes, settings, seed, results and calculation revision.

Coffee has espresso equipment; bakery has an oven and bread rack; matcha has tea equipment and noren panels; wine has a bottle library and bar seating. Models are procedural, not copied reference assets or AI-reconstructed floorplans.

## What 10,000 means

The fast screen enumerates 10 arrival settings × 10 service settings × 5 order-staff settings × 5 pickup-staff settings × 4 body widths. All four categories have 10,000 unique IDs and parameter tuples each. Initial analytic classifications use expected station capacity; they do not calculate geometry, waiting, profit or survival. Width affects the detailed spatial model, not the analytic classification.

The optional batch runs the existing core for every condition on **one proposed scene**, not both scenes or all four categories. Cancellation or timeout terminates work without a complete receipt; intermediate progress is not a successful final population. Changing the scene/category invalidates the receipt and prevents stale export.

## Verification at source 9930ea2

- Build, type check and 16 selected tests passed. Protected spatial core/shared contracts retain an empty diff from the reviewed source.
- Independent local UI checks passed 15/15, with a separate final mesh recheck passing 2/2, covering four distinct category geometries/material signatures and captures, native candidate application, selected two-run comparison, cancel/stale guards and 1440/390 px fit without observed application errors.
- One actual local coffee batch completed 10,000 unique conditions in **11,849.5 ms**: 2,500 route-blocked, 7,500 route-open and zero conservation failures. This is one observed browser/scene run, not a general latency guarantee or results for every category.
- Five main-thread recomputations using the same core matched all checked compact worker-result fields. This checks worker correspondence, not an independent real-world oracle. The actual downloaded JSON matched the completed receipt.
- Public health/source and main/worker byte correspondence are confirmed. Public interaction smoke passed 9/9, including four-category WebGL/10,000-condition views and one actual coffee worker completion. In that client-browser observation after public deployment, 10,000 rows completed in 74,711.6 ms and all compact rows matched the verified local population; its 2,928,628-byte JSON matched the receipt. This is client-side computation, not Cloud server or model latency.

The core uses 0.1 m A* routing, synthetic seeded arrivals/service requirements, fixed service stations and a 600-second window. Wider footprint checks are not safety/accessibility certification. The default layout-plus-staff comparison changes two causes; isolate inputs before attributing its difference to layout alone.

## Boundaries

The UI no longer presents the prior fixed survival figures as results. Current explorer counts are traceable generated/analytic/detailed counts, not real business probabilities. Setup costs are template assumptions; addresses are labels; photo obstacles are manually mapped. Lighting/AC and ambient ASCII are visual. This version adds no runtime model call, market-data feed, profit forecast or real-world calibration. Antigravity was the development workspace; no exact development model ID is inferred.

## Source map and handoff

- `src/main.ts`, `styles.css`: studio UI, state, category/explorer wiring and guarded export.
- `src/engine/threeRenderer.ts`: WebGL room, category models, camera, raycast picking and drag-plane mapping.
- `src/engine/rehearsalCore.ts`: deterministic spatial/queue authority.
- `src/engine/scenarioExplorer.ts` and `.worker.ts`: condition grid, analytic screen and bounded detailed batch.
- `src/ui/asciiBackground.ts`: independent decoration, at most eight frames/second, hidden/reduced-motion handling.
- `infra/staticServer.mjs`: production static host and health/source metadata.

[Agent handoff and exact APIs](docs/AGENT_HANDOFF_3D.md) · [3D scope](docs/THREE_PREVIEW.md). Concurrent main `4667997` D3 work is not incorporated; preserve it and integrate overlapping changes selectively rather than hard-resetting an Antigravity workspace.

## Submission materials

[Description](docs/SUBMISSION_DESCRIPTION_EN.md) · [Form answers](docs/SUBMISSION_FORM_FIELDS_EN.md) · [Demo](docs/DEMO_SCRIPT_EN.md) · [Judges Q&A](docs/JUDGES_QA_EN.md) · [Checklist](docs/SUBMISSION_CHECKLIST_EN.md).

Current recording: `rehearsal-v2-3d-four-concepts-walkthrough-en.mp4`, **114.069987 seconds**, H.264 1920 × 1200 / AAC 48 kHz with English narration and captions. It is a seven-state montage of actual local V2 screens and supersedes the prior 2.5D recording for this packet. It does not depict an uninterrupted live session or a Cloud capture. Public video hosting has not been created; follow the actual form's link/file requirements. Five sentences and the 90-second planning script are internal formats, not verified official constraints.

**Submit by 15:20 KST; be seated at the venue by 15:50 KST.** Form-field confirmation and actual submission acknowledgement remain incomplete.

## Reference analysis and rights

[House Control](https://github.com/0xProbabillity/house-control) informed architecture/presentation; reference source and assets were not copied. REA 6.5.0 performed static reference analysis across 26 relevant files, yielding 184 graph nodes and 434 edges. It did not execute the reference and is not an application runtime dependency. Other visual references: [Gradient ASCII](https://reactbits.dev/backgrounds/gradient-ascii) and [Lucian UI prompting](https://lucianlabs.dev/uxui-prompt/); ASCII is independently authored. No new project license is assigned; retain applicable dependency notices, including Three.js.
