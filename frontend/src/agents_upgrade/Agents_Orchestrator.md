# Agents Orchestrator – CreatureStudio V2.0 → V2.1 Upgrade

## Purpose

You are a ChatGPT /agent working on upgrading **CreatureStudio_V2.0** to **CreatureStudioV2.1**.

You will be given:

- `CreatureStudio_V2.0.zip` – the codebase to modify.
- `plan_upgrade.zip` – phase-by-phase plans (Phase0–Phase7).
- `agents_upgrade.zip` – this file set, which tells you **how to behave** for each phase.

Your job is to:

1. Unpack **CreatureStudio_V2.0.zip** into a working tree.
2. For each phase N (0–7):
   - Read `PhaseN_*.md` from `plan_upgrade.zip`.
   - Read `Agent_PhaseN_*.md` from `agents_upgrade.zip`.
   - Execute the work described there, in order.
3. Produce an updated project zipped as **CreatureStudioV2.1.zip**, with:
   - A generalized creature anatomy pipeline.
   - A runtime that builds all creatures from blueprints via shared body-part generators.
   - Elephant and winged creatures using the new pipeline.
   - `zoo_reference/` used only as reference, never imported at runtime.

## Global Rules (Apply in Every Phase)

1. **Phase Discipline**
   - Never skip a phase.
   - Only move from Phase N to Phase N+1 when:
     - The main tasks of Phase N are reasonably completed, OR
     - Remaining work is clearly documented as TODOs.

2. **zoo_reference is Reference-Only**
   - Never import from `zoo_reference/` into runtime modules.
   - Treat it like documentation: read it, understand it, then implement similar logic under
     `frontend/src/` (or backend) with clear abstractions.

3. **CreatureStudio UX Must Remain Intact**
   - Preserve the existing UI flow: species list, viewport, inspector tabs (Body Plan, Skeleton,
     Body Parts, Materials, Behavior).
   - Any enhancements should feel like natural extensions, not breaking changes.

4. **Blueprint-Driven Design**
   - All new anatomy/runtime behavior must be controllable via blueprints.
   - Hard-coded species-specific logic should be minimal and clearly isolated when necessary.

5. **No Ellipses in Code**
   - When showing code or files in your response, **always show full file contents** for new or
     heavily modified files.
   - Do not use `...` or truncate, even for long files.

6. **Small, Reviewable Changes**
   - Group edits logically (e.g., “add anatomy types”, “wire runtime V2”, “update Elephant blueprint”).
   - Explain what each commit-sized chunk achieves.

7. **Logging, Comments, and Clarity**
   - Add comments around non-obvious math, geometry, and skinning.
   - Use clear naming. Prefer understandable, explicit code over clever one-liners.

8. **Testing Mindset**
   - If you can run tests or dev builds, do so and report the results.
   - If you cannot execute, still write code as if it will be run: no obvious syntax errors,
     type mismatches, or missing imports.

## Phase Files

Each phase has:

- Plan: `PhaseN_*.md` in `plan_upgrade.zip`.
- Agent instructions: `Agent_PhaseN_*.md` in this `agents_upgrade.zip`.

You must always:

1. Identify current phase and read both documents.
2. Summarize your understanding in your own words.
3. List the concrete steps you will perform.
4. Execute them, showing all relevant file contents.
5. Summarize what you accomplished and what remains.

## Phase Overview

- **Phase 0** – Overview and constraints; define the upgrade contract. No code changes.
- **Phase 1** – Analyze `zoo_reference` and extract anatomy patterns (Elephant and bodyParts).
- **Phase 2** – Design anatomy abstractions and TypeScript interfaces.
- **Phase 3** – Implement general body-part generators (torso, limb, wing, etc.).
- **Phase 4** – Upgrade blueprint schema and body plans for archetypes (including Elephant, winged).
- **Phase 5** – Implement Runtime Pipeline V2 and integrate with the viewport.
- **Phase 6** – Editor and UX enhancements for tuning general creatures.
- **Phase 7** – Testing, validation, and packaging `CreatureStudioV2.1.zip`.

## Output Expectations

For each assistant run within a phase, your response must include:

1. **Phase declaration** – e.g., “Executing Phase 3 – General Body-Part Generators.”
2. **Intent summary** – what you’re about to change and why.
3. **File list and contents** – for new or heavily modified files, full text (no truncation).
4. **Status** – what succeeded, what remains, and any risks or TODOs.

Your human collaborator should be able to reconstruct the full set of changes from your responses
and verify that the final `CreatureStudioV2.1.zip` matches the design in `plan_upgrade.zip`.
