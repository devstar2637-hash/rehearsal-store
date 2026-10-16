# PR #2: Explore 10000 operating conditions in four 3D store concepts

Original: https://github.com/devstar2637-hash/rehearsal-store/pull/2
Author: devstar2637-hash
State: open
Head: codex/rehearsal-3d-preview (cac02f760e0135815104ddce2d2bf92872571827)
Base: codex/rehearsal-cloud-submission (e840435af7598d0cdde8412b4acc30978497b65f)

The prior preview reused the same cafe furniture across industries and displayed fixed scenario examples. This update gives coffee, bakery, matcha and wine their own procedural 3D geometry, materials and lighting, and makes the 10,000-condition explorer prominent in the studio.

Each industry enumerates 10 × 10 × 5 × 5 × 4 unique operating conditions. A selectable 100×100 map opens the existing detailed baseline/proposal comparison. An optional bounded Web Worker executes all 10,000 conditions against one snapshot of the proposed layout, with progress, cancellation and a complete-results JSON download. Generated conditions, analytic load screening and actual completed calculations are kept separate. Layout/category changes invalidate old batch results.

Preview: https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app

Runtime source: `9930ea224245e307d60c5e09496c50ee6837447d`. Cloud revision: `rehearsal-3d-preview-00002-sjr`, project `h2gdm-hack26icn-2637`, region `asia-northeast3`.

Validation: build, type check and 16 selected tests passed. Actual-browser industry checks passed 15/15, final mesh checks 2/2 and public deployment checks 9/9. Four industries have distinct actual geometry/material render evidence. A real coffee batch completed 10,000 unique results with 2,500 blocked routes, 7,500 open routes and zero conservation failures; five predetermined cases matched separate main-thread core reruns. The public browser's entire result population matched the verified local population, and the actual downloaded JSON matched its receipt. Desktop/mobile overflow and observed app errors were zero. These are bounded synthetic implementation checks, not real-world business outcomes or a speed guarantee.

The original calculation core, shared contracts and reference fixtures are unchanged. The footer now reports current waiting/completed-customer deltas instead of fixed sales text. The agent handoff documents exact APIs, evidence and integration boundaries.

This draft targets the prior submission branch. Concurrent Antigravity main `4667997` D3 work is not incorporated and must be selectively reconciled; main is not merged. The current V2 English walkthrough and submission documents supersede the earlier 2.5D presentation. No runtime model/API, market-data or business-survival claim is added.


This is an archival record, not a new review or a recommendation to merge the historical branch.
