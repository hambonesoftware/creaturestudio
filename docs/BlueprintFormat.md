# Blueprint Format

CreatureStudio SpeciesBlueprint files are JSON documents that describe every part of a creature: metadata, skeleton, chains, body parts, materials, and behaviors. They are validated with `scripts/validate_blueprints.py` and mirrored by the backend `SpeciesBlueprint` Pydantic model and the frontend TypeScript types.

## Top-level structure
- `meta`: name, version, schemaVersion (current: **4.1.0**), author/source/notes.
- `bodyPlan`: high-level tags (quadruped/biped/winged/nopeds), tail/trunk/ear flags, symmetryMode.
- `skeleton`: `root`, optional `coordinateSystem`, and `bones` array of `{ name, parent, position }`.
- `chains`: named arrays of bone names (spine, neck, head, trunk, tail, earLeft/right, front/back legs). Extra chains allowed.
- `sizes`: defaultRadius, optional globalScale, and per-bone/chain `SizeProfile` entries (radius/radiusTop/radiusBottom/lengthScale/widthScale).
- `bodyParts`: map of part names to `{ generator, chain, options }`. Generators: `torso`, `neck`, `head`, `tail`, `nose`/`trunk`, `limb`, `ear`. Options are generator-specific (radii arrays, sides, rumpBulgeDepth, baseRadius/tipRadius, etc.).
- `materials`: simple material presets for surface, eye, tusk, nail, extraMaterials.
- `behaviorPresets`: gait ID (registry key), idleBehaviors, specialInteractions, tags.

## Validation checklist
The validator enforces:
- Every `bodyParts.*.chain` exists in `chains` and every `chains.*` entry references a valid bone.
- Every body part has a known `generator`.
- Numeric options are non-negative and `sides >= 3` where present.
- `behaviorPresets.gait` matches a registry entry (`elephant_default`, `quadruped_walk`, or `none` by default).

Run validation locally:
```bash
python scripts/validate_blueprints.py --dir shared/blueprints
```

## Authoring tips
- Keep bone names consistent with the canonical definitions (e.g., ElephantDefinition.js) to preserve animations and comparisons.
- Prefer using chains for anatomy alignment instead of duplicating positions in generator options.
- Use `sizes.globalScale` for coarse scaling; keep radii/length tweaks per chain for finer control.
- When experimenting, set `behaviorPresets.gait` to `none` to suppress controllers until ready.
