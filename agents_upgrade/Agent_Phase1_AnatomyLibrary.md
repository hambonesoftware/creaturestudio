# Agent Instructions – Phase 1: Shared Anatomy Library (Body-Part Generators)

You are executing **Phase 1** of the CreatureStudio upgrade.

## Phase Goal

Extract all reusable geometry-generation logic for the Elephant (torso, limbs, head, trunk, tusks, tail, ears, etc.)
from Zoo into a shared **anatomy library** that will be used by CreatureStudio’s blueprint runtime.

You are guided by: `Phase1_AnatomyLibrary.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase1_AnatomyLibrary.md`.
   - Understand which generators are needed and what options they should support.

2. **Locate body-part generators in Zoo**
   - In the `zoo` repo, find where the Elephant mesh is built (e.g., `ElephantGenerator` and related helpers).
   - Identify concrete functions/blocks responsible for:
     - Torso geometry.
     - Neck geometry.
     - Head geometry.
     - Nose/Trunk/Tusk geometry.
     - Limb geometry.
     - Tail geometry.
     - Ear geometry.

3. **Create the anatomy library in CreatureStudio**
   - In the `creaturestudio` repo, create a new folder for the shared library, for example:
     - `frontend/src/anatomy/`
   - Add files such as:
     - `TorsoGenerator.ts`
     - `NeckGenerator.ts`
     - `HeadGenerator.ts`
     - `LimbGenerator.ts`
     - `NoseGenerator.ts`
     - `TailGenerator.ts`
     - `profiles.ts`
   - Port the logic from Zoo into these files with minimal behavior changes.
   - Introduce clear TypeScript interfaces for options, but keep the first pass close to the existing code.

4. **Make the generators species-agnostic where possible**
   - Avoid hard-coding Elephant-specific bone names inside the generators.
   - Pass skeleton, bone-chain, and options in from the outside.
   - Elephant-specific details (e.g., radius arrays, rump bulge depths) will later come from the blueprint.

5. **Wire Zoo to use the new anatomy library**
   - Update the Zoo Elephant generation code to import and call the new anatomy functions.
   - Ensure that, given the same parameters, the Elephant still looks the same.

6. **Sanity checks**
   - Conceptually (or via comments if you cannot run code), verify:
     - The Elephant renders without errors.
     - SkinnedMesh attributes (`position`, `normal`, `uv`, `skinIndex`, `skinWeight`) are present.
   - If you can run tests or a dev build, note any logs or issues discovered.

## Safety and Constraints

- Do **not** alter `ElephantDefinition.js` bone names or hierarchy.
- Strive for **no visible change** in the Zoo Elephant after the refactor.
- If you must temporarily duplicate code during the port, document where and why, and mark TODOs to clean up later.

## Output Requirements

Your response for Phase 1 should include:

1. A list of new files created in CreatureStudio for the anatomy library.
2. The **full source** of each new generator file.
3. Diffs or full updated files in Zoo where the Elephant now uses the shared anatomy library.
4. A short summary:
   - What was extracted.
   - What remains Elephant-specific (for now).
   - Any technical debt or TODOs you are leaving for later phases.
