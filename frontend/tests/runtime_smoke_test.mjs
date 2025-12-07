// Minimal runtime smoke test for the CreatureStudio frontend runtime.
//
// This script can be executed with:
//
//   npm run test:runtime
//
// Requirements:
//   - Node.js 20+
//   - `npm install` has been run so that `three` is available.
//
// The test loads the canonical Elephant blueprint JSON and feeds it into
// the createCreatureFromBlueprint runtime helper. If the function returns
// a well-formed object (root group, skinned mesh, skeleton, bones array)
// without throwing, we consider the runtime wiring to be healthy.
//
// The test intentionally avoids any DOM / browser APIs so that it can run
// in a pure Node environment.

import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fs from "node:fs/promises";

import * as THREE from "three";
import { buildCreatureFromBlueprint } from "../src/runtime/BlueprintCreatureRuntime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadElephantBlueprint() {
  const blueprintPath = resolve(__dirname, "../src/blueprints/ElephantBlueprint.json");
  const raw = await fs.readFile(blueprintPath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const blueprint = await loadElephantBlueprint();

  assert.ok(blueprint.meta, "Blueprint should include a meta block");
  assert.ok(
    typeof blueprint.meta.name === "string" && blueprint.meta.name.length > 0,
    "Blueprint.meta.name should be a non-empty string",
  );

  const result = buildCreatureFromBlueprint(blueprint);

  assert.ok(result, "createCreatureFromBlueprint should return an object");
  const { root, mesh, skeleton, bones, skeletonRoot } = result;

  assert.ok(root && root.isGroup, "root should be a THREE.Group");
  assert.ok(mesh && mesh.isSkinnedMesh, "mesh should be a THREE.SkinnedMesh");
  assert.ok(skeleton instanceof THREE.Skeleton, "skeleton should be a THREE.Skeleton");
  assert.ok(Array.isArray(bones) && bones.length > 0, "bones array should be non-empty");
  assert.ok(skeletonRoot && skeletonRoot.isBone, "skeletonRoot should be a THREE.Bone");

  console.log(
    "Runtime smoke test passed: Elephant creature can be constructed from its blueprint.",
  );
}

main().catch((error) => {
  console.error("Runtime smoke test failed:", error);
  // Non-zero exit so CI (or a developer) can spot the failure.
  process.exitCode = 1;
});
