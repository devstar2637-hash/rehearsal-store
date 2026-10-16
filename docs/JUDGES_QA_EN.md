# Rehearsal V2 — judges' questions

## What is implemented?

A Three.js WebGL studio with four distinct procedural store interiors, editable furniture, deterministic queue/path calculations, a 10,000-condition explorer and an optional detailed Web Worker batch. It is deployed on Cloud Run at https://rehearsal-3d-preview-299086406033.asia-northeast3.run.app from runtime `9930ea224245e307d60c5e09496c50ee6837447d`, revision `rehearsal-3d-preview-00002-sjr`.

## Is the 3D real?

The rooms use WebGLRenderer, PerspectiveCamera, mesh geometry, lighting, OrbitControls and raycast picking. Right-drag orbits, wheel zooms and left-drag moves a selected furniture mesh. Physical realism and real-store reconstruction are not established by rendering.

## Do the four categories differ beyond their labels?

Yes: the implemented and locally checked concepts include coffee equipment, a bakery oven and bread rack, matcha tea equipment/noren panels, and a wine bottle library/bar setting. Geometry/material signatures and captured category views were distinct. Their operating assumptions remain synthetic.

## What exactly are the 10,000 cases?

Per selected category, they are unique tuples of arrival rate, service time, order staffing, pickup staffing and body width. The default fast screen is analytic capacity classification. A selected row triggers two detailed comparison runs; the optional full worker executes 10,000 conditions on one proposed-scene snapshot. It is not 20,000 paired runs or proof of every category's full execution.

## Did the complete batch actually run?

One local coffee/proposed-scene batch completed 10,000 unique cases in 11,849.5 ms: 2,500 blocked routes, 7,500 open routes and zero conservation failures. Five sampled rows matched main-thread recomputation with the same core, and downloaded JSON matched the receipt. This is mechanism/correspondence evidence under a particular synthetic scene, not a universal benchmark or independent real-world oracle.

## What happens when a user changes inputs or cancels?

The UI invalidates the active job/receipt, uses category/revision/job-token guards and blocks stale export. Cancellation/timeout terminates the worker without a complete receipt; partial progress is not a successful full-batch result. Local cancellation and stale-result guards were included in the recorded UI checks.

## Is there live AI or address-level market data?

The product was developed in Antigravity; the exact development model identifier is unverified. This runtime uses deterministic code and procedural models, without a model API call or live market feed. An address labels a scenario; a photo supports manual marking rather than automatic recognition or measured dimensional reconstruction.

## Are the results forecasts or safety guarantees?

No. They are calculations under synthetic arrival/service, geometry and staffing assumptions. There is no profit/survival probability or physical airflow model. Body-width checks are not accessibility, building-code or safety certification. Main-thread and worker computations share the same core; agreement does not validate that core against reality.

## How was it checked?

Build/type checking and 16 tests passed; independent local UI checks passed 15/15, with a separate final mesh recheck passing 2/2 for the recorded interactions, categories, exports and responsive layouts. The deployed health identifies the source and main/worker bytes match the local build. Nine public interaction checks passed. One public-page coffee client worker completed 10,000 rows in 74,711.6 ms, all compact rows matched the local population, and its 2,928,628-byte JSON matched the receipt. That timing is browser-side, not Cloud server execution or model latency.

## Why use reference analysis?

REA 6.5.0 statically analyzed House Control's JavaScript structure (26 relevant files, 184 graph nodes and 434 edges). It did not execute the reference or prove behavioral equivalence, and is not a runtime dependency. The store models are newly written procedural geometry rather than copied reference assets.

## What is ready for submission?

The current source branch, Cloud deployment, English packet and 114.069987-second English captured-screen recording are prepared. The authenticated form fields, required video hosting/upload route and actual submission acknowledgement remain to be completed. Main remains unmerged and the source is reviewed through PR #2.
