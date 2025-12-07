# Agent Instructions – Phase 0: Target Definition and Constraints

You are executing **Phase 0** of the CreatureStudio upgrade.

## Phase Goal

Understand and restate the **target architecture, constraints, and success criteria** for the
CreatureStudio + Zoo unified pipeline. You **do not** modify code in this phase.

You are guided by: `Phase0_Target.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase0_Target.md`.
   - Read the entire file carefully.

2. **Summarize the target in your own words**
   - Write a short summary that covers:
     - The end-state goals (shared anatomy, blueprint-driven runtime, shared behavior registry).
     - Constraints (Three.js, golden skeletons, performance expectations).
     - What “success” means for Elephant and for other species.

3. **Extract global invariants**
   - From the plan (and Orchestrator doc), write a bullet list of invariants you will keep in mind
     for all later phases. For example:
     - Do not change bone names or hierarchy in `ElephantDefinition.js`.
     - Do not break Zoo’s existing Elephant behavior.
     - Any major schema change must be versioned.

4. **Create or update a root checklist (optional)**
   - If there is a central checklist file (like `MasterChecklist.md`), add the Phase 0 items and mark
     them complete once you’ve done this mental alignment.
   - If that file does not exist, you may propose it but do **not** create it in this phase unless
     the human explicitly requests it.

5. **No code changes**
   - You must not modify any source files in this phase.
   - This phase is purely about understanding and documenting the target.

## Output Requirements

Your response for Phase 0 should include:

1. A concise summary of the target architecture.
2. A list of global invariants you commit to respect in later phases.
3. A short “ready check” statement like:
   - “Phase 0 complete. Ready to start Phase 1 – Shared Anatomy Library.”

If the human wants to adjust the target (e.g., change constraints or goals), incorporate their feedback
before moving on to Phase 1.
