// Dual-render comparison between the Zoo elephant (ElephantGenerator)
// and the blueprint-driven CreatureStudio elephant.
//
// Run with:
//   node ./frontend/tests/elephant_parity.mjs
//
// The script builds both elephants, samples key bone positions, and
// reports bounding box deltas so we can tune the blueprint toward the
// Zoo reference.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fs from "node:fs/promises";
import * as THREE from "three";

import { ElephantCreature } from "../../Elephant/ElephantCreature.js";
import { buildCreatureFromBlueprint } from "../src/runtime/BlueprintCreatureRuntime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadBlueprint() {
  const blueprintPath = resolve(
    __dirname,
    "../src/blueprints/ElephantBlueprint.json",
  );
  const raw = await fs.readFile(blueprintPath, "utf8");
  return JSON.parse(raw);
}

function sampleBonePositions(bones, names) {
  const map = new Map();
  const bonesByName = new Map();
  bones.forEach((bone) => bonesByName.set(bone.name, bone));

  names.forEach((name) => {
    const bone = bonesByName.get(name);
    if (!bone) {
      return;
    }
    const pos = new THREE.Vector3();
    bone.getWorldPosition(pos);
    map.set(name, pos);
  });

  return map;
}

function boundingBoxForObject(object3d) {
  const box = new THREE.Box3();
  box.setFromObject(object3d);
  return box;
}

function comparePositions(reference, candidate) {
  const results = [];
  for (const [name, refPos] of reference.entries()) {
    const candPos = candidate.get(name);
    if (!candPos) {
      continue;
    }
    results.push({ name, delta: refPos.distanceTo(candPos) });
  }
  return results.sort((a, b) => b.delta - a.delta);
}

function printComparison(title, deltas) {
  console.log(`\n${title}`);
  deltas.forEach(({ name, delta }) => {
    console.log(`  ${name.padEnd(18)} ${delta.toFixed(4)}m`);
  });
}

async function main() {
  const blueprint = await loadBlueprint();

  const zooElephant = new ElephantCreature({ lowPoly: false });
  zooElephant.updateMatrixWorld(true);

  const csResult = buildCreatureFromBlueprint(blueprint, { lowPoly: false });
  if (!csResult.mesh) {
    throw new Error("Blueprint runtime did not return a mesh");
  }
  csResult.root.updateMatrixWorld(true);

  const landmarks = [
    "spine_base",
    "spine_mid",
    "spine_neck",
    "spine_head",
    "head",
    "trunk_tip",
    "tusk_left_tip",
    "tusk_right_tip",
    "front_left_foot",
    "front_right_foot",
    "back_left_foot",
    "back_right_foot",
    "tail_tip",
  ];

  const zooBones = sampleBonePositions(zooElephant.bones, landmarks);
  const csBones = sampleBonePositions(csResult.bones, landmarks);

  const boneDeltas = comparePositions(zooBones, csBones);
  printComparison("Bone deltas (Zoo vs Blueprint)", boneDeltas);

  const zooBox = boundingBoxForObject(zooElephant);
  const csBox = boundingBoxForObject(csResult.root);

  const sizeZoo = zooBox.getSize(new THREE.Vector3());
  const sizeCS = csBox.getSize(new THREE.Vector3());

  console.log("\nBounding boxes (XYZ meters):");
  console.log("  Zoo        ", sizeZoo.toArray().map((v) => v.toFixed(3)).join(", "));
  console.log("  Blueprint  ", sizeCS.toArray().map((v) => v.toFixed(3)).join(", "));

  console.log("\nBox deltas (abs):", sizeCS.clone().sub(sizeZoo).toArray().map((v) => v.toFixed(3)).join(", "));
}

main().catch((err) => {
  console.error("Elephant parity check failed", err);
  process.exitCode = 1;
});
