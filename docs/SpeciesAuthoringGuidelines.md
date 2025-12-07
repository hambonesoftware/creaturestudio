# Species Authoring Guidelines

This guide summarizes the steps for adding a new creature blueprint that works with the shared anatomy library and blueprint runtime introduced in Phase 4.

## 1. Start from a template
Pick the closest starting point from `shared/blueprints`:

- `TemplateQuadruped.json` – four-legged baseline with head, tail, and ears
- `TemplateBiped.json` – two-legged, arm-capable frame
- `TemplateWinged.json` – flight-capable frame with wing chains
- `TemplateNoPed.json` – limbless/serpentine frame

Copy the template to a new file (for example, `CatBlueprint.json`) and update the metadata block.

## 2. Define the skeleton
- Maintain a Y-up, Z-forward, X-right coordinate system.
- Bones are defined in local space; the `root` entry may be any bone you want to serve as the rig root.
- Keep bone names stable and descriptive (for example, `front_left_upper`, `spine_mid`).
- Add enough bones to capture the major landmarks you want geometry to follow.

## 3. Wire chains
- Populate `chains` with ordered arrays of bone names for each body part (spine, neck, head, legs, tail, wings, ears).
- For custom appendages, place chain names under `extraChains` and add corresponding entries in `bodyParts.extraParts` that reference them.

## 4. Size lookups
- Use `sizes.defaultRadius` to establish an overall scale.
- Override specific bones or chains in `sizes.byBone` and `sizes.byChain` if you need local thickness tweaks without editing part options.

## 5. Map body parts to generators
- Each `bodyParts` entry needs `generator`, `chain`, and `options` fields.
- Common generator options:
  - Torso: `radii`, `sides`, optional `rumpBulgeDepth`, and low-poly controls.
  - Neck: `radii`, `sides`, `yOffset`, `capBase`, `capEnd`.
  - Head: `radius`, `elongation`, `parentBone` (defaults to the first head chain bone).
  - Limb: `radii` per segment, `sides`, `capStart`, `capEnd`.
  - Tail/Nose: `baseRadius`, `tipRadius`, `sides`, optional `midRadius` or `lengthScale`.
  - Ear: `radii`, `flatten`, `tilt`, `sides`.

## 6. Materials and behaviors
- Provide a simple `materials.surface` color for viewport previews; add `eye`, `tusk`, or `nail` overrides as needed.
- Set `behaviorPresets` with a `gait` and any idle or interaction tags. Behavior controllers will map to these presets in later phases.

## 7. Validate and preview
- Run `npm run test:runtime` to ensure the blueprint builds without errors.
- For elephants, run `node frontend/tests/elephant_parity.mjs` to compare Zoo vs. blueprint output.
- Use the viewport debug scene to visually inspect geometry, normals, and skeleton alignment.

## 8. Keep schema aligned
- Set `meta.schemaVersion` to the current schema (4.1.0 as of Phase 4).
- Keep frontend (`frontend/src/types/SpeciesBlueprint.ts`) and backend (`backend/app/models/blueprint.py`) definitions in sync when adding fields.
