# Phase 1 – Analyze `zoo_reference` and Extract Anatomy Patterns

## Purpose

Carefully study the contents of `zoo_reference/` to understand how the Zoo elephant and other
body parts are constructed, so we can design a **general anatomy system** for CreatureStudio
without importing any reference code at runtime.

This phase is primarily **analytical and design-oriented**; it should involve **minimal code
changes**, limited mostly to comments and notes.

## Objectives

1. Build a clear mental model of the **Zoo elephant pipeline**:
   - Skeleton definitions and bone naming.
   - Body-part generators (torso, limb, nose/trunk, head, tail, ears, wings if any).
   - How geometries are merged, skinned, and materialized.

2. Identify reusable patterns and parameters that can be abstracted into a **general anatomy
   API** for CreatureStudio.

3. Document findings in a concise form that later phases can use directly.

## Tasks

1. **Inventory the `zoo_reference` tree**
   - Inspect and list the key files under:
     - `zoo_reference/Elephant/`
     - `zoo_reference/bodyParts/`
   - For each file, briefly note its role, such as:
     - Skeleton definition (`ElephantDefinition`).
     - High-level generator (`ElephantGenerator`).
     - Body-part modules (`TorsoGenerator`, `LimbGenerator`, `TailGenerator`, `NoseGenerator`,
       `WingGenerator` if present, etc.).
     - Behavior/locomotion (`ElephantLocomotion`).
     - Materials/TSL node graphs.

2. **Study the Elephant pipeline**
   - Follow the flow from `ElephantDefinition` → `ElephantGenerator` → body-part generators →
     merged `SkinnedMesh`.
   - Record:
     - How bones are named and grouped into **chains** (spine, front leg, back leg, trunk,
       tail, ears, wings, etc.).
     - How each generator uses **bone chains + radii arrays + options** to create rings and
       surfaces.
     - Where **low-poly vs smooth** settings are applied (segment counts, weld tolerance, etc.).
     - How **skinIndex** and **skinWeight** are assigned to vertices.

3. **Study body-part generators**
   - For each module in `zoo_reference/bodyParts/`:
     - Note its input parameters (skeleton, bone names/indices, radii arrays, options).
     - Note its output (BufferGeometry, plus any metadata).
     - Identify commonalities and differences (e.g., torso vs limb vs wing vs fin).
   - Pay special attention to any **wing or ear** generator logic that might inspire a
     generalized `wingGenerator` in CreatureStudio.

4. **Identify an anatomy vocabulary**
   - Draft a list of generalized concepts that should exist in CreatureStudio, for example:
     - `AnatomyChain` – named sequence of bones with positions & radii.
     - `AnatomyGenerator` – function that builds a geometry segment (torso, limb, wing).
     - `AnatomyProfile` – reusable shape profiles (torso radius profile, taper curves, etc.).
     - `AnatomyStyle` – low-poly vs smooth, segment density, weld options, etc.
   - Map Elephant-specific concepts (rump bulge, hip rings, trunk taper) into this generic
     vocabulary.

5. **Document findings**
   - Create a design note in `docs/` (or extend an existing one) summarizing:
     - Key patterns from `zoo_reference` that we want to emulate.
     - Any limitations or assumptions in the Zoo code that we might want to relax for a
       more general system (e.g., fixed chains, fixed number of bones).

## Expected Outputs

- A short markdown document (e.g., `docs/zoo_reference_anatomy_notes.md`) containing:
  - File inventory and roles.
  - Pipeline overview for Elephant.
  - Summary of body-part generator patterns.
  - Preliminary anatomy vocabulary and abstraction ideas.

- Optional: simple comments added at the top of `zoo_reference` files stating:
  - "`// Reference-only: Do not import from this module at runtime in CreatureStudio.`"

## Success Criteria

- The agent (or a human developer) can read the Phase 1 notes and clearly understand:
  - How the Zoo elephant is built.
  - How the `bodyParts` generators operate.
  - Which concepts need to be abstracted for a general pipeline.

- No runtime code in CreatureStudio has been refactored yet (beyond trivial comments).
