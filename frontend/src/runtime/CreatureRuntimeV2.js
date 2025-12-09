import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildSkeletonFromBlueprint } from './buildSkeletonFromBlueprint.js';
import { ensureSkinAttributes } from '../anatomy/utils.js';
import { createBehaviorControllerForBlueprint } from '../behavior/BehaviorRegistry.js';

// Import the general anatomy generators implemented in Phase 3 from the
// canonical bodyParts location so all pipelines go through the same files.
import { generateTorsoGeometry } from '../animals/bodyParts/TorsoGenerator.js';
import { generateLimbGeometry } from '../animals/bodyParts/LimbGenerator.js';
import { generateWingGeometry } from '../animals/bodyParts/WingGenerator.js';
import { generateTailGeometry } from '../animals/bodyParts/TailGenerator.js';
import { generateHeadGeometry } from '../animals/bodyParts/HeadGenerator.js';
import { generateNoseGeometry } from '../animals/bodyParts/NoseGenerator.js';
import { generateEarGeometry } from '../animals/bodyParts/EarGenerator.js';

// Import any known radius profile factories. These map human‑readable
// names used in blueprints (e.g. "elephant_heavy") to functions
// returning a radius profile callback. If you add new species‑specific
// profiles, register them here. See zoo_reference Elephant for
// reference implementations.
import { makeElephantTorsoRadiusProfile } from '../animals/Elephant/ElephantTorsoProfile.js';

// Map blueprint radiusProfile names to factory functions. Factories
// return the actual (t, theta, baseRadius) callback used by
// buildSkinnedTubeGeometry. When adding new profiles, update this
// object accordingly.
const V2_RADIUS_PROFILE_FACTORIES = {
  elephant_heavy: () => makeElephantTorsoRadiusProfile(1.0),
};

/*
 * Generator registry mapping blueprint generator keys to implementation functions.
 * These names align with the generator property in BodyPartDefinition entries.
 */
const GENERATORS = {
  torsoGenerator: generateTorsoGeometry,
  limbGenerator: generateLimbGeometry,
  wingGenerator: generateWingGeometry,
  tailGenerator: generateTailGeometry,
  headGenerator: generateHeadGeometry,
  noseGenerator: generateNoseGeometry,
  earGenerator: generateEarGeometry,
};

function normalizeChains(blueprint) {
  const anatomy = blueprint?.anatomy || {};
  const chainDefs = Array.isArray(anatomy.chains) ? anatomy.chains : blueprint?.chainsV2;

  if (!Array.isArray(chainDefs)) {
    return [];
  }

  return chainDefs
    .map((def) => {
      if (!def || typeof def.name !== 'string') {
        return null;
      }
      const bones = Array.isArray(def.boneNames) ? def.boneNames : def.bones;
      if (!Array.isArray(bones) || bones.length === 0) {
        return null;
      }
      const radii = Array.isArray(def.radii) ? [...def.radii] : undefined;
      return {
        name: def.name,
        bones,
        radii,
        profile: def.profile,
        extendTo: def.extendTo,
      };
    })
    .filter(Boolean);
}

function normalizeBodyParts(blueprint) {
  const anatomy = blueprint?.anatomy || {};
  const parts = [];

  if (Array.isArray(anatomy.bodyParts)) {
    parts.push(...anatomy.bodyParts);
  }

  if (anatomy.generators && typeof anatomy.generators === 'object') {
    for (const [chainName, entry] of Object.entries(anatomy.generators)) {
      if (!entry) continue;
      const generatorKey = entry.generator || entry.type;
      if (!generatorKey) continue;
      parts.push({
        name: entry.name || chainName,
        chain: chainName,
        generator: generatorKey,
        options: entry.options,
      });
    }
  }

  if (Array.isArray(blueprint?.bodyPartsV2)) {
    parts.push(...blueprint.bodyPartsV2);
  }

  return parts;
}

function buildMaterialFromDefinition(definition, { fallbackColor = 0x777777 } = {}) {
  const safe = definition || {};

  let color = fallbackColor;
  if (typeof safe.color === 'string') {
    try {
      color = new THREE.Color(safe.color).getHex();
    } catch (_e) {
      // ignore invalid color strings
    }
  }

  let emissive = 0x000000;
  if (typeof safe.emissive === 'string') {
    try {
      emissive = new THREE.Color(safe.emissive).getHex();
    } catch (_e) {
      // ignore invalid color strings
    }
  }

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    roughness: typeof safe.roughness === 'number' ? safe.roughness : 0.68,
    metalness: typeof safe.metallic === 'number' ? safe.metallic : 0.03,
  });

  return material;
}

/**
 * Build a creature from a blueprint using the anatomy V2 pipeline.
 *
 * This function constructs the skeleton, generates each body part via the
 * appropriate generator, merges geometries and creates a skinned mesh.
 * It returns a result similar to buildCreatureFromBlueprint from the
 * legacy runtime. If a blueprint does not define chainsV2 or bodyPartsV2,
 * this function will generate a simple fallback sphere.
 *
 * @param {object} blueprint SpeciesBlueprint to build
 * @param {object} [options] Runtime options; accepts lowPoly, variantSeed, isolatePart
 */
export function buildCreatureFromBlueprintV2(blueprint, options = {}) {
  if (!blueprint) {
    throw new Error('buildCreatureFromBlueprintV2 requires a SpeciesBlueprint');
  }

  // Build the skeleton using the existing helper.
  const skeletonResult = buildSkeletonFromBlueprint(blueprint);
  const { skeleton, bones, bonesByName } = skeletonResult;

  // Ensure world matrices are current so generators can sample bone positions.
  skeletonResult.root.updateWorldMatrix(true, true);

  const geometries = [];
  const partGeometries = [];

  const materialIndices = new Map();
  const materials = [];

  const resolveMaterialIndex = (key) => {
    const safeKey = key || 'surface';
    if (materialIndices.has(safeKey)) {
      return materialIndices.get(safeKey);
    }

    const palette = blueprint.materials || {};
    const materialDef = palette[safeKey] || palette.surface || {};
    const material = buildMaterialFromDefinition(materialDef);
    material.name = `material_${safeKey}`;
    const index = materials.length;
    materials.push(material);
    materialIndices.set(safeKey, index);
    return index;
  };

  // Index chain definitions by name for quick lookup.
  const chainDefs = {};
  const normalizedChains = normalizeChains(blueprint);
  for (const cd of normalizedChains) {
    chainDefs[cd.name] = cd;
  }

  const bodyParts = normalizeBodyParts(blueprint);
  // Determine if we are isolating a part for debug.
  const isolateName = typeof options.isolatePart === 'string' && options.isolatePart.length > 0 ? options.isolatePart : null;

  for (const part of bodyParts) {
    if (!part) continue;
    if (isolateName && part.name !== isolateName) continue;
    const genName = part.generator;
    const chainName = part.chain;
    if (!genName || !chainName) continue;
    const gen = GENERATORS[genName];
    if (typeof gen !== 'function') {
      console.warn('[buildCreatureFromBlueprintV2] No generator registered for', genName);
      continue;
    }
    const chainDef = chainDefs[chainName];
    if (!chainDef || !Array.isArray(chainDef.bones) || chainDef.bones.length === 0) {
      console.warn('[buildCreatureFromBlueprintV2] Missing chain definition for', chainName);
      continue;
    }
    const chainBoneNames = Array.isArray(chainDef.bones) ? chainDef.bones : [];
    // Construct an AnatomyChain-like object expected by generators.
    const anatomyChain = {
      name: chainDef.name,
      boneNames: [...chainBoneNames],
      radii: Array.isArray(chainDef.radii) ? [...chainDef.radii] : undefined,
      profile: undefined,
      extendTo: chainDef.extendTo,
    };
    // Prepare options; clone to avoid mutating blueprint data.
    const opts = part.options ? { ...part.options } : {};
    opts.runtimeOptions = { ...options };
    if (!opts.bones) {
      opts.bones = [...chainBoneNames];
    }
    if (opts.radii === undefined && Array.isArray(chainDef.radii)) {
      opts.radii = [...chainDef.radii];
    }
    if (opts.extendRumpToRearLegs === undefined && chainDef.extendTo !== undefined) {
      opts.extendRumpToRearLegs = chainDef.extendTo;
    }
    // Interpret radiusProfile strings: map to registered factory functions.
    const radiusProfileName = opts.radiusProfile || chainDef.profile;
    if (typeof radiusProfileName === 'string') {
      const factory = V2_RADIUS_PROFILE_FACTORIES[radiusProfileName];
      if (typeof factory === 'function') {
        try {
          opts.radiusProfile = factory();
          anatomyChain.profile = opts.radiusProfile;
        } catch (err) {
          console.warn('[buildCreatureFromBlueprintV2] Failed to instantiate radius profile', radiusProfileName, err);
        }
      }
    }
    // Call the generator.
    let result;
    try {
      result = gen({ skeleton, chain: anatomyChain, options: opts });
    } catch (err) {
      console.error('[buildCreatureFromBlueprintV2] Error generating part', part.name, err);
      continue;
    }
    if (!result || !result.geometry || !(result.geometry instanceof THREE.BufferGeometry)) {
      console.warn('[buildCreatureFromBlueprintV2] Generator did not return geometry for', part.name);
      continue;
    }

    let geometry = result.geometry;

    // If the generator returned an empty BufferGeometry (no index and no
    // position attribute), merging will fail with
    // "BufferGeometryUtils: .mergeGeometries() failed ... The geometry must
    // have either an index or a position attribute". This can happen while
    // generators are still stubbed out. In that case we simply skip the part
    // so that the runtime can fall back to the default sphere geometry below
    // instead of throwing.
    const hasPosition = !!geometry.getAttribute('position');
    const hasIndex = geometry.getIndex() !== null;
    if (!hasPosition && !hasIndex) {
      console.warn(
        '[buildCreatureFromBlueprintV2] Skipping empty geometry for',
        part.name,
        '(no position or index attributes)'
      );
      continue;
    }

    // Apply any meta transform (e.g. ear fan/flatten) to the geometry.
    if (result.meta && result.meta.transform instanceof THREE.Matrix4) {
      geometry = geometry.clone();
      geometry.applyMatrix4(result.meta.transform);
    }

    const defaultBoneIndex = bones.findIndex((b) => b && b.name === chainBoneNames[0]);
    const hasSkinAttributes =
      !!geometry.getAttribute('skinIndex') && !!geometry.getAttribute('skinWeight');

    const preparedGeometry = hasSkinAttributes
      ? geometry.toNonIndexed()
      : ensureSkinAttributes(geometry, { defaultBoneIndex: Math.max(0, defaultBoneIndex), makeNonIndexed: true });

    const materialKey =
      (result.meta && result.meta.materialKey) || opts.materialKey || part.materialKey || 'surface';
    const materialIndex = resolveMaterialIndex(materialKey);

    const drawCount = preparedGeometry.getIndex()
      ? preparedGeometry.getIndex().count
      : preparedGeometry.getAttribute('position').count;
    preparedGeometry.clearGroups();
    preparedGeometry.addGroup(0, drawCount, materialIndex);

    geometries.push(preparedGeometry);
    partGeometries.push({
      name: part.name,
      chain: chainName,
      generator: genName,
      materialKey,
      geometry: preparedGeometry,
    });
  }

  // If no geometry was generated, fall back to a skinned sphere so something appears.
  if (geometries.length === 0) {
    const defaultMaterialIndex = resolveMaterialIndex('surface');
    const fallback = ensureSkinAttributes(new THREE.SphereGeometry(0.45, 14, 12), {
      defaultBoneIndex: 0,
      makeNonIndexed: true,
    });
    const drawCount = fallback.getAttribute('position')?.count || 0;
    fallback.clearGroups();
    fallback.addGroup(0, drawCount, defaultMaterialIndex);
    geometries.push(fallback);
  }

  // Merge all geometries into one, preserving groups for multi-material support.
  const mergedGeometry = mergeGeometries(geometries, true);
  if (!mergedGeometry) {
    throw new Error('[buildCreatureFromBlueprintV2] Failed to merge geometries');
  }
  mergedGeometry.computeBoundingSphere();
  mergedGeometry.computeBoundingBox();

  // Determine if the merged geometry has skin attributes.  If it does, we
  // create a SkinnedMesh and enable skinning on the material.  Otherwise, we
  // create a plain Mesh.  Binding a skeleton to a mesh without skin
  // attributes causes errors like `Cannot read properties of undefined` when
  // applying bone transforms, so we avoid binding in that case.
  const hasSkin = !!mergedGeometry.getAttribute('skinIndex') && !!mergedGeometry.getAttribute('skinWeight');

  const materialList = materials.length > 0 ? materials : [buildMaterialFromDefinition(blueprint.materials?.surface)];
  materialList.forEach((mat) => {
    mat.skinning = hasSkin;
  });
  const material = materialList.length === 1 ? materialList[0] : materialList;

  let mesh;
  if (hasSkin) {
    mesh = new THREE.SkinnedMesh(mergedGeometry, material);
    // Attach the skeleton root group to the mesh so the bones influence the geometry.
    mesh.add(skeletonResult.root);
    mesh.bind(skeleton);
  } else {
    // No skinning data: use a plain mesh and do not bind the skeleton.  We
    // still attach the skeleton root group to the root so it can be
    // displayed in debug mode.
    mesh = new THREE.Mesh(mergedGeometry, material);
  }

  // Compose the root object for this creature.  Always include the mesh and
  // the skeleton's root group (for debug visualisation), but only the mesh
  // will be animated if it has skinning data.
  const root = new THREE.Group();
  root.name = `${(blueprint.meta && blueprint.meta.name) || 'Creature'}_CreatureRootV2`;
  root.add(mesh);
  // Always add the skeleton group for debugging; it will render bones even
  // when the mesh isn't skinned.
  root.add(skeletonResult.root);

  const controller = createBehaviorControllerForBlueprint(blueprint, skeleton, mesh, options);
  const update = controller && typeof controller.update === 'function' ? controller.update.bind(controller) : null;

  return {
    root,
    mesh,
    skeleton,
    bones,
    bonesByName,
    skeletonRoot: skeletonResult.skeletonRoot,
    skeletonRootGroup: skeletonResult.root,
    mergedGeometry,
    partGeometries,
    materials: materialList,
    meta: {},
    controller,
    update,
  };
}
