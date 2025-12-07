# Phase 0 – Overview, Constraints, and Upgrade Contract

## Purpose

Define the goals, constraints, and success criteria for upgrading **CreatureStudio_V2.0** to
**CreatureStudio_V2.1** using the **`zoo_reference`** folder as *reference only* (no runtime imports).
This phase is **read-only** with respect to code.

The resulting plan is executed by a ChatGPT /agent process that:

- Takes **CreatureStudio_V2.0.zip** as the input codebase.
- Follows the phase documents in `plan_upgrade.zip` (plus any companion `agents_*` docs).
- Produces a fully updated **CreatureStudioV2.1.zip** containing the upgraded app.

## High-Level Goal

Create a **general creature pipeline** in CreatureStudio that is:

- Architecturally based on the **Zoo elephant pipeline**, and
- Flexible enough to support *all* creature archetypes in the studio (quadrupeds, bipeds, winged,
  nopeds, etc.), using readable, reusable body-part generators such as `wingGenerator`, `limbGenerator`,
  `torsoGenerator`, `tailGenerator`, `headGenerator`, etc.

The pipeline must be:

- **Blueprint-driven** – geometry and behavior come from JSON/typed blueprints.
- **Species-agnostic** – Elephant, Cat, Winged creatures, etc. all use the same core anatomy runtime.
- **Zoo-aligned** – the Elephant in CreatureStudio matches the *visual character* of the Zoo elephant
  when using equivalent parameters.

## Input Artifacts

- `CreatureStudio_V2.0.zip`
  - Unzipped into a working tree for the agent.
  - Contains current CreatureStudio app (backend, frontend, blueprints, etc.).

- `zoo_reference/` (inside the CreatureStudio repo)
  - `zoo_reference/Elephant/` – reference copy of Zoo's elephant files (definition, generator,
    locomotion, materials, pens, etc.).
  - `zoo_reference/bodyParts/` – reference body-part generators (torso, limb, tail, nose/trunk,
    head, possibly ear/fin/wing helpers, etc.).
  - These files are **read-only** and used only for **conceptual and algorithmic reference**.
  - There must be **no runtime imports** from `zoo_reference` in the V2.1 code.

## Non-Negotiable Constraints

1. **zoo_reference is reference-only**
   - No `import` / `require` / `from` statements may pull code from `zoo_reference` into runtime
     modules.
   - All reusable logic must be re-implemented or adapted into CreatureStudio’s own `src/` tree,
     with clear TypeScript/JavaScript modules and tests where appropriate.

2. **Maintain current CreatureStudio ergonomics**
   - The existing UI flow (species list, viewport, inspector panels) must remain intact or
     improved, not degraded.
   - Backward compatibility: existing blueprints should continue to load, or migration steps
     must be clearly defined in a script or documented manual process.

3. **Three.js & WebGL**
   - Rendering must continue to use Three.js/WebGL (or the current renderer stack) as in V2.0.
   - No hard dependency on WebGPU-only APIs from the Zoo reference.

4. **Elephant is the canonical reference creature**
   - The Elephant blueprint in CreatureStudio is the primary **golden preset** for the new
     pipeline.
   - Its look should be able to match the Zoo elephant’s style via blueprint parameters
     (ring-based torso, rump shape, leg proportions, low-poly facets, etc.).

5. **No direct mutation of zoo_reference**
   - Files under `zoo_reference/` must not be modified by the agent except for trivial things
     like adding a top-of-file comment that clearly marks them as reference-only.
   - All substantive work happens under `backend/`, `frontend/src/`, `shared/`, `docs/`, etc.

## Success Criteria for V2.1

By the end of all phases (when producing **CreatureStudioV2.1.zip**):

- There is a **general anatomy runtime** that can build creatures from blueprints using
  body-part generators (`torsoGenerator`, `limbGenerator`, `wingGenerator`, etc.).
- The **Elephant species** renders with:
  - The same general proportions and low-poly character as the Zoo elephant.
  - Mesh generated via the *new* anatomy runtime (not legacy code).
- At least one **winged creature** uses a dedicated `wingGenerator` that builds geometry around
  wing bones, guided by blueprint options, with behavior inspired by `zoo_reference` patterns.
- Blueprint schema and editor UI allow **tuning per-species style** (detail level, shape,
  low-poly vs smooth, material selection).
- Basic automated checks (lint, type-check, a small geometry sanity test suite) pass on V2.1.

## Phase Dependencies

The phases in this `plan_upgrade.zip` must be executed in order:

0. Overview, constraints, and upgrade contract (this file).
1. Analyze `zoo_reference` to extract anatomy/behavior patterns.
2. Design generalized anatomy abstractions and interfaces.
3. Implement generalized body-part generators (torso, limb, wing, etc.).
4. Upgrade blueprint schema & body plans for all archetypes.
5. Implement Runtime Pipeline V2 and integrate with the viewport.
6. Update editor/UX for general creature tuning.
7. Testing, migration, and packaging of CreatureStudioV2.1.zip.

## Agent Expectations

For every phase, a ChatGPT /agent must:

- Read the corresponding `PhaseX_*.md` file before making changes.
- Summarize its understanding and intended actions.
- Apply changes in small, reviewable steps.
- Show full contents of newly created or heavily modified files in its responses (no ellipses).
- Maintain a clear mapping from `CreatureStudio_V2.0` → `CreatureStudioV2.1`,
  noting any breaking changes or migration steps.

This file is complete when the constraints are clear and no further clarification is required
to proceed to Phase 1.
