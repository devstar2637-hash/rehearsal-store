# A Thousand Stores — Store Design Rehearsal & Spatial Stress-Testing Studio

Run: `npm install`, `npm run dev`, open `http://localhost:3000`.

## Architecture & Core Modules
- **3D Spatial Floorplan Internals (`src/engine/threeFloorplanStage.ts`)**: Interactive Three.js WebGL rotatable store floorplan with 16-slot LED queue buffer bars, 24-cell shared walkway sensor matrix, real-time customer agents, and CAD dimension rulers.
- **2.5D Isometric & 2D CAD Blueprint (`src/engine/canvasRenderer.ts`)**: Dual Baseline vs. Proposed floorplan comparison with 360° orbit, congestion heatmap, lighting, and HVAC airflow overlays.
- **10,000-Store Monte Carlo & Telemetry (`src/engine/d3StatsCharts.ts`)**: D3.js survival distribution chart across 6 operational scenarios and 6 real-time KPI sparklines.
- **Discrete-Event Simulation Core (`src/engine/rehearsalCore.ts`)**: Seeded A* pathfinding, queue buffer dynamics, and spatial clearance validation.
- **Server Endpoints (`server.ts`, Node 20 `node:http`)**: `POST /run` → `{ runId }`, `GET /runs/:id` → `{ result: RunResult }`, `GET /runs/:id/export?format=csv`.
