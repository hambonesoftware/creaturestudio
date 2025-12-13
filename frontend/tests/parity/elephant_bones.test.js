import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";

import { ElephantBlueprintAdapter } from "../../src/animals/Elephant/ElephantBlueprintAdapter.js";
import { buildSkeletonFromBlueprint } from "../../src/runtime/buildSkeletonFromBlueprint.js";
import elephantBlueprint from "../../src/blueprints/ElephantBlueprint.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLDEN_PATH = path.resolve(__dirname, "../goldens/elephant/bone_hierarchy.txt");

function parseGolden(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, parent] = line.split(",");
      return { name, parent };
    });
}

function collectHierarchy(bones) {
  const ordered = [];
  function collect(bone, parent) {
    ordered.push({ name: bone.name, parent: parent ? parent.name : "root" });
    for (const child of bone.children) {
      collect(child, bone);
    }
  }

  bones.forEach((bone) => {
    if (!bone.parent || bone.parent.type !== "Bone") {
      collect(bone, null);
    }
  });

  return ordered;
}

async function loadGoldenHierarchy() {
  const goldenContent = await fs.readFile(GOLDEN_PATH, "utf8");
  return parseGolden(goldenContent);
}

async function main() {
  const golden = await loadGoldenHierarchy();

  const adapter = new ElephantBlueprintAdapter();
  const compiled = adapter.compile(elephantBlueprint, { zooParity: true });
  const runtimeSkeleton = buildSkeletonFromBlueprint(compiled.runtime.blueprint);
  const actual = collectHierarchy(runtimeSkeleton.bones);

  assert.strictEqual(
    actual.length,
    golden.length,
    `Bone count mismatch (actual=${actual.length}, expected=${golden.length})`,
  );

  const mismatches = [];
  for (let i = 0; i < golden.length; i += 1) {
    const expected = golden[i];
    const received = actual[i];

    if (!received || expected.name !== received.name || expected.parent !== received.parent) {
      mismatches.push({ index: i, expected, received });
    }
  }

  if (mismatches.length > 0) {
    console.error("Bone hierarchy mismatches detected:\n");
    mismatches.forEach(({ index, expected, received }) => {
      console.error(
        `${index.toString().padStart(3, "0")}: expected ${expected?.name || "<none>"}(${expected?.parent}), received ${received?.name || "<none>"}(${received?.parent})`,
      );
    });
    throw new Error(`Bone hierarchy deviates from golden (${mismatches.length} differences).`);
  }

  console.log("Elephant bone hierarchy matches golden.");
}

main().catch((err) => {
  console.error("Elephant bone parity test failed", err);
  process.exitCode = 1;
});
