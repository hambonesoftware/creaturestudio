# Agent Instructions – Phase 4: Elephant Alignment and Multi-Species Scaling

You are executing **Phase 4** of the CreatureStudio upgrade.

## Phase Goal

1. Achieve near-perfect visual and behavioral parity between:
   - The Elephant rendered in Zoo (using `ElephantGenerator`).
   - The Elephant rendered in CreatureStudio (using `buildCreatureFromBlueprint` + `ElephantBlueprint.json`).

2. Use templates to scale the approach to at least one additional species.

You are guided by: `Phase4_AlignmentAndScaling.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

### Part A – Elephant Parity

1. **Read the plan file**
   - Open `Phase4_AlignmentAndScaling.md`.
   - Understand both the visual and behavioral alignment goals.

2. **Create a dual-render comparison setup**
   - Design a dev-only script or debug scene that:
     - Spawns a Zoo elephant using the existing pipeline.
     - Spawns a CreatureStudio elephant using the blueprint runtime.
   - If they cannot literally share a single scene, conceptually describe or configure matching cameras/lights.

3. **Compare shapes and bones**
   - Compare, qualitatively or quantitatively:
     - Silhouettes from multiple angles.
     - Major bone positions (hips, shoulders, head, trunk tip, tusk tips, feet).
   - Optionally, document an approach to sampling points on each mesh and comparing distances.

4. **Tune blueprint options for Elephant**
   - Adjust only the **blueprint** options (torso radii, limb radii, trunk/tusk taper, ear transforms, etc.).
   - Avoid changing the anatomy library or Zoo’s generator unless strictly necessary.
   - Iterate until differences are visually small and acceptable.

5. **Behavior parity**
   - If a shared behavior controller is already available (or once Phase 5 is in place):
     - Ensure both Zoo and CreatureStudio Elephants use the same locomotion logic.
     - Confirm gait, body bob, trunk sway, and ear motion feel consistent.
   - If Phase 5 is not yet implemented, note behavior mismatches to revisit later.

### Part B – Multi-Species Scaling

6. **Work with species templates**
   - Identify or create template blueprints (e.g., `TemplateQuadruped`, `TemplateBiped`, etc.).
   - Ensure each template is valid with the new runtime and anatomy library.

7. **Create at least one additional species**
   - Example: a Cat blueprint derived from the quadruped template.
   - Adjust proportions and body-part options (slimmer torso, different leg radii, long tail).
   - Render this new species in CreatureStudio and ensure it appears coherent and animatable.

8. **Document species authoring guidelines**
   - In a docs file (to be created formally in Phase 6, but you can draft now if helpful), outline:
     - Steps to define a new skeleton.
     - How to define chains.
     - How to configure `bodyParts` and options.
     - How to choose behavior presets.

## Safety and Constraints

- Avoid making major changes to Zoo’s Elephant pipeline during this phase; focus on tuning the blueprint.
- Do not degrade Elephant quality in Zoo while improving parity for CreatureStudio.
- If you find mismatches that can only be resolved by adjusting the anatomy library, do so cautiously and document it.

## Output Requirements

Your response for Phase 4 should include:

1. A description of your dual-render comparison approach.
2. An explicit list of changes made to `ElephantBlueprint.json` (parameters and rationale).
3. Full contents of any new species blueprint you introduce (e.g., Cat).
4. Notes on how close the visual and behavioral match is, and what minor differences remain (if any).
