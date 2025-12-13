import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { generateTorsoGeometry } from "../animals/bodyParts/TorsoGenerator.js";
import { generateNeckGeometry } from "../animals/bodyParts/NeckGenerator.js";
import { generateHeadGeometry } from "../animals/bodyParts/HeadGenerator.js";
import { generateTailGeometry } from "../animals/bodyParts/TailGenerator.js";
import { generateNoseGeometry } from "../animals/bodyParts/NoseGenerator.js";
import { generateLimbGeometry } from "../animals/bodyParts/LimbGenerator.js";
import { generateEarGeometry } from "../animals/bodyParts/EarGenerator.js";
import { ensureSkinAttributes } from "../anatomy/utils.js";
import { makeElephantTorsoRadiusProfile } from "../animals/Elephant/ElephantTorsoProfile.js";
import { createStandardMaterial } from "../renderkit/materialUtils.js";

/**
 * Map generator names used in blueprints to actual geometry generator functions.
 */
const GENERATORS_BY_NAME = {
  torso: generateTorsoGeometry,
  neck: generateNeckGeometry,
  head: generateHeadGeometry,
  tail: generateTailGeometry,
  nose: generateNoseGeometry,
  trunk: generateNoseGeometry,
  limb: generateLimbGeometry,
  ear: generateEarGeometry,
};

const RADIUS_PROFILES = {
  elephant_heavy: () => makeElephantTorsoRadiusProfile(1.0),
};

function buildFallbackGeometry() {
  const fallback = new THREE.SphereGeometry(0.45, 14, 12);
  const preparedFallback = ensureSkinAttributes(fallback, {
    defaultBoneIndex: 0,
    makeNonIndexed: true,
  });
  preparedFallback.computeBoundingSphere();
  preparedFallback.computeBoundingBox();
  return preparedFallback;
}

/**
 * Build a SkinnedMesh from a SpeciesBlueprint and a skeleton result.
 *
 * @param {object} blueprint - SpeciesBlueprint JSON.
 * @param {object} skeletonResult - Result of buildSkeletonFromBlueprint.
 * @param {object} options - Additional runtime options (reserved).
 * @returns {{ mesh: THREE.SkinnedMesh, mergedGeometry: THREE.BufferGeometry, partGeometries: Array }}
 */
export function buildGeometryFromBlueprint(blueprint, skeletonResult, options = {}) {
  if (!skeletonResult || !skeletonResult.bones || !skeletonResult.root) {
    throw new Error("Invalid skeletonResult passed to buildGeometryFromBlueprint.");
  }

  const { root, bones, skeleton, bonesByName } = skeletonResult;

  if (!blueprint || !blueprint.bodyParts || !blueprint.chains) {
    // eslint-disable-next-line no-console
    console.error("[buildGeometryFromBlueprint] Invalid blueprint: missing bodyParts or chains.");
    const fallbackGeometry = ensureSkinAttributes(buildFallbackGeometry(), {
      defaultBoneIndex: 0,
      makeNonIndexed: true,
    });
    const material = createStandardMaterial({ color: 0xaa4444 });
    const mesh = new THREE.SkinnedMesh(fallbackGeometry, material);
    mesh.add(root);
    mesh.bind(skeleton);
    return { mesh, mergedGeometry: fallbackGeometry, partGeometries: [] };
  }

  // Ensure world matrices are up to date before querying world positions.
  root.updateWorldMatrix(true, true);

  const geometries = [];
  const partGeometries = [];
  const sizes = blueprint.sizes || {};
  const bodyParts = blueprint.bodyParts || {};
  const isolatePartName =
    typeof options.isolatePart === "string" && options.isolatePart.length > 0
      ? options.isolatePart
      : null;

  for (const [partName, partRef] of Object.entries(bodyParts)) {
    if (!partRef) {
      continue;
    }

    if (isolatePartName && partName !== isolatePartName) {
      continue;
    }

    const generatorName = partRef.generator;
    const chainName = partRef.chain;
    const hasGenerator = typeof generatorName === "string" && generatorName.length > 0;
    const hasChain = typeof chainName === "string" && chainName.length > 0;

    if (!hasGenerator || !hasChain) {
      const isEmptyPart = Object.keys(partRef).length === 0;
      if (isEmptyPart) {
        continue;
      }
      // Skip incomplete entries.
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] Missing generator or chain for part", partName);
      continue;
    }

    const generator = GENERATORS_BY_NAME[generatorName];
    if (!generator) {
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] No generator registered for", generatorName);
      continue;
    }

    const chainBoneNames = blueprint.chains[chainName] || [];
    if (!Array.isArray(chainBoneNames) || chainBoneNames.length === 0) {
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] No chain bones found for chain", chainName);
      continue;
    }

    const chainBones = [];
    const chainWorldPositions = [];

    for (const boneName of chainBoneNames) {
      const bone = bonesByName.get(boneName);
      if (!bone) {
        // eslint-disable-next-line no-console
        console.warn(
          `[buildGeometryFromBlueprint] Chain '${chainName}' missing bone '${boneName}' referenced by part '${partName}'`
        );
        continue;
      }
      chainBones.push(bone);

      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);
      chainWorldPositions.push(worldPos);
    }

    if (chainBones.length === 0 || chainWorldPositions.length === 0) {
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] Chain has no valid bones for part", partName);
      continue;
    }

    const bodyPartOptions = { ...(partRef.options || {}) };

    if (typeof bodyPartOptions.radiusProfile === "string") {
      const profileFactory = RADIUS_PROFILES[bodyPartOptions.radiusProfile];
      if (typeof profileFactory === "function") {
        bodyPartOptions.radiusProfile = profileFactory({ blueprint, partName });
      }
    }

    const geometry = generator({
      blueprint,
      partName,
      chainName,
      chainBones,
      chainWorldPositions,
      bones: chainBoneNames,
      skeleton,
      sizes,
      bodyPartOptions,
      runtimeOptions: options,
    });

    if (!geometry || !geometry.isBufferGeometry) {
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] Generator for part did not return geometry:", partName);
      continue;
    }

    const preparedGeometry = ensureSkinAttributes(geometry, {
      defaultBoneIndex: bones.indexOf(chainBones[0]),
      makeNonIndexed: true,
    });
    geometries.push(preparedGeometry);
    partGeometries.push({
      name: partName,
      generator: generatorName,
      chain: chainName,
      geometry: preparedGeometry,
    });
  }

  if (geometries.length === 0) {
    // eslint-disable-next-line no-console
    console.error("[buildGeometryFromBlueprint] No geometries were generated; using fallback sphere.");
    geometries.push(
      ensureSkinAttributes(buildFallbackGeometry(), {
        defaultBoneIndex: 0,
        makeNonIndexed: true,
      })
    );
  }

  const mergedGeometry = ensureSkinAttributes(mergeGeometries(geometries, true), {
    defaultBoneIndex: 0,
    makeNonIndexed: true,
  });
  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();

  const surfaceConfig = (blueprint.materials && blueprint.materials.surface) || {};
  const surfaceColorHex = surfaceConfig.color || "#888888";

  const surfaceColor = new THREE.Color(surfaceColorHex);

  const material = createStandardMaterial({
    color: surfaceColor.getHex(),
    roughness:
      typeof surfaceConfig.roughness === "number"
        ? surfaceConfig.roughness
        : 0.85,
    metalness:
      typeof surfaceConfig.metallic === "number"
        ? surfaceConfig.metallic
        : 0.0,
  });

  const mesh = new THREE.SkinnedMesh(mergedGeometry, material);
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";
  mesh.name = `${creatureName}_SkinnedMesh`;

  // Bind the skeleton to the mesh. Attach the skeleton root as a child of the mesh.
  mesh.add(root);
  mesh.bind(skeleton);

  return { mesh, mergedGeometry, partGeometries };
}
