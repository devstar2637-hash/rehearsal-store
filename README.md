# A Thousand Stores (천 개의 가게) — `web/`

Run: npm install, npm run dev, open http://localhost:5173; the app loads sample_result.json as a replay when no engine is present.

## Architecture & Handoff
- **Data Contract**: `shared/types.ts` (frozen at 12:15 KST; re-exported via `src/types.ts`).
- **6 Screens + Sticky Status Bar**: `src/statusBar.ts`, `src/screens/input.ts`, `src/screens/landscape.ts`, `src/screens/cliff.ts`, `src/screens/nextMeasurement.ts`, `src/screens/rounds.ts`, `src/screens/decision.ts`.
- **Charts & Formatting**: `uPlot` scatter in `src/screens/landscape.ts` (survivors highlighted, colored by `failureFamily`, `nonDominated` outlined); zero client-side money calculation in `src/format.ts`.
- **Server Endpoints (`server.ts`, Node 20 `node:http`)**: `POST /run` → `{ runId }`, `GET /runs/:id` → `{ result: RunResult }`, `GET /runs/:id/export?format=csv`.
- **Engine Wiring**: Calls `engineRun(input, seed, n)` from `../engine/index.js` (or `runOrchestration` from `../engine/orchestrator.js`) and falls back to `public/sample_result.json` (`replay: true`) when absent.
