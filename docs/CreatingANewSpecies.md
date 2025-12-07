# Creating a New Species Blueprint

Use these steps to stand up a new species using the blueprint pipeline.

1. **Start from a template**
   - Copy one of `shared/blueprints/Template{Quadruped|Biped|Winged|NoPed}.json` and rename it (e.g., `GiraffeBlueprint.json`).
   - Update `meta.name`, `meta.version`, and `meta.schemaVersion` (current schema: 4.1.0).

2. **Define the skeleton**
   - Fill in `skeleton.bones` with `{ name, parent, position }` entries that match your target proportions.
   - Pick a `root` bone and keep names consistent so chains and behaviors can find the right joints.

3. **Wire chains**
   - Map each chain (`spine`, `neck`, `head`, `frontLegL`, `frontLegR`, `backLegL`, `backLegR`, `tail`, `trunk`, `earLeft`, `earRight`) to ordered bone names.
   - Add extra chains if needed; they will be visible in the inspector and chain highlighter.

4. **Set sizes and proportions**
   - Use `sizes.defaultRadius` for coarse thickness and `sizes.byChain` entries to tweak per-chain radii (e.g., `frontLegL.radius`).
   - Optional: set `sizes.globalScale` to uniformly scale the entire creature in the viewport.

5. **Assign body parts**
   - For each part, set `generator` (torso, neck, head, tail, nose/trunk, limb, ear) and `chain` (matching your chains map).
   - Tune `options`: radii arrays, sides, rumpBulgeDepth (torso), baseRadius/tipRadius (nose/tail), flatten/tilt (ears), etc.
   - Use the new “Isolate Part” viewport control to preview one part at a time while adjusting options.

6. **Materials and behaviors**
   - `materials.surface` and friends accept simple MeshStandardMaterial-like values (color, roughness, metallic, specular, emissive).
   - Set `behaviorPresets.gait` to a registry key (`quadruped_walk`, `elephant_default`, or `none` by default). Tags and idle behaviors are free-form.

7. **Validate**
   - Run `python scripts/validate_blueprints.py --dir shared/blueprints` to catch missing chains, invalid generators, or unknown behaviors.

8. **Preview in CreatureStudio**
   - Load the blueprint in the app, toggle Mesh/Skeleton/Bone Lines/Highlight Chain, and use the inspector panels to confirm chains, parts, and behaviors.

9. **Document**
   - Add a short note in the blueprint `meta.notes` describing the source (measurements, references) and any non-obvious options.

Following these steps keeps new species consistent with the shared anatomy library and debug tooling.
