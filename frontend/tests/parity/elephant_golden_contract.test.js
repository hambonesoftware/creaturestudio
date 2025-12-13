import assert from "node:assert";
import { ElephantBlueprintAdapter } from "../../src/animals/Elephant/ElephantBlueprintAdapter.js";
import {
  ELEPHANT_BODY_PARTS,
  buildCanonicalElephantChains,
} from "../../src/animals/Elephant/ElephantAdapterContract.js";
import { ElephantDefinition } from "../../src/animals/Elephant/ElephantDefinition.js";
import { createCreatureFromBlueprint } from "../../src/runtime/createCreatureFromBlueprint.js";
import elephantBlueprint from "../../src/blueprints/ElephantBlueprint.json" with { type: "json" };

function assertArrayEqual(actual, expected, label) {
  const missing = expected.filter((item) => !actual.includes(item));
  const unexpected = actual.filter((item) => !expected.includes(item));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `${label} mismatch. Missing: [${missing.join(", ")}]; Unexpected: [${unexpected.join(", ")}].`,
    );
  }
}

async function main() {
  const adapter = new ElephantBlueprintAdapter();
  const compiled = adapter.compile(elephantBlueprint, { zooParity: true });

  const expectedBoneCount = ElephantDefinition.bones.length;
  assert.strictEqual(
    compiled.canonicalSkeleton.bones.length,
    expectedBoneCount,
    `Expected ${expectedBoneCount} canonical bones`,
  );

  const canonicalChains = buildCanonicalElephantChains();
  assert.strictEqual(
    compiled.canonicalChains.length,
    canonicalChains.length,
    `Expected ${canonicalChains.length} canonical chains`,
  );
  const chainNames = canonicalChains.map((c) => c.name);
  const compiledChainNames = compiled.canonicalChains.map((c) => c.name);
  assertArrayEqual(compiledChainNames, chainNames, "Chain names");

  const expectedParts = ELEPHANT_BODY_PARTS.map((p) => p.name);
  const compiledParts = compiled.canonicalBodyParts.map((p) => p.name);
  assert.strictEqual(
    compiledParts.length,
    expectedParts.length,
    `Expected ${expectedParts.length} canonical body parts`,
  );
  assertArrayEqual(compiledParts, expectedParts, "Body part names");

  const logMessages = [];
  const originalInfo = console.info;
  console.info = (...args) => {
    logMessages.push(args.join(" "));
    if (typeof originalInfo === "function") {
      originalInfo(...args);
    }
  };

  try {
    const runtime = createCreatureFromBlueprint(compiled, { useAnatomyV2: true });
    assert(runtime && runtime.mesh, "Runtime did not produce a skinned mesh");
    assert(runtime.partGeometries && runtime.partGeometries.length > 0, "No part geometries were generated");

    const runtimePartNames = runtime.partGeometries.map((p) => p.name);
    assertArrayEqual(runtimePartNames, expectedParts, "Runtime part geometries");
  } finally {
    console.info = originalInfo;
  }

  const legacyLogs = logMessages.filter((msg) => msg.includes("legacy runtime"));
  assert.strictEqual(legacyLogs.length, 0, "Runtime attempted to fall back to legacy blueprint path");

  console.log("Elephant canonical contract matches golden counts and runtime stayed on anatomy V2.");
}

main().catch((err) => {
  console.error("Elephant golden contract test failed", err);
  process.exitCode = 1;
});
