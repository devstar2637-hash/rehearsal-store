# A Thousand Stores — Store Design Rehearsal & Spatial Stress-Testing Studio

Run: `npm install`, `npm run dev`, open `http://localhost:3000`.

## Preview and production sync

- Use `npm ci` for reproducible installation, `npm run lint` for type checks,
  and `npm test` for server, spatial, and result-summary tests.
- The AI Studio entrypoint is `src/main.ts`, `index.html`, and `styles.css`.
  `npm run sync:cloud-ui` regenerates the `web/client/` mirror.
- `npm run build` creates the Vite app; `npm run build:cloud-ui` creates
  the compatible `/app.js` and `/styles.css` layout used by GDH.
- The server proxies financial engine calls to `ENGINE_BASE_URL`, defaulting
  to the existing thousand-stores Cloud Run service. An unavailable backend
  returns an explicit error rather than simulated success.
- Pull external GitHub changes into the AI Studio workspace using
  Settings > GitHub. Saving code to GitHub and deploying Cloud Run are
  separate operations.
- The spatial wafer and swarm are illustrative; the separate 36-month engine
  status reports actual scenario outcomes and marks cached replay results.

Full integration flow:
https://github.com/devstar2637-hash/GDH/blob/main/docs/UI_SYNC.md

## Architecture & Core Modules
- **3D Spatial Floorplan Internals (`src/engine/threeFloorplanStage.ts`)**: Interactive Three.js WebGL rotatable store floorplan with 16-slot LED queue buffer bars, 24-cell shared walkway sensor matrix, real-time customer agents, and CAD dimension rulers.
- **2.5D Isometric & 2D CAD Blueprint (`src/engine/canvasRenderer.ts`)**: Dual Baseline vs. Proposed floorplan comparison with 360° orbit, congestion heatmap, lighting, and HVAC airflow overlays.
- **10,000-Store Monte Carlo & Telemetry (`src/engine/d3StatsCharts.ts`)**: D3.js survival distribution chart across 6 operational scenarios and 6 real-time KPI sparklines.
- **Discrete-Event Simulation Core (`src/engine/rehearsalCore.ts`)**: Seeded A* pathfinding, queue buffer dynamics, and spatial clearance validation.
- **Server Endpoints (`server.ts`, Node 20 `node:http`)**: `POST /run` → `{ runId }`, `GET /runs/:id` → `{ result: RunResult }`, `GET /runs/:id/export?format=csv`.
