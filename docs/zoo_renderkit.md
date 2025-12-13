# ZooRenderKit (Phase 7 seam)

This folder captures the reusable rendering seam so CreatureStudio and Zoo-style apps can swap renderer backends (WebGPU vs WebGL), lighting presets, and ground helpers without touching downstream animal code.

## Goals

- One place to upgrade WebGPU/WebGL bootstrapping across apps.
- Shared lighting presets that match the "studio" and "all-around" rigs already used in CreatureStudio.
- A consistent overlay helper for environments where WebGPU is mandatory.

## Module map

- `frontend/src/renderkit/renderer.js` — factory for renderer creation plus WebGPU detection. Today it defaults to WebGL but keeps a single seam for enabling WebGPU later.
- `frontend/src/renderkit/camera.js` — reusable orbit camera and resize helper.
- `frontend/src/renderkit/controls.js` — standard orbit-control configuration.
- `frontend/src/renderkit/lighting.js` — shared lighting rigs and disposal helper.
- `frontend/src/renderkit/ground.js` — ground plane helper.
- `frontend/src/renderkit/WebGPURequiredOverlay.js` — WebGPU-required overlay injection/removal.
- `frontend/src/renderkit/index.js` — consolidated exports for package-style consumption.

## Usage notes

`CreatureViewport` now consumes the render kit for camera, renderer, lighting, and ground creation. Future WebGPU enablement happens inside `createRenderKitRenderer`, so both Zoo and CreatureStudio can flip the switch in one place.
