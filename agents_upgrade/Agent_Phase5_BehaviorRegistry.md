# Agent Instructions – Phase 5: Shared Behavior Registry (Locomotion and Idle)

You are executing **Phase 5** of the CreatureStudio upgrade.

## Phase Goal

Centralize behavior (locomotion and idle) selection in a shared **behavior registry** that both Zoo and
CreatureStudio can use, based on blueprint metadata. Behavior should become as data-driven as geometry.

You are guided by: `Phase5_BehaviorRegistry.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase5_BehaviorRegistry.md`.
   - Understand the desired registry API and how blueprints will reference behaviors.

2. **Define the CreatureController interface**
   - In a shared or frontend location (e.g., `frontend/src/behavior/CreatureController.ts`):
     - Define a `CreatureController` interface with at least:
       - `update(dt: number): void`
       - Optionally, `dispose(): void` for cleanup.

3. **Implement the behavior registry module**
   - Create a file such as `frontend/src/behavior/BehaviorRegistry.ts`.
   - Implement:
     - `BehaviorFactory` type:
       - `(skeleton, mesh, blueprint) => CreatureController | null`
     - `BEHAVIOR_REGISTRY` mapping string IDs to factories.
     - `createBehaviorControllerForBlueprint(blueprint, skeleton, mesh)` that looks up the appropriate behavior
       using `blueprint.behaviorPresets` (e.g., `gait` field).

4. **Register Elephant behavior**
   - Add an entry like `"elephant_default"` mapped to a factory that instantiates the existing Elephant locomotion
     controller (or behavior class).
   - Ensure the factory wires up any necessary state (speed, phase offsets, etc.).

5. **Wire the registry into CreatureStudio runtime**
   - In `buildCreatureFromBlueprint` (Phase 3 runtime), replace any behavior stub with:
     - `controller = createBehaviorControllerForBlueprint(blueprint, skeleton, mesh);`

6. **Refactor Zoo pens to use the registry**
   - For the Elephant pen (and optionally others):
     - Replace direct instantiation of behavior controllers with calls to the registry using a behavior ID that
       matches the blueprint.
   - Keep environment-specific logic (e.g., collision with pond, fence) in the pen or in a thin adapter.

7. **Blueprint behavior metadata**
   - Ensure `ElephantBlueprint.json` includes a `behaviorPresets` block with `gait` or similar ID that matches
     your registry key (`"elephant_default"`).
   - For any new species, choose sensible default behaviors (e.g., `"quadruped_walk"`).

## Safety and Constraints

- Do not break existing Elephant movement in Zoo.
- If a behavior ID is missing or unknown, gracefully return `null` from the registry and allow the creature to
  remain static (no crash).
- Keep the registry focused; avoid mixing many unrelated concerns into it.

## Output Requirements

Your response for Phase 5 should include:

1. Full source of the `CreatureController` interface file.
2. Full source of the `BehaviorRegistry` module.
3. Diffs or full updated runtime file in CreatureStudio showing the registry hook.
4. Diffs or full updated Zoo pen files showing how they now use the registry.
5. Updated snippet from `ElephantBlueprint.json` showing `behaviorPresets` with the chosen IDs.
