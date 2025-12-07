# Agent Instructions – Phase 1: Analyze `zoo_reference` and Extract Anatomy Patterns

## Role in this Phase

You are analyzing the **Zoo elephant pipeline** and **bodyParts generators** to extract concepts
and patterns. You will write a short design note, but not yet refactor runtime code.

## Steps

1. **Read the plan**
   - Open `Phase1_AnalyzeZooReference.md` from `plan_upgrade.zip`.

2. **Inventory `zoo_reference/Elephant`**
   - List the main files and their roles, for example:
     - `ElephantDefinition` – skeleton and radii.
     - `ElephantGenerator` – orchestrates body-parts.
     - `ElephantLocomotion` – behavior (for later phases).
     - Material or pen/scene files (lighting, shading).
   - Note how bones are grouped into logical chains (spine, legs, trunk, tail, ears, wings).

3. **Inventory `zoo_reference/bodyParts`**
   - List all generator modules and briefly describe what each does:
     - Torso, Limb, Nose/Trunk, Tail, Head, Ear, Wing, etc. (names may vary).
   - Note key parameters:
     - Inputs: skeleton, bone names, radii arrays, options.
     - Outputs: BufferGeometry with skinning attributes.

4. **Trace the Elephant pipeline**
   - From `ElephantDefinition` → `ElephantGenerator` → body-part calls → merged mesh:
     - How chains are defined or inferred.
     - How radii, segment counts, and low-poly options are passed around.
     - How skinIndex/skinWeight are assigned.

5. **Draft a design note**
   - Create or update `docs/zoo_reference_anatomy_notes.md` in the working tree.
   - Include:
     - File inventory.
     - Step-by-step Elephant pipeline overview.
     - Bullet list of generator patterns (e.g., ring-based tubes, radius profiles).
     - Notable features relevant to generalization (rump bulge, hip rings, trunk taper,
       wing membranes if present).

6. **Optional: Mark reference-only files**
   - At the very top of each `zoo_reference` file you open, you MAY add a simple comment like:
     - `// Reference-only: Do not import this module at runtime in CreatureStudio.`
   - Only do this if such comments do not already exist.

## Prohibited Actions
- Do not import `zoo_reference` into runtime code.
- Avoid changing anything outside of docs and optional comments in `zoo_reference`.

## Phase Completion Criteria
- `docs/zoo_reference_anatomy_notes.md` exists and captures the key insights.
- You (the agent) can articulate how the Zoo elephant pipeline works and which ideas will
  be reused in the general anatomy system.
