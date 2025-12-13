# Elephant Parity Targets (Phase 0)

This document captures the golden references required to match Zoo’s
WebGPU elephant rendering. It defines what must align exactly versus what
can be visually close when CreatureStudio renders or exports elephants.

## Golden viewpoints and scene toggles

Capture the following viewpoints from Zoo (source of truth) and reuse the
same camera + lighting in CreatureStudio:

1. Front view – centered on the head, framing the full body.
2. Side view (left) – orthographic-style alignment to evaluate proportions.
3. Three-quarter view (front-left) – primary hero angle for parity checks.
4. Rear quarter view – checks tail alignment and hind leg spacing.
5. Top-ish view – verifies spine curvature and ear/trunk projection.

Scene toggles for each shot:

- Lighting presets: bright all-around and studio-balanced variants.
- Ground plane: on for scale reference; capture one pass with ground off
  to isolate shadows.
- Wireframe: off by default; capture a single wireframe overlay to check
  topology alignment if needed.

## Baseline scene configuration

- Renderer: WebGPU with `WebGPURenderer`, matching Zoo defaults.
- Camera: perspective with locked FOV matching Zoo; document near/far
  planes used for parity shots.
- Exposure/tonemapping: replicate Zoo defaults (ACESFilmic unless a newer
  Zoo default is documented).
- Environment: neutral HDRI or Zoo’s studio preset; record filename and
  intensity used when capturing goldens.

## Bone list golden reference

Export a deterministic, ordered list of bones from Zoo’s elephant and
store it alongside the golden screenshots. The list should include:

- Bone names using Zoo’s canonical naming (root, spine segments, limbs,
  tusks, trunk segments, ears, tail).
- Parent references and order (preorder traversal) for structural tests.

## Pixel vs structural expectations

**Must match (pixel-tight):**

- Silhouette and proportions across the five viewpoints.
- Shading response of elephant skin with node/TSL pipeline enabled.
- Shadow placement and contact patch against the ground plane when on.

**Can be “close” (tolerated differences):**

- Minor HDRI sampling differences if environment maps differ slightly.
- Subtle tone mapping differences within a small ΔE tolerance.
- Wireframe overlays used for debugging only.

## Acceptance checklist

- Five golden screenshots captured from Zoo using the above viewpoints and
  toggles.
- Recorded camera, lighting, environment, and renderer settings stored
  with the goldens.
- Deterministic bone list text dump checked into version control.
- Statement of tolerance for allowed differences documented above.
