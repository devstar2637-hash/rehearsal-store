# Rehearsal V2 — Three.js preview scope

Branch: `codex/rehearsal-3d-preview`.

Runtime source: `2637d93fea7245b9a662809107ee2ad1b3e2382d`. Build, type checks and the selected 13 tests passed for this runtime source. Preview: https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app . Cloud Run revision: `rehearsal-3d-preview-00001-dmq` in `h2gdm-hack26icn-2637` / `asia-northeast3`. Public health matches that source and the deployed JavaScript bytes match the local checked build. V1 remains the prior 2.5D submission product; its documents and 113.457-second recording have not become V2 evidence.

## New presentation and interaction

The active world renderer is `src/engine/threeRenderer.ts`, imported by `src/main.ts`. It creates a Three.js WebGLRenderer, perspective camera, OrbitControls, lit procedural room/furniture meshes and raycast picking. A larger main room studio and compact comparison view replace the earlier paired 2D world presentation.

- Right-drag orbits the camera; wheel/middle-drag zooms within limits.
- Left-click selects a movable mesh; left-drag maps pointer position through the perspective camera onto an elevation-aware plane for the existing placement flow.
- Procedural furniture and customer representations visualize the existing scenario state.
- Manual image-region marking and exports remain available through the existing studio controls.

These are rendering and interaction changes. Physical realism, model accuracy, throughput and commercial survival performance have not been newly validated.

## Calculation authority and unchanged boundaries

`src/engine/rehearsalCore.ts` remains the deterministic spatial/queue core: A* paths, footprint constraints, seeded arrivals/service requirements, FIFO station queues and a short operating window. The renderer reads its scenes/results; changing camera angle or materials must not change those calculations.

Fixed category survival counts and preset labels remain illustrative. Address input remains a label, image obstacles are manually mapped, and lighting/AC presentation is visual. There is no new AI inference, photo understanding, live market feed, financial calibration or safety certification in this preview.

## REA reference evidence

The reference analysis completed successfully with REA **6.5.0**, covering **26 relevant files** and producing **184 graph nodes / 434 edges** for House Control's static JavaScript. The shared-workspace receipt is `.tools/rea-reference/evidence/rea-reference-receipt.json` (outside the application runtime).

The analysis parsed inert text; it did not execute the reference application. Incomplete/static graph coverage does not establish runtime behavior or equivalence. REA has not been added as an application dependency, runtime service or required user configuration. House Control is an architecture reference; the preview uses newly written procedural room/furniture models without copied reference source or assets.

## Verification and review

- Runtime source frozen as above. The original core, shared contracts and core reference tests have an empty diff from the user's uploaded main.
- Build, type check and the selected 13 tests passed for this preview.
- Two actual WebGL2 contexts rendered the rooms. Native right-drag and wheel changed screenshots while the complete simulation packet/revision stayed unchanged.
- Native left-drag moved the display from `(7.6,7.6)` to `(6.7,7.6)` and revision 1 to 2, with complete recalculation.
- Seed-42 baseline/proposal completions were 27/47. Pending exports were blocked and completed JSON matched the current scenario.
- Desktop 1440 px and mobile 390 px had no horizontal overflow or observed app/JavaScript errors.
- Public health, exact runtime source and JavaScript byte identity are confirmed. Separate public-browser smoke passed 8/8: source, WebGL rendering, reference outputs, orbit, wheel, mobile layout, observed errors and request scope.
- User visual review is still pending. Review V2 before revising the V1 submission packet or replacing its recording.

Shared-workspace evidence: `deliverables/rehearsal-3d-verification/` and `deliverables/rehearsal-3d-cloud-verification/` (outside this repository). The initial local harness used a 756 px viewport with 1440 px gesture coordinates; retain those failed checks alongside the corrected 1440 px mesh recheck rather than treating them as application defects. Test results are observed implementation checks, not real-world operating performance.

## Separate-service plan

The deployed preview uses the explicit separate service `rehearsal-3d-preview`; the prior service and packet were not replaced. Keep selecting the approved project and this service using `GCP_SERVICE` for future preview deployments. Draft PR #2 targets the prior submission branch for focused review; main remains unmerged.
