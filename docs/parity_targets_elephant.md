# Elephant Parity Targets (Phase 0)

This document captures the golden references required to match Zoo’s
WebGPU elephant rendering. It defines what must align exactly versus what
can be visually close when CreatureStudio renders or exports elephants.
The Zoo elephant is the source of truth; all captures and checklists
below must be produced directly from the Zoo pipeline before parity work
begins in CreatureStudio.

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
- Lighting presets: capture output frames for the presets used by Zoo
  (e.g., studio-balanced and rim-lit). Save both the PNG renders and the
  preset parameter JSON (key, intensity, color temperature) so WebGPU
  parity can replay them.
- Debug modes: run and store captures for “rings” (skeleton ring
  visualization) and “lowpoly mesh” overlays. Record the exact toggle
  locations and rendering order to avoid mismatched layers later.

## Pose, scale, and bone list golden references

- Pose: capture the standard “standing + relaxed trunk” pose used in Zoo
  marketing shots. Document any IK pins or animation frame used to freeze
  the pose.
- Scale: record the Zoo world-unit scale for shoulder height, total
  length, and ear span. Include the meter/unit ratio and any model-space
  to world-space transforms so the same physical size can be re-created
  in CreatureStudio.

Bone list capture:

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

## Parity checklist (to enforce during later phases)

1. Camera FOV, near/far planes, and hero-frame crop match Zoo captures.
2. World scale matches recorded Zoo measurements (shoulder height, length,
   ear span) within centimeter tolerance.
3. Elephant pose (trunk curl, leg spacing, ear rotation) matches the frozen
   Zoo pose; no auto-retargeting drift.
4. Renderer is WebGPU-only with Zoo-equivalent exposure/tonemapping.
5. Lighting preset outputs (studio-balanced and rim-lit) match recorded
   PNGs within agreed ΔE tolerance.
6. Ground plane position and material albedo match Zoo captures; contact
   shadows align with hoof placement.
7. Environment map choice, rotation, and intensity match recorded values.
8. Ring debug overlay renders over shaded mesh with correct bone order and
   spacing.
9. Lowpoly mesh overlay aligns with high-res silhouette; no UV or normal
   flips introduced.
10. Deterministic bone list order, names, and parentage match the Zoo dump.
11. Chain counts and canonical chain names (spine, trunk, legs, ears,
    tail) match the Zoo reference definition.
12. Material parameterization (skin roughness/metalness/specular color)
    matches Zoo node graph defaults.
13. Trunk and ear thickness profiles align with Zoo’s mesh/ring generator
    outputs at all captured angles.
14. Shadow softness and contact patch size match Zoo’s light radius/IES
    setup.
15. Wireframe overlay (when toggled) aligns with rendered geometry without
    z-fighting differences from Zoo.
16. HDRI exposure compensation and tonemapping curve shape match the saved
    preset parameters.
17. Default viewport background color matches Zoo “WebGPU required” scene
    shell when nothing is loaded.
18. Asset origin/pivot placement is identical so snapping/pinning behavior
    stays consistent across apps.

## Acceptance checklist

- Five golden screenshots captured from Zoo using the above viewpoints and
  toggles.
- Recorded camera, lighting, environment, and renderer settings stored
  with the goldens.
- Deterministic bone list text dump checked into version control.
- Pose freeze-frame, IK pin notes, and physical scale measurements stored
  with the captures so scene scale is reproducible.
- Lighting preset PNGs plus the preset parameter JSON committed alongside
  the goldens.
- Ring debug overlay and lowpoly mesh overlay captures stored with notes on
  toggle order and render ordering.
- Statement of tolerance for allowed differences documented above.
