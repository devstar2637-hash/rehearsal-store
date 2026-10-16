# Rehearsal V2 — released 3D and exploration scope

Runtime source: `9930ea224245e307d60c5e09496c50ee6837447d`.

Source branch: https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-3d-preview · Draft PR: https://github.com/devstar2637-hash/rehearsal-store/pull/2. Main remains unmerged.

Preview: https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app · service/revision `rehearsal-3d-preview` / `rehearsal-3d-preview-00002-sjr`, project `h2gdm-hack26icn-2637`, region `asia-northeast3`. Health/main JavaScript/worker correspondence and public interaction smoke 9/9 are confirmed.

## Implemented scope

The world uses Three.js WebGLRenderer, a perspective camera, OrbitControls, procedural room/furniture and raycast picking. Right-drag orbits; wheel/middle drag zooms; left-drag maps a picked movable mesh through an elevation-aware drag plane. Category selection changes actual coffee, bakery, matcha and wine equipment/material geometry, not labels alone.

The explorer generates 10,000 unique condition tuples per category and displays them on a 100 × 100 map. Its default capacity screen is analytic; selecting a row applies the actual settings to two detailed comparison runs. The optional bounded worker runs 10,000 conditions on one proposed-scene snapshot, with progress/cancel and complete current-receipt export. Scene/category changes invalidate worker results.

## Actual verification

- Build/type check and 16 selected tests passed; protected spatial core/shared contracts are unchanged.
- Local UI: 15/15 checks and a separate 2/2 final mesh recheck passed, including four distinct geometry/material signatures/captures, candidate application, cancellation/stale guards, 1440/390 px fit and observed errors.
- One actual local coffee batch completed 10,000 unique cases in 11,849.5 ms, with 2,500 blocked, 7,500 open and zero conservation failures.
- Five main-thread recomputations using the same core agreed with checked compact worker fields; actual downloaded JSON matched. This is shared-core correspondence, not a separate real-world oracle.
- Public release source/main/worker identity and public interaction smoke 9/9 passed. One actual public-page coffee client-worker batch completed 10,000 unique rows in 74,711.6 ms; all compact rows matched the verified local population and its 2,928,628-byte JSON matched the receipt. This is client-side execution, not Cloud server or inference timing.

Shared-workspace receipts include `deliverables/rehearsal-3d-industry-verification/actual-10000-receipt.json` and `deliverables/rehearsal-3d-industry-cloud-verification/assets.json`. Timings are observed local conditions, not universal performance guarantees; the run does not establish full execution for all four categories or 20,000 paired cases.

## Boundaries and reference evidence

The deterministic core retains synthetic arrivals/service requirements, A* footprint checks and FIFO stations. No new AI inference, image understanding, live market feed, profit/survival model, financial calibration or safety certification is added. Room materials, lighting/AC and ASCII remain presentation.

REA 6.5.0 analyzed House Control's inert JavaScript across 26 relevant files, yielding 184 graph nodes and 434 edges. It did not execute that app, prove equivalence or become a runtime dependency. Category furniture/room models are newly written procedural geometry without copied reference source/assets.

## Release and integration

The current V2 English packet and `rehearsal-v2-3d-four-concepts-walkthrough-en.mp4` replace the prior 2.5D materials for this branch. The actual recording is 114.069987 seconds, English narrated/captioned and composed from seven local screen captures; public video hosting and actual submission remain incomplete.

Concurrent `origin/main` commit `46679971857e5e8df11c85e7ebccf709a3f7a5ca` contains separate D3/statistics work not incorporated here. Preserve Antigravity's uncommitted changes and selectively reconcile overlaps; do not hard-reset that work. Review PR #2 and retain the separate preview service. Exact contracts and Korean handoff prompt are in [AGENT_HANDOFF_3D.md](AGENT_HANDOFF_3D.md).
