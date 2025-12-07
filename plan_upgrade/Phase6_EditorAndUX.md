# Phase 6 – Editor and UX Enhancements for General Creatures

## Purpose

Update the CreatureStudio UI (inspector panels, sliders, debug tools) to expose the new anatomy
and blueprint capabilities in a user-friendly way, enabling artists/engineers to tune animals
with the same flexibility that the Zoo elephant pipeline provides.

## Objectives

1. Enhance inspector panels to edit/analyze anatomy-related blueprint fields.
2. Provide quick-adjust controls for common proportions (torso thickness, leg thickness, wing span).
3. Improve debugging tools for chains and body-part geometry.

## Tasks

1. **Update Body Plan / Body Parts inspector panels**
   - Ensure the **Body Plan** tab shows:
     - Archetype (quadruped/biped/winged/noped).
     - Chain definitions with bone counts.
   - Ensure the **Body Parts** tab shows:
     - A list of body-part definitions (torso, legs, wings, tail, head, trunk, ears, etc.).
     - Generator type and chain name.
     - Key options rendered as sliders/inputs where appropriate (e.g., spine thickness, wing span,
       rump bulge depth, lowPoly toggles).

2. **Global quick-adjust sliders**
   - Provide creature-level quick-adjust controls for commonly tuned parameters:
     - Global scale.
     - Spine/torso scale or thickness.
     - Limb thickness.
     - Wing span and thickness (for winged archetypes).
     - Detail level (e.g., low-poly vs smooth toggle).
   - Wire these to modify the underlying blueprint options, then trigger a rebuild via
     `buildCreatureFromBlueprintV2`.

3. **Debugging tools**
   - Add toggles for:
     - Displaying chains with distinct colors.
     - Isolating a specific body part (torso, single leg, wing) in the viewport for inspection.
   - Ensure the UI can highlight the associated chain/bones when a body part is selected.

4. **Blueprint version info and migration hints**
   - Show `schemaVersion` in the inspector so users know which version they are editing.
   - For older or partially migrated blueprints, present clear hints or disable incompatible controls.

5. **Winged creature UX**
   - For winged species:
     - Show wing-specific controls (span, chord length, membrane smoothness).
     - Provide live preview of wing changes via the runtime.

## Expected Outputs

- Updated inspector components for body plans and body parts.
- Working quick-adjust sliders that modify blueprint anatomy options and rebuild creatures.
- Better visual debugging tooling around chains and body parts.

## Success Criteria

- Users can meaningfully tune Elephant and at least one winged species using the inspector,
  without touching JSON directly.
- Developers can isolate and debug misconfigured chains or generators via the UI.
- UX changes do not regress existing non-anatomy features (lighting presets, behavior tabs, etc.).
