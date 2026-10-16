# PR #1: Polish Rehearsal studio and deploy it on Cloud Run

Original: https://github.com/devstar2637-hash/rehearsal-store/pull/1
Author: devstar2637-hash
State: open
Head: codex/rehearsal-cloud-submission (e840435af7598d0cdde8412b4acc30978497b65f)
Base: main (5e9aa1f3f87fbdbbd7927fb78047337fcb1f2680)

Rehearsal now has a clearer spatial workspace and a production host for Google Cloud Run. Layout and staffing comparisons keep the existing deterministic simulation; saving during recalculation can no longer combine new settings with old results.

- Refine the header, floating controls, selected states, result typography and mobile layout. Add an original decorative ASCII background with reduced-motion and page-visibility handling.
- Label fixed demonstration counts and defer resize drawing instead of suppressing ResizeObserver errors.
- Serve built Vite assets with a small Node.js 22 host, explicit project deployment and source metadata. The unused sample financial API is not part of the deployed runtime.
- Add English submission copy, a demo script and the organizer's 15:20 submission / 15:50 seating checklist.

Validation: Vite build and TypeScript checking pass. All 13 selected tests pass. Independent browser checks cover paired canvases, layout/staff changes, matching JSON exports, pending-export blocking, reduced motion and 1440px/390px layouts without horizontal overflow or observed JavaScript/ResizeObserver errors.

Cloud demo: https://thousand-stores-299086406033.asia-northeast3.run.app

The spatial core, shared contract, original reference tests and public fixtures are unchanged. Inputs are synthetic; fixed count badges are illustrative. No runtime Gemini call or validated business-survival forecast is claimed.


This is an archival record, not a new review or a recommendation to merge the historical branch.
