# Agents Orchestrator – CreatureStudio Upgrade

## Purpose

This document tells any ChatGPT/Codex-style agent **how to use** the `plan_upgrade.zip` and the
per-phase agent files in `agents_upgrade.zip` to safely upgrade CreatureStudio (and Zoo)
to a shared, blueprint-driven creature pipeline.

You are the **Orchestrator Agent**. Your job is to:
- Read the relevant plan and agent files for a phase.
- Execute that phase with small, reviewable changes.
- Keep Zoo working at all times.
- Report clearly what you changed.

---

## Repositories and Scope

You will work with these repos:

- `hambonesoftware/creaturestudio`
- `hambonesoftware/zoo`

High-level goals:
- Extract a **shared anatomy library** for procedural body-part generation.
- Upgrade the **SpeciesBlueprint** schema.
- Implement a **general blueprint runtime** in CreatureStudio.
- Achieve **Elephant parity** between Zoo and CreatureStudio.
- Introduce a **behavior registry** shared between both.
- Add **tooling, validation, and docs** to make this maintainable.

You must **never**:
- Break Zoo’s existing demo behavior without explicitly noting it and fixing it.
- Change canonical skeleton names or sizes in `ElephantDefinition.js`.

---

## Global Invariants (Always Respect These)

Before any phase, keep these in mind:

1. **Golden Skeletons**
   - `ElephantDefinition.js` (and later any other “Definition” files) define the canonical bone names
     and hierarchy.
   - Do **not** rename bones or change their hierarchy unless a plan file explicitly instructs you to
     (and in this upgrade, it does not).

2. **Three.js Rendering**
   - The rendering stack is Three.js-based.
   - Do not attempt to migrate to a different renderer (e.g., pure WebGPU) as part of this upgrade.

3. **Blueprint as Source of Truth**
   - Geometry, materials, and behavior should move toward being described in the `SpeciesBlueprint`.
   - Hard-coded species-specific constants in code are acceptable only as a temporary bridge while
     the schema is being upgraded.

4. **Performance**
   - Building a single creature should be fast enough for interactive editing (under ~1 second in a
     typical dev environment).
   - If you add more complexity (segments, sides, etc.), provide ways to dial it back (e.g., `lowPoly`
     options).

5. **Safety and Git Hygiene**
   - Always work in a **branch** per major phase, for example:
     - `feat/creaturestudio-anatomy-lib`
     - `feat/creaturestudio-blueprint-runtime`
   - Make small, reviewable commits:
     - One conceptual concern per commit (e.g., “add TorsoGenerator”, “wire viewport to runtime”).
   - Never delete large files or rewrite major subsystems without a corresponding plan step.

---

## How to Use plan_upgrade.zip and agents_upgrade.zip

Each phase has two pieces:

- `plan_upgrade.zip` → `PhaseX_*.md`: **What and why** for that phase.
- `agents_upgrade.zip` → `Agent_PhaseX_*.md`: **How you should act** for that phase.

When working on phase **N**:

1. Open and read `PhaseN_*.md` from `plan_upgrade.zip`.
2. Open and read `Agent_PhaseN_*.md` from `agents_upgrade.zip`.
3. Summarize the phase in your own words.
4. List the concrete tasks you’ll do in this pass.
5. Perform those tasks with small, explicit changes.
6. Show the full contents of any new or heavily modified files in the response (no ellipses for code).
7. If available, run tests or describe how they **should** be run locally.
8. Note any TODOs or risks you’re leaving behind.

Only move to the next phase when:
- The current phase has been executed to a reasonable stopping point.
- You have documented what’s left to do (if anything) for that phase.

---

## Phase Order and Dependencies

You must follow this order unless explicitly instructed otherwise:

1. **Phase 0 – Target Definition and Constraints**
   - Read-only, no code changes.
   - Establish mental model and invariants.

2. **Phase 1 – Shared Anatomy Library**
   - Extract body-part generators from Zoo into a shared library (initially in CreatureStudio).

3. **Phase 2 – Blueprint Schema Upgrade**
   - Expand `SpeciesBlueprint` to express Elephant’s geometry parameters.

4. **Phase 3 – General Blueprint Runtime**
   - Implement `buildCreatureFromBlueprint` and wire it into the CreatureStudio viewport.

5. **Phase 4 – Elephant Alignment and Multi-Species Scaling**
   - Align Elephant visuals/behavior between Zoo and CreatureStudio.
   - Add at least one more species using templates.

6. **Phase 5 – Shared Behavior Registry**
   - Centralize behavior selection (locomotion, idle) via a registry shared by both repos.

7. **Phase 6 – Tooling, Validation, and Authoring UX**
   - Add blueprint validation, debug visualization, and documentation.

Do not skip phases. If a phase is partially complete, write down what remains.

---

## Error Handling and Ambiguity

If you encounter:

- **Ambiguous code paths** (e.g., multiple possible runtimes):
  - Prefer the path that minimally disrupts existing behavior.
  - Annotate ambiguous sections with comments that reference the relevant plan/agent phase.

- **Missing files or mismatched structures** against the plan:
  - Clearly explain the discrepancy.
  - Propose a small, incremental adjustment that still heads toward the plan’s intent.

- **Unexpected failures** (tests, type errors):
  - Include the exact error message.
  - Propose and implement a fix if it is straightforward and within the phase’s scope.
  - If not straightforward, document it as a follow-up task in that phase’s checklist.

---

## Output Expectations Per Step

For each assistant “run” in a phase, you should:

1. State which phase and agent file you are following.
2. Summarize your intended changes.
3. Show diffs or full files for the changes.
4. Summarize what was accomplished and what remains.

Your human collaborator (Harley) should always be able to:

- See exactly what changed.
- Understand how those changes advance the plan.
- Roll back or cherry-pick as needed.

End of Orchestrator instructions.
