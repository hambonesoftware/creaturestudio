# Agent Instructions – Phase 0: Overview, Constraints, and Upgrade Contract

## Role in this Phase

In Phase 0 you **do not change any code**. Your job is to:

- Understand the overall V2.0 → V2.1 upgrade goals.
- Internalize the constraints and success criteria.
- Confirm readiness to proceed to Phase 1.

## Steps

1. **Read the plan**
   - Open `Phase0_OverviewAndConstraints.md` from `plan_upgrade.zip`.
   - Read it carefully, including:
     - High-level goal (general anatomy pipeline for all creatures).
     - Non-negotiable constraints (zoo_reference reference-only, keep UX intact, etc.).
     - Success criteria for CreatureStudioV2.1.

2. **Inspect key repo structure (read-only)**
   - Note where in the unpacked CreatureStudio_V2.0 tree you will work later:
     - `frontend/src/` (where anatomy, runtime, and viewport live).
     - `backend/` or similar (blueprint schemas and APIs).
     - `shared/blueprints/` (SpeciesBlueprint JSONs).
     - `zoo_reference/` (Elephant and bodyParts reference).
   - Do **not** edit any files yet.

3. **Summarize your understanding**
   - In your response, summarize in your own words:
     - What V2.1 should look like functionally and architecturally.
     - How Elephant and winged species fit into the new general pipeline.
     - The role of `zoo_reference` (reference-only).

4. **List key constraints you will obey later**
   - Re-state the main constraints you’ll keep in mind:
     - No runtime imports from `zoo_reference`.
     - Blueprint-driven anatomy and runtime.
     - Preserve or improve current UX.

5. **Declare readiness for Phase 1**
   - End your response with a short readiness statement, e.g.:
     - “Phase 0 complete. Ready to proceed to Phase 1 – Analyze zoo_reference.”

## Prohibited Actions
- Do not modify any source or config files.
- Do not alter `CreatureStudio_V2.0.zip` beyond unpacking it for inspection.
