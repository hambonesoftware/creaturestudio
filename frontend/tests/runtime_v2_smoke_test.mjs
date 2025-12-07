// Runtime V2 smoke test for CreatureStudio
//
// This script exercises the new general anatomy pipeline by loading a set
// of blueprints that declare chainsV2/bodyPartsV2 and ensuring that
// the V2 runtime can construct a creature without throwing. It checks
// that the returned object includes the expected Three.js types and
// that the generated geometry contains vertices. The test is designed
// to run under Node.js (v20+) and assumes that the `three` package is
// installed (via `npm install`).
//
// To run this test manually:
//   node ./frontend/tests/runtime_v2_smoke_test.mjs
//
// Note: In the workshop environment used by the agents, Node modules
// may not be installed; therefore this script may not execute. It
// should be run in a development environment where dependencies are
// installed. See Phase 7 plan for details.

import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import * as THREE from 'three';

import { createCreatureFromBlueprint } from '../src/runtime/createCreatureFromBlueprint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadBlueprint(name) {
  const blueprintPath = resolve(__dirname, `../src/blueprints/${name}.json`);
  const raw = await fs.readFile(blueprintPath, 'utf8');
  return JSON.parse(raw);
}

async function buildAndCheck(name) {
  const blueprint = await loadBlueprint(name);
  assert.ok(Array.isArray(blueprint.chainsV2), `${name} should define chainsV2`);
  assert.ok(Array.isArray(blueprint.bodyPartsV2), `${name} should define bodyPartsV2`);

  const result = createCreatureFromBlueprint(blueprint, { lowPoly: false });
  assert.ok(result, `createCreatureFromBlueprint should return an object for ${name}`);
  const { root, mesh, skeleton, bones } = result;
  assert.ok(root && root.isGroup, `${name}: root should be a THREE.Group`);
  assert.ok(mesh && mesh.isSkinnedMesh, `${name}: mesh should be a THREE.SkinnedMesh`);
  assert.ok(skeleton instanceof THREE.Skeleton, `${name}: skeleton should be a THREE.Skeleton`);
  assert.ok(Array.isArray(bones) && bones.length > 0, `${name}: bones array should be non-empty`);
  // Ensure geometry has at least one vertex
  const posAttr = mesh.geometry.getAttribute('position');
  assert.ok(posAttr && posAttr.count > 0, `${name}: geometry should have vertices`);
  console.log(`${name}: V2 runtime smoke test passed. Vertex count = ${posAttr.count}`);
}

async function main() {
  const blueprints = ['ElephantBlueprint', 'TemplateQuadruped', 'TemplateWinged'];
  for (const bpName of blueprints) {
    await buildAndCheck(bpName);
  }
  console.log('All V2 blueprint smoke tests passed.');
}

main().catch((err) => {
  console.error('V2 runtime smoke test failed:', err);
  process.exitCode = 1;
});