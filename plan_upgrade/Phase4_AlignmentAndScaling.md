# Phase 4 – Elephant Alignment and Multi-Species Scaling

## Purpose

First, achieve near-perfect visual and behavioral parity between the Elephant as rendered in Zoo (via
`ElephantGenerator`) and Elephant as rendered in CreatureStudio (via `buildCreatureFromBlueprint` and
`ElephantBlueprint.json`). Second, scale the approach to additional species using templates.

## Objectives

1. **Elephant parity**
   - Make the CreatureStudio elephant match the Zoo elephant in proportions, silhouette, and general style.
   - Ensure the same locomotion and idle behaviors feel the same when using a shared controller.

2. **Multi-species scaling**
   - Define and use species templates (e.g., generic quadruped, biped, winged creature) to bootstrap future animals.
   - Validate that adding new species is primarily a blueprint-authoring task.

## Implementation Steps

### Part A – Elephant parity

1. **Create a dual-render test scene**
   - In a dev-only script or debug page, instantiate:
     - Zoo elephant using `ElephantGenerator` and its current pipeline.
     - CreatureStudio elephant using `buildCreatureFromBlueprint(ElephantBlueprint)`.
   - Render them side-by-side or overlapped, using identical camera and lighting.

2. **Quantitative comparison**
   - For each major landmark:
     - Sample bone positions (hips, shoulders, head, trunk tip, tusk tips, feet).
     - Compare world-space positions and distances between landmarks.
   - Optionally sample random points on the surface of each mesh and compute average/max distances between them.

3. **Tuning geometry options in the blueprint**
   - Iteratively adjust:
     - Torso `radii`, `sides`, and `rumpBulgeDepth`.
     - Limb `radii` and segment counts.
     - Trunk/tusk taper parameters.
     - Ear thickness and flatten transforms.
   - Update `ElephantBlueprint.json` and re-run the dual-render test until differences are visually negligible.

4. **Behavior alignment**
   - Ensure that CreatureStudio also uses the same Elephant locomotion controller as Zoo.
   - Confirm that gait phases, head bob, trunk sway, and ear flap frequency feel consistent.

### Part B – Multi-species scaling

1. **Define template blueprints**
   - Create template blueprint files (or confirm existing ones) for:
     - `TemplateQuadruped.json`
     - `TemplateBiped.json`
     - `TemplateWinged.json`
     - `TemplateNoPed.json` (e.g., tails, snakes, etc.)
   - Populate reasonable defaults for:
     - Skeleton layout (simplified).
     - Chains (spine, neck, legs, wings, tail).
     - BodyParts and options using generic radius profiles.

2. **Create at least one additional species**
   - Example: a Cat blueprint:
     - Adapt quadruped template for proportions (longer tail, slimmer torso, small head, etc.).
     - Tune limb radii and torso profile.
   - Render in CreatureStudio and verify that the cat looks coherent and animates acceptably.

3. **Document species authoring guidelines**
   - Write down in a `docs/` file:
     - How to define a new skeleton.
     - How to set up chains.
     - How to map body parts to generators with options.
     - How to select or define behavior presets.

## Success Criteria

- Elephant:
  - Visual comparison between Zoo and CreatureStudio elephants shows no obvious differences.
  - Bone positions and bounding boxes are within acceptable tolerances.
  - Locomotion and idle animation look the same in both environments.

- Multi-species:
  - At least one additional species (e.g., Cat) is implemented purely via blueprints and renders correctly.
  - Template blueprints are stable and ready for reuse.

## Risks

- **Overfitting to Elephant again:** mitigated by immediately applying the same pipeline to a second species.
- **Template complexity:** mitigated by starting with simple defaults and adding complexity only when needed.

## Checklists

- [ ] Dual-render elephant comparison scene implemented.
- [ ] Elephant blueprint tuned for near-perfect parity.
- [ ] At least one non-elephant species implemented via template.
- [ ] Species authoring guidelines documented.
