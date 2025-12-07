# Phase 5 – Shared Behavior Registry (Locomotion and Idle)

## Purpose

Introduce a shared behavior registry so that both Zoo and CreatureStudio can select and attach locomotion
and idle controllers based on blueprint metadata, rather than hard-coded wiring. This makes behavior as
data-driven as geometry.

## Objectives

1. **Centralize behavior creation logic**
   - Use a small registry object that maps behavior IDs (strings in the blueprint) to factory functions
     that create controllers.

2. **Unify Zoo and CreatureStudio behavior selection**
   - Zoo pens and CreatureStudio viewport should both consult the same registry when deciding how a creature moves.

3. **Allow for behavior-less blueprints**
   - Some creatures may be static or only rotate slowly; the registry should support "none" or "idle only" behaviors.

## Design

### Behavior registry

```ts
export type BehaviorFactory = (
  skeleton: THREE.Skeleton,
  mesh: THREE.SkinnedMesh,
  blueprint: SpeciesBlueprint
) => CreatureController | null;

const BEHAVIOR_REGISTRY: Record<string, BehaviorFactory> = {
  "elephant_default": createElephantLocomotion,
  "quadruped_walk": createGenericQuadrupedLocomotion,
  "none": () => null
};

export function createBehaviorControllerForBlueprint(
  blueprint: SpeciesBlueprint,
  skeleton: THREE.Skeleton,
  mesh: THREE.SkinnedMesh
): CreatureController | null {
  const id = blueprint.behaviorPresets?.gait || "none";
  const factory = BEHAVIOR_REGISTRY[id];
  return factory ? factory(skeleton, mesh, blueprint) : null;
}
```

- `CreatureController` should be a small interface with at least:
  - `update(dt: number): void`

### Blueprint metadata

- `behaviorPresets` might look like:

  ```json
  "behaviorPresets": {
    "gait": "elephant_default",
    "idle": "elephant_idle_heavy",
    "turntable": false
  }
  ```

## Implementation Steps

1. **Define the `CreatureController` interface**
   - Decide on minimal methods (e.g., `update(dt)`, optional `dispose()`).
   - Ensure Elephant locomotion class implements this interface.

2. **Create the behavior registry module**
   - Place in a shared location (e.g., `frontend/src/behavior/BehaviorRegistry.ts`).
   - Register `elephant_default` to use the existing ElephantLocomotion class.

3. **Update CreatureStudio runtime**
   - In `buildCreatureFromBlueprint`, after building the mesh and skeleton:
     - Call `createBehaviorControllerForBlueprint`.
     - Attach the returned controller to the result object.

4. **Update Zoo pens**
   - Refactor Zoo’s pen classes (e.g., ElephantPen) to use the registry instead of manually instantiating
     behavior controllers.
   - This may require moving some pen-specific logic into the controllers or keeping a thin pen wrapper
     for environment interactions.

5. **Testing**
   - Confirm that Elephant in Zoo still behaves exactly as before.
   - Confirm that Elephant in CreatureStudio animates using the same controller.
   - Add at least one generic quadruped locomotion behavior and verify that other quadrupeds move sensibly.

## Success Criteria

- Behavior in both Zoo and CreatureStudio is selected based solely on blueprint metadata and registry rules.
- Elephant locomotion remains correct and synchronized between the two projects.
- New behaviors can be added by registering new IDs and factories, without touching pen or viewport code.

## Risks

- **Overloading the registry with too many IDs:** mitigated by using clear naming conventions and grouping
  behaviors logically.
- **Behavior-specific dependencies on environment:** mitigated by passing any necessary context into
  the controller or keeping environment-specific behavior in the pens.

## Checklists

- [ ] `CreatureController` interface defined.
- [ ] Behavior registry implemented and integrated in CreatureStudio.
- [ ] Zoo pens refactored to use the registry.
- [ ] Elephant behavior parity verified in both apps.
