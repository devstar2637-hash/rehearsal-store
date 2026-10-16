# Rehearsal

**Rehearse store layouts before changing the real space.**

Rehearsal is a browser-based 2.5D operational studio for prospective store owners and small teams. Put a baseline beside a proposal, move furniture, change staffing or demand, and inspect synthetic customer journeys, waits and completions. Export the scene and calculations to make the next team discussion concrete.

Developed in Antigravity, the studio starts at `index.html` and `src/main.ts`. Its TypeScript spatial/queue core is separated from the Canvas renderer.

## Run locally

Use Node.js 22 and npm. No model API key is needed for the spatial simulator.

```bash
git clone --branch codex/rehearsal-cloud-submission https://github.com/devstar2637-hash/rehearsal-store.git
cd rehearsal-store
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run dev
```

Open the Vite URL printed in the terminal; the configured default is `http://localhost:3000`. To build and preview production assets:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Submission packaging uses `npm run start:cloud` to serve the Vite `dist/` build with Node.js 22 and the platform's `PORT`.

Current runtime source: `4776c749a9703bd7fe07fd59a464e7a34d16b691`. Cloud Run revision `thousand-stores-00004-4rd` is ready with 100% traffic. [Open the deployed studio](https://thousand-stores-299086406033.asia-northeast3.run.app).

Independent public HTTPS verification passed nine bounded checks: product/source identity, matching JavaScript bytes, actual default calculations and canvases, desktop/mobile fit, pending-export blocking, recalculated JSON correspondence and absence of application errors. This verifies the demonstrated workflow, not financial or field accuracy.

For an authorized redeployment to the same approved project:

```bash
GCP_PROJECT=h2gdm-hack26icn-2637 bash infra/deploy.sh
```

The root Dockerfile builds with Node.js 22 and copies only production assets and the static host into the runtime image. Keep credentials outside the source tree.

## Try the actual workflow

1. Select a category template and design concept. The budget slider compares your entered budget with the template's fixed setup cost.
2. Compare the baseline and proposed 12 m × 9 m spaces. Drag a display or table in the proposal.
3. Open settings to change arrivals, service time, pickup staffing or passage width. The app recalculates a 600-second scenario.
4. Read mean/P90 waits, completed customers, walking distance and blocked routes. Scrub the timeline or use walk mode.
5. Optionally preview an image, manually mark a rectangle and confirm it before adding an obstacle. Its coordinates map to the assumed scene dimensions.
6. Export JSON to preserve both scenes, settings, calculated results, seed and revision. The text crew plan is a discussion summary; its fixed template survival counts are illustrative, not simulation evidence.

The studio uses compact floating controls, responsive spacing and typography. An original decorative Canvas ASCII field runs at at most eight frames per second, pauses while the document is hidden and stays static when reduced motion is requested. It is independent of the spatial calculations.

## What is calculated

- A* routes on a 0.1 m grid, with body-width footprint checks and no diagonal corner cutting.
- Seeded exponential arrival gaps, per-customer synthetic service requirements and FIFO order/pickup queues.
- The same seeded arrivals and customer requirements for the baseline and proposal, so layout/staffing assumptions can be compared.
- Route reachability, mean/P90 observed waits, completions and customer-conservation checks.

The model assumes fixed 1.15 m/s walking speed, fixed service stations and a short operating window. Some customers remain when the window ends. A footprint check is not accessibility, safety or building-code certification. Default layouts can also differ in staffing; isolate inputs before attributing a change to furniture alone.

## Interpretation boundaries

Category setup costs, scenario-count labels and the “1,000 / survived” badge are fixed demonstration content. They establish neither survival probabilities nor a completed 1,000-case evaluation. Addresses are scenario labels. Observation controls make heuristic parameter adjustments; entering observations does not prove independent calibration.

Images support local preview and manual marking. Lighting and AC controls change the rendering. The active studio does not execute a model API, analyze photos automatically, retrieve address-level market data or simulate physical airflow. If requested by the submission form, declare product runtime model usage as none; the development model identifier has not been verified. Image handling uses browser objects; the page separately requests Google Fonts stylesheets.

## Checks

```bash
npm test
npm run lint
npm run build
```

At current runtime source `4776c749a9703bd7fe07fd59a464e7a34d16b691`, build, type checking and all 13 selected tests passed. Independent local UI verification passed eight functional checks and a three-check mobile recheck after a caption-overflow correction. The tested document/body widths fit 390 px and 1440 px viewports. Layout/staff changes, a 225,585-byte JSON export matching the current packet, pending-export blocking, reduced-motion static behavior and absence of ResizeObserver errors were verified within that scope. The spatial core, shared contracts, existing core tests and public fixtures are unchanged from source `5e9aa1f`.

`npm test` covers five formatting, three spatial-core and five static-host tests. Public Cloud verification passed nine bounded checks; the changed-staff case exported 226,136 bytes matching the current complete packet. The local recording also demonstrated manual image-region selection/confirmation and a matching 238,878-byte JSON export. These are different test inputs and file sizes, not throughput benchmarks. No model/API/POST call occurred in the public smoke check. The built public client had zero matches in the selective secret-pattern scan; this is not a guarantee about every possible secret. These checks do not establish field accuracy or financial validation.

## Source map

- `src/main.ts`: studio state, paired calculation, controls, manual image marking and export.
- `src/engine/rehearsalCore.ts`: validation, geometry, A* routing and deterministic event simulation.
- `src/engine/canvasRenderer.ts`: isometric drawing, people and visual controls.
- `src/ui/asciiBackground.ts`: independent decorative Canvas ASCII field and motion/visibility handling.
- `styles.css`: presentation.
- `infra/staticServer.mjs`: production static host for the Vite build and deployment health metadata.

## Submission packet

- [Project description](docs/SUBMISSION_DESCRIPTION_EN.md)
- [Copy-ready field answers](docs/SUBMISSION_FORM_FIELDS_EN.md)
- [90-second demo script](docs/DEMO_SCRIPT_EN.md)
- [Judges' questions](docs/JUDGES_QA_EN.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST_EN.md)

Submission source: [codex/rehearsal-cloud-submission](https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-cloud-submission). Review: [draft PR #1](https://github.com/devstar2637-hash/rehearsal-store/pull/1). Runtime source: `4776c749a9703bd7fe07fd59a464e7a34d16b691`.

In Antigravity, preserve current uncommitted work before switching branches, then review the submission branch/PR. Record the exact submitted/deployed commit. Main remains unmerged; merging is a separate decision.

Recorded walkthrough: `rehearsal-captured-screen-walkthrough-en.mp4`, **113.457 seconds**, H.264 1920 × 1200 with AAC 48 kHz audio, English narration and captions. It is a seven-state montage of actual local screens, not uninterrupted live video. The private Library copy was saved; a public video-hosting URL has not been created. The 90-second planning script is an internal target, not an official duration rule.

## Rights and next steps

No project code license was declared in the inspected source. Public visibility is not itself a license; retain third-party dependency/font notices. The spatial simulation uses synthetic inputs.

Next steps are to replace fixed performance-looking badges with traceable outputs, compare modeled queues with real measurements, and evaluate bounded model-assisted proposals using the same deterministic checks. These are future work, not completed features.

Visual references: [House Control](https://github.com/0xProbabillity/house-control), [Gradient ASCII](https://reactbits.dev/backgrounds/gradient-ascii) and [Lucian UI prompting](https://lucianlabs.dev/uxui-prompt/). These informed presentation direction. The Canvas ASCII field is independently authored; this acknowledgement makes no claim to third-party code reuse or its licensing.
