# CreatureStudio Changelog

All notable changes to this project are documented in this file.  The format
roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## V2.1 – General Anatomy Pipeline & Wing Support (Unreleased)

This release introduces a comprehensive overhaul of CreatureStudio’s
anatomy system and runtime.  The goal is to generalise the creature
construction pipeline so that any species—quadrupeds, bipeds, winged
animals, or fantastical creatures—can be defined via data rather than
hard‑coded algorithms.

### Added

* **General anatomy abstractions.** A suite of TypeScript interfaces and helper
  modules (`AnatomyChain`, generator options, sampling utilities, skinning
  helpers) form the foundation of a shared body‑part pipeline.  New
  modules live under `frontend/src/anatomy/core` and
  `frontend/src/anatomy/generators`.
* **Body‑part generators.** Implementations for torso, limb, wing, tail/trunk,
  head, nose and ear generators create meshes from chain definitions.  They
  sample skeleton chains, interpolate radii and profiles, assign skin
  weights, and optionally apply meta transformations (e.g. ear fan/flatten).
* **Blueprint schema v4.2.0.** Blueprints now expose `chainsV2` and
  `bodyPartsV2` arrays, replacing fixed chain names with an arbitrary list
  of chain definitions and generator assignments.  New field `schemaVersion`
  identifies the new schema version.
* **Runtime V2.** A new entry point (`buildCreatureFromBlueprintV2`) assembles
  creatures using the new anatomy generators.  The existing
  `createCreatureFromBlueprint` now selects the V2 builder when a blueprint
  defines `chainsV2` and `bodyPartsV2`, and falls back to the legacy
  runtime for older blueprints.
* **Wing support.** A new `wingGenerator` produces simple wing membranes
  anchored along a chain of bones.  Template blueprints demonstrate
  winged creatures built via the new pipeline.
* **Blueprint updates.** The Elephant blueprint and all template species
  (quadruped, biped, winged, no‑ped) now include `chainsV2` and
  `bodyPartsV2` definitions with appropriate options.  Legacy fields are
  retained for backward compatibility.
* **Editor enhancements.** The body plan and body parts panels display
  V2 chain definitions and generator assignments.  Quick‑adjust sliders now
  include global scale, limb thickness, trunk thickness and wing span.
  Users can click on chains or body parts to highlight or isolate them in
  the viewport.
* **Tests.** Added a `runtime_v2_smoke_test.mjs` which loads several
  blueprints (Elephant, TemplateQuadruped, TemplateWinged) and asserts that
  the V2 runtime can build creatures, produce non‑empty geometries and
  return the expected Three.js types.  This complements the existing
  runtime smoke test.

### Changed

* **Creature runtime dispatch.** `createCreatureFromBlueprint` now detects
  V2 blueprints and delegates to the V2 builder.  The original
  `buildCreatureFromBlueprint` remains for legacy support.
* **Editor state.** Added `setDebugChainName` and `setDebugIsolatePart` to
  `studioState.js` to drive highlighting/isolation when clicking on chains
  or body parts in the inspector.

### Removed

* No major removals.  Legacy body‑part definitions and generators remain but
  are considered deprecated in favour of the new V2 pipeline.

### Migration Notes

* Existing blueprints using the old fixed‑chain schema continue to load
  via the legacy runtime.  To migrate a blueprint, define an array of
  `chainsV2` objects (each with `name`, `bones`, optional `radii` and
  `profile`) and a matching array of `bodyPartsV2` objects (each with
  `name`, `chain`, `generator` and optional `options`).  See
  `shared/blueprints/ElephantBlueprint.json` for an example.
* When building the project locally, ensure that `npm install` is run to
  install dependencies such as `three` before executing tests or running
  the dev server.
