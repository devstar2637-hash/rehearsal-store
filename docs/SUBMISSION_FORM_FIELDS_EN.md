# Rehearsal — copy-ready submission fields

Prepared for 16 October 2026, KST. These headings organize reusable answers; they are not a transcription of the authenticated submission form. Confirm exact fields, limits, track and member information there.

## Project name

Rehearsal

## One-line summary

Rehearse store layouts before changing the real space.

## Problem

Small store teams must choose furniture placement, staffing and operating assumptions before observing a real queue. A static floorplan alone makes it difficult to discuss how a customer moves from entrance to ordering, pickup and exit.

## Solution

Rehearsal puts a baseline and a proposal side by side in an editable 2.5D studio. A deterministic short-window simulation turns layout and staffing assumptions into inspectable paths, waits and completed journeys. Teams export the scenario to discuss which assumption to measure next.

## Implemented features

- Paired 12 m × 9 m layouts, draggable furniture and three design templates.
- Four category templates with preset operating assumptions and fixed setup costs.
- Editable arrivals, service time, pickup staffing and passage width.
- Seeded A* routing and FIFO queues over a 600-second operating window.
- Mean/P90 wait, completions, walking distance and blocked-route feedback.
- Timeline playback, walk mode, local image preview and manually marked obstacles.
- JSON scenario export and a text crew-plan summary.
- Responsive floating controls with independent ambient ASCII decoration, capped at eight frames per second and static for reduced-motion preferences.

## Build process

Developed in Antigravity, Rehearsal separates its TypeScript spatial/queue core from Canvas rendering. Seeded arrivals and per-customer service requirements make layout/staffing comparisons reproducible under stated assumptions. Responsive floating controls and an independently authored Canvas ASCII background improve the presentation while preserving the core and its reference fixtures. The Vite production build is served by a Node.js 22 static host for Cloud Run; verification covers the selected automated tests and actual local browser interactions, with public deployment checks recorded separately.

Development tool: **Antigravity**. Development model identifier: **not verified; do not infer it from package dependencies**.

## Limitations

Inputs are synthetic and geometry is assumed. Category setup costs, scenario-count labels and survival badges are fixed demonstration content, not financial forecasts or outputs from a completed 1,000-case evaluation. Addresses are labels, photos require manual marking, and lighting/AC controls are visual. The active studio has no live model call or live market-data integration. Observation controls adjust parameters heuristically; independent calibration and safety certification have not been established.

## Technology stack

TypeScript, browser Canvas 2D with isometric projection, Vite, Tailwind tooling, npm and Node.js 22 for the production static server. The current studio uses plain TypeScript. It is deployed on Cloud Run, with nine bounded independent public HTTPS checks passed.

## Source repository

https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-cloud-submission

Preparation branch: `codex/rehearsal-cloud-submission`.

Review link: https://github.com/devstar2637-hash/rehearsal-store/pull/1 (draft; main remains unmerged).

Antigravity handoff: preserve any uncommitted work before switching to the preparation branch, then inspect this PR. Merging into main is a separate decision.

Runtime source: `4776c749a9703bd7fe07fd59a464e7a34d16b691`. Build/type check and 13 selected tests passed. Independent local UI verification passed eight functional checks and a three-check mobile recheck. Public Cloud verification passed nine bounded checks, including source/JavaScript correspondence, actual calculations, 390/1440 px fit, pending-export blocking and matching 226,136-byte JSON. Local manual image-region selection/confirmation was demonstrated with a matching 238,878-byte JSON export. The core/shared/reference fixtures remain unchanged from `5e9aa1f`.

## Cloud Run demo URL

https://thousand-stores-299086406033.asia-northeast3.run.app

Deployed runtime `4776c749a9703bd7fe07fd59a464e7a34d16b691`, Cloud revision `thousand-stores-00004-4rd`, ready with 100% traffic. Nine independent public HTTPS/browser checks passed within the recorded smoke scope. This is not financial calibration or a real-world performance study.

## Demo video URL

**PUBLIC URL NOT CREATED — if the form requires a hosted video URL, arrange approved hosting and verify viewer access; otherwise use its supported file-upload route.**

Completed file: `rehearsal-captured-screen-walkthrough-en.mp4`, 113.457 seconds, H.264 1920 × 1200 / AAC 48 kHz, English narration and captions. It shows seven actual local captured-screen states of runtime `4776c749a9703bd7fe07fd59a464e7a34d16b691`; it is a montage, not uninterrupted live video. The private Library copy is saved. The 90-second script was an internal planning target; the organizer's official duration limit is unconfirmed.

## Google AI usage declaration, if requested

Product runtime model calls: **none in this version**. Development workspace: **Antigravity**; its exact development model identifier is not verified. If the form requests Google AI details, state this distinction accurately. Template selection, manual image marking and dependency installation are not live Gemini execution. No runtime-AI requirement is inferred here from the presence of this declaration field.

## Organizer fields still to confirm

- Authenticated form URL, exact field names and limits.
- Track and track-specific declarations.
- Team/member details, submission permissions and consent.
- Video hosting/access rules and actual duration limit.
- Required source revision or evidence attachments.

Working deadline supplied for the event: **16 October 2026, 15:20 KST**. English content and Google Cloud deployment are required. Submission acceptance needs a receipt from the actual form.
