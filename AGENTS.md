# Bio Galaxy: contributor guide

Bio Galaxy is a 3D biological atlas rendered with Three.js over public
scientific databases. These conventions keep it modular and maintainable.

## Architecture rules

- Keep files focused; split anything that grows past roughly 400 lines into
  helper modules. Scene logic and React UI stay in separate files.
- The Three.js system lives in `src/three`. Each scale range is a `SceneLayer`
  that owns its own geometry, animation, and cleanup. The orchestrator
  (`BioGalaxyScene`) owns the renderer, camera, controls, and lifecycle.
- API access lives in `src/data/clients`. Rendering code never calls a database
  directly; it goes through these typed wrappers, which handle timeouts, error
  normalization, and the caching boundary.
- Every database-backed object names its source through the registry in
  `src/data/sources.ts`.

## Three.js discipline

- Use instanced meshes for repeated nodes, particles, vesicles, and atoms.
- Dispose every geometry, material, texture, control, listener, observer, and
  animation frame on teardown. Use `core/dispose.ts`.
- Pause the render loop when the canvas is offscreen and throttle hover
  raycasting. Do not allocate new materials inside the animation loop.

## Data and copy

- Endpoints must be public and key free. No secrets, no fake API keys.
- Keep copy plain and accurate. No hype, no medical or diagnostic claims, no
  em dashes in UI text.
