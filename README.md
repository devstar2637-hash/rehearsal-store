# Rehearsal — WebGL 3D Preview (V2)

**Rehearse a store layout in a real 3D room before changing the physical space.**

This preview adds a Three.js WebGL scene to Rehearsal's deterministic spatial/queue simulator. A larger room studio contains procedural furniture and animated customer representations, with a compact baseline view for comparison. Orbit the camera, inspect a mesh and move furniture while retaining the existing synthetic operating assumptions.

Preview: https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app

Branch: `codex/rehearsal-3d-preview`. Runtime source: `2637d93fea7245b9a662809107ee2ad1b3e2382d`. Draft review: https://github.com/devstar2637-hash/rehearsal-store/pull/2. The previous V1 submission packet and 2.5D video describe V1 until the new preview is reviewed.

## Run locally

Use Node.js 22 and npm. Select the preview branch after preserving any uncommitted Antigravity work.

```bash
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run dev
```

Open the Vite URL printed in the terminal (configured default port 3000). To build or preview production assets:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

The production host uses `npm run start:cloud`, Node.js 22, the Vite `dist/` build and the platform's `PORT`. This preview is deployed to the separate `rehearsal-3d-preview` Cloud Run service in project `h2gdm-hack26icn-2637`, region `asia-northeast3`, revision `rehearsal-3d-preview-00001-dmq`. Public health identifies the runtime source above; deployed and checked local JavaScript bytes match. The deployment script requires `GCP_PROJECT` and accepts `GCP_SERVICE`; select the preview service explicitly because its default names the prior service.

## Interact with the room

- **Right-drag:** orbit the perspective camera.
- **Mouse wheel / middle-drag:** zoom within the configured camera limits.
- **Left-click a movable furniture mesh, then drag:** select and reposition it on its elevation-aware drag plane through the existing placement flow.
- **Two-finger gesture:** camera dolly/rotation where supported by the browser/device.
- Choose category/design templates and change staffing, arrivals, service time or passage width to recalculate the short operating scenario.
- Inspect mean/P90 waits, completions, walking distance and blocked-route status; use playback or walk mode to inspect the modeled journey.
- Preview an image, manually mark and confirm a rectangle, then add its obstacle to the assumed room geometry.
- Export JSON to preserve baseline/proposal scenes, settings, calculated results, seed and revision.

The camera, furniture meshes, shadows and room materials are actual WebGL rendering. Their appearance does not add physical simulation fidelity. Lighting/AC presentation remains visual rather than a validated illumination, airflow or thermal model.

## Architecture and scope

- `index.html` and `src/main.ts`: studio entry, state, controls, paired simulation and export.
- `src/engine/threeRenderer.ts`: Three.js scene, perspective camera, OrbitControls, procedural room/furniture, raycast picking and drag-plane mapping.
- `src/engine/rehearsalCore.ts`: existing deterministic geometry, A* routes, seeded arrivals and FIFO order/pickup queues.
- `src/engine/canvasRenderer.ts`: retained Canvas utilities such as the sample blueprint helper; not proof that the new world scene is a 2D projection.
- `src/ui/asciiBackground.ts`: independent decorative background.
- `infra/staticServer.mjs`: production static host.

The spatial/queue core remains the calculation authority. It uses a 0.1 m grid, synthetic seeded arrival/service requirements, fixed service stations and a 600-second operating window. The rendering upgrade does not establish improved prediction, financial calibration or real-world queue accuracy.

Category setup costs, preset-count labels and survival badges are fixed demonstration examples. Addresses are scenario labels. Photos support manual mapping, not automatic AI reconstruction or measured dimensional extraction. The active studio has no model API call or live address-level data integration. These boundaries remain unchanged in V2.

## Verification

```bash
npm test
npm run lint
npm run build
```

For runtime source `2637d93f`, build, type check and the selected 13 tests pass. Actual-browser checks observe WebGL2 rendering, right-drag orbit and wheel zoom without changing simulation data, native mesh drag moving an object and updating its revision, seed-42 reference outputs, pending-export blocking and JSON correspondence. Desktop 1440 px and mobile 390 px layouts show no horizontal overflow. Public health and JavaScript byte correspondence are confirmed; the separate public-browser smoke result is recorded in the preview scope document. No performance gain, new accuracy result or runtime-AI usage is claimed.

See [3D preview scope and acceptance checks](docs/THREE_PREVIEW.md).

## V1 submission materials — prior 2.5D product

The following remain V1 documents and have not been rewritten as V2 claims:

- [V1 project description](docs/SUBMISSION_DESCRIPTION_EN.md)
- [V1 form answers](docs/SUBMISSION_FORM_FIELDS_EN.md)
- [V1 demo plan](docs/DEMO_SCRIPT_EN.md)
- [V1 judges' answers](docs/JUDGES_QA_EN.md)
- [V1 checklist](docs/SUBMISSION_CHECKLIST_EN.md)

V1 source: https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-cloud-submission · V1 review: https://github.com/devstar2637-hash/rehearsal-store/pull/1. Main remains unmerged. The existing `rehearsal-captured-screen-walkthrough-en.mp4` is the 113.457-second 2.5D V1 recording, not a recording of this 3D preview.

## Reference analysis and rights

[House Control](https://github.com/0xProbabillity/house-control) informed architecture and presentation. The preview's room/furniture models are procedural implementations; reference source and assets were not copied. REA 6.5.0 successfully analyzed the reference's static JavaScript: 26 relevant files, 184 graph nodes and 434 edges. This analysis did not execute the reference app and proves no runtime equivalence. REA is an analysis tool, not a dependency or service in Rehearsal's runtime.

Other visual references: [Gradient ASCII](https://reactbits.dev/backgrounds/gradient-ascii) and [Lucian UI prompting](https://lucianlabs.dev/uxui-prompt/). The decorative ASCII field is independently authored. No third-party code-reuse or license entitlement is inferred from these acknowledgements. No new project code license is assigned; retain applicable dependency notices, including Three.js.
