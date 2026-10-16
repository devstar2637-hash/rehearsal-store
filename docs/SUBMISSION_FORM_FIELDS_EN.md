# Rehearsal — copy-ready V2 submission fields

Prepared for 16 October 2026, KST. These are reusable answers, not a transcription of the authenticated organizer form. Confirm actual fields, text limits, track and team details there.

## Project name

Rehearsal

## One-line summary

Rehearse a 3D store and explore 10,000 operating conditions before changing the real space.

## Problem

A small store team must choose layout and staffing before observing a real queue. A static floorplan makes it difficult to inspect how assumptions affect the journey from entrance through ordering and pickup to exit.

## Solution

Rehearsal combines an editable WebGL room with a deterministic spatial/queue model. Four distinct procedural interiors make category selection concrete, while a 10,000-condition map, selected paired comparison and optional detailed batch expose the difference between assumptions, screening and executed calculations.

## Implemented features

- Three.js perspective rooms with right-drag orbit, zoom, raycast selection and left-drag furniture placement.
- Distinct coffee equipment, bakery oven/bread rack, matcha tea/noren setting and wine bottle/bar setting.
- Four per-category grids of 10,000 unique condition tuples, with a 100 × 100 map and explicit analytic labels.
- Selected-condition application to two detailed baseline/proposal core runs.
- Optional Web Worker detailed batch: one proposed-scene snapshot × 10,000 conditions, progress, cancellation and current-receipt JSON download.
- Editable arrivals, service, staffing and passage width; synthetic 600-second waits, completions and blocked-route feedback.
- Manual floorplan-image marking, timeline/walk inspection and scene/settings/result export.

## Build process and stack

Developed in Antigravity. TypeScript deterministic geometry/queue code is separated from Three.js WebGL rendering and the worker batch. Vite bundles the browser application and worker; a Node.js 22 static host serves it on Cloud Run. REA was used for static House Control reference analysis, not as a runtime dependency. Exact development model identifier is not verified.

## Verification

Runtime `9930ea224245e307d60c5e09496c50ee6837447d`: build, type check and 16 tests passed; local UI verification passed 15/15, with a separate final mesh recheck passing 2/2 within its recorded scope. One actual local coffee batch on a single proposed scene completed 10,000 unique cases in 11,849.5 ms, with 2,500 blocked / 7,500 open routes and zero conservation failures. Five main-thread spot recomputations using the same core agreed with the checked worker fields, and downloaded JSON matched the completed receipt. This is one synthetic local run, not a guarantee for all scenes/categories or a real-world validation result.

## Limits

Fast analytic classification does not solve geometry or waiting. Full detailed execution is optional and its completed count is reported separately; one selected pair is not a full population run. Category costs are assumptions, addresses are labels and image mapping is manual. The active product has no runtime model API, live market feed, profit/survival model or safety certification. The original deterministic core/shared contracts remain unchanged.

## Submission source

https://github.com/devstar2637-hash/rehearsal-store/tree/codex/rehearsal-3d-preview

Draft PR: https://github.com/devstar2637-hash/rehearsal-store/pull/2.

Runtime source: `9930ea224245e307d60c5e09496c50ee6837447d`. Main remains unmerged. Preserve uncommitted Antigravity work and integrate overlapping D3/main work selectively.

## Cloud demo URL

https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app

Service/revision: `rehearsal-3d-preview` / `rehearsal-3d-preview-00002-sjr` in approved project `h2gdm-hack26icn-2637`, region `asia-northeast3`. Health reports runtime `9930ea2`; main JavaScript and worker bytes match the checked local build. Public interaction smoke passed 9/9, including four-category WebGL/condition views, actual coffee 10,000-condition client-worker completion and a matching JSON download. The public-page client-worker observation took 74,711.6 ms; it is not Cloud server execution time.

## Video URL or upload file

**Public video URL not created.** If the form requires a URL, arrange approved hosting and check viewer access; otherwise use its supported file-upload route.

Current file: `rehearsal-v2-3d-four-concepts-walkthrough-en.mp4`, 114.069987 seconds, H.264 1920 × 1200 / AAC 48 kHz with English narration/captions. This seven-state actual local captured-screen montage supersedes the prior 2.5D recording. It is not uninterrupted live video or a Cloud recording. Actual video duration differs from the internal 90-second planning target; official duration limits remain to be confirmed.

## Google AI declaration, if requested

Development workspace: Antigravity. Runtime model calls: none. Exact development model ID: unverified. Do not infer Gemini execution from dependencies, procedural models or manual image mapping. No mandatory runtime-model requirement is inferred from this declaration.

## Organizer fields and final receipt

Authenticated form URL/fields, limits, track, team/consent details and video acceptance requirements remain unconfirmed. No actual submission receipt exists yet.

**Submit by 15:20 KST; be seated at the venue by 15:50 KST.** English content and Google Cloud deployment are confirmed working requirements.
