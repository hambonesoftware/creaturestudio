# Agent Instructions – Phase 6: Editor and UX Enhancements

## Role in this Phase

You will improve the CreatureStudio UI so that users can tune general creature anatomy (including
winged animals) in a clear, intuitive way.

## Steps

1. **Read the plan**
   - Open `Phase6_EditorAndUX.md` from `plan_upgrade.zip`.

2. **Update Body Plan tab**
   - Ensure it displays:
     - Archetype type (quadruped, winged, etc.).
     - Chain list with counts (e.g., spine: 6 bones; left wing: 4 bones).
   - Make it easy to see which chains exist and which are used by body parts.

3. **Update Body Parts tab**
   - Show each body part entry:
     - Part name (torso, backLegL, wings, etc.).
     - Generator type.
     - Chain name.
     - Key anatomy options, surfaced as sliders/inputs where appropriate.
   - When a part is selected, allow isolating its mesh in the viewport (if supported).

4. **Global quick-adjust sliders**
   - Implement sliders that adjust high-level proportions:
     - Global scale.
     - Spine/torso thickness.
     - Limb thickness.
     - Wing span / thickness for winged archetypes.
     - Detail mode (e.g., low-poly vs smooth) if mapped to generator options.
   - Ensure these modify the in-memory blueprint and trigger a rebuild.

5. **Chain and debug visuals**
   - Integrate with or extend existing debug toggles:
     - Highlight chains in different colors.
     - Show/hide bone lines.
     - Isolate single body parts.

6. **Version and migration info**
   - Display blueprint `schemaVersion` somewhere in the inspector.
   - If older versions are loaded, show clear messaging about limited editing capabilities or
     suggest migration.

## Phase Completion Criteria
- Users can visually and numerically tune Elephant and a winged creature via the inspector.
- Debugging tools help diagnose anatomy misconfigurations.
- UX remains responsive and stable across species.
