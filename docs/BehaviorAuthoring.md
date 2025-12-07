# Behavior Authoring

Behavior presets tie blueprints to runtime controllers. The behavior registry currently lives in `frontend/src/behavior/BehaviorRegistry.js` and supports a small set of gait IDs.

## Registry entries
- `elephant_default`: returns a Studio or Zoo elephant controller based on options.
- `quadruped_walk`: a lightweight generic quadruped walk cycle for templates.
- `none`: explicit opt-out of animation.

Add new entries by extending `BEHAVIOR_REGISTRY` with a function that returns a `CreatureController` implementation. Keep IDs stable; the blueprint `behaviorPresets.gait` field should match the registry key exactly.

## Blueprint fields
- `behaviorPresets.gait`: registry key that selects a controller (`none` is safe for static previews).
- `behaviorPresets.idleBehaviors`: free-form list of idle tags for downstream systems.
- `behaviorPresets.specialInteractions`: free-form list of interaction tags.
- `behaviorPresets.tags`: classification tags (e.g., `quadruped`, `reference`).

The inspector Behavior panel shows the resolved gait and whether it is registered.

## Testing behaviors
- Load a blueprint and set its gait to your new ID.
- Implement the controller in the registry; export it as a factory that accepts `{ skeleton, mesh, blueprint, options }`.
- Use the viewport Mesh/Skeleton/Bone Lines toggles to confirm bone motion and alignment.
- If you need a different registry on the backend, mirror the ID and controller selection logic there.

## Validation
`scripts/validate_blueprints.py` checks that `behaviorPresets.gait` matches a known registry ID. Update the validator if you add new gait IDs so CI can catch typos early.
