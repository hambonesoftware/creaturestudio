import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { generateTorsoGeometry } from "../animals/bodyParts/TorsoGenerator.js";
import { generateNeckGeometry } from "../animals/bodyParts/NeckGenerator.js";
import { generateHeadGeometry } from "../animals/bodyParts/HeadGenerator.js";
import { generateTailGeometry } from "../animals/bodyParts/TailGenerator.js";
import { generateNoseGeometry } from "../animals/bodyParts/NoseGenerator.js";
import { generateLimbGeometry } from "../animals/bodyParts/LimbGenerator.js";
import { generateEarGeometry } from "../animals/bodyParts/EarGenerator.js";

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

/**
 * Build a SkinnedMesh from a SpeciesBlueprint and a skeleton result.
 *
 * @param {object} blueprint - SpeciesBlueprint JSON.
 * @param {object} skeletonResult - Result of buildSkeletonFromBlueprint.
 * @param {object} options - Additional runtime options (reserved).
 * @returns {{ mesh: THREE.SkinnedMesh }}
 */
export function buildGeometryFromBlueprint(blueprint, skeletonResult, options = {}) {
  if (!blueprint || !blueprint.bodyParts || !blueprint.chains) {
    throw new Error("Invalid blueprint: missing bodyParts or chains.");
  }

  if (!skeletonResult || !skeletonResult.bones || !skeletonResult.root) {
    throw new Error("Invalid skeletonResult passed to buildGeometryFromBlueprint.");
  }

  const { root, bones, skeleton, bonesByName } = skeletonResult;

  // Ensure world matrices are up to date before querying world positions.
  root.updateWorldMatrix(true, true);

  const geometries = [];
  const sizes = blueprint.sizes || {};
  const bodyParts = blueprint.bodyParts || {};

  for (const [partName, partRef] of Object.entries(bodyParts)) {
    if (!partRef) {
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

    const geometry = generator({
      blueprint,
      partName,
      chainName,
      chainBones,
      chainWorldPositions,
      sizes,
      bodyPartOptions: partRef.options || {},
    });

    if (!geometry || !geometry.isBufferGeometry) {
      // eslint-disable-next-line no-console
      console.warn("[buildGeometryFromBlueprint] Generator for part did not return geometry:", partName);
      continue;
    }

    geometries.push(geometry);
  }

  if (geometries.length === 0) {
    throw new Error("No geometries were generated for this blueprint.");
  }

  const mergedGeometry = mergeGeometries(geometries, true);
  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();

  // Attach very simple skin data: every vertex bound to bone index 0 with weight 1.
  const positionAttr = mergedGeometry.getAttribute("position");
  const vertexCount = positionAttr ? positionAttr.count : 0;

  if (vertexCount > 0) {
    const skinIndices = new Uint16Array(vertexCount * 4);
    const skinWeights = new Float32Array(vertexCount * 4);

    for (let i = 0; i < vertexCount; i += 1) {
      const baseIndex = i * 4;
      skinIndices[baseIndex + 0] = 0;
      skinIndices[baseIndex + 1] = 0;
      skinIndices[baseIndex + 2] = 0;
      skinIndices[baseIndex + 3] = 0;

      skinWeights[baseIndex + 0] = 1.0;
      skinWeights[baseIndex + 1] = 0.0;
      skinWeights[baseIndex + 2] = 0.0;
      skinWeights[baseIndex + 3] = 0.0;
    }

    mergedGeometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIndices, 4)
    );
    mergedGeometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWeights, 4)
    );
  }

  const surfaceConfig = (blueprint.materials && blueprint.materials.surface) || {};
  const surfaceColorHex = surfaceConfig.color || "#888888";

  const surfaceColor = new THREE.Color(surfaceColorHex);

  const material = new THREE.MeshStandardMaterial({
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

  return { mesh };
}
