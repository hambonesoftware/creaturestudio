import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildSkeletonFromBlueprint } from './buildSkeletonFromBlueprint.js';

// Import the general anatomy generators implemented in Phase 3 from the
// canonical bodyParts location so all pipelines go through the same files.
// Import TypeScript modules directly; Vite handles `.ts` extensions. Using
// `.js` here would cause rollup to fail because no compiled JS files exist
// in the generators directory.
import { generateTorsoGeometry } from '../animals/bodyParts/v2/torsoGenerator.ts';
import { generateLimbGeometry } from '../animals/bodyParts/v2/limbGenerator.ts';
import { generateWingGeometry } from '../animals/bodyParts/v2/wingGenerator.ts';
import { generateTailGeometry } from '../animals/bodyParts/v2/tailGenerator.ts';
import { generateHeadGeometry } from '../animals/bodyParts/v2/headGenerator.ts';
import { generateNoseGeometry } from '../animals/bodyParts/v2/noseGenerator.ts';
import { generateEarGeometry } from '../animals/bodyParts/v2/earGenerator.ts';

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

  const geometries = [];
  const partGeometries = [];

  // Index chain definitions by name for quick lookup.
  const chainDefs = {};
  if (Array.isArray(blueprint.chainsV2)) {
    for (const cd of blueprint.chainsV2) {
      if (cd && typeof cd.name === 'string') {
        chainDefs[cd.name] = cd;
      }
    }
  }

  const bodyParts = Array.isArray(blueprint.bodyPartsV2) ? blueprint.bodyPartsV2 : [];
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
    // Construct an AnatomyChain-like object expected by generators.
    const anatomyChain = {
      name: chainDef.name,
      boneNames: [...chainDef.bones],
      radii: Array.isArray(chainDef.radii) ? [...chainDef.radii] : undefined,
      profile: undefined,
    };
    // Prepare options; clone to avoid mutating blueprint data.
    const opts = part.options ? { ...part.options } : {};
    // Interpret radiusProfile strings: map to registered factory functions.
    if (typeof opts.radiusProfile === 'string') {
      const name = opts.radiusProfile;
      const factory = V2_RADIUS_PROFILE_FACTORIES[name];
      if (typeof factory === 'function') {
        try {
          opts.radiusProfile = factory();
        } catch (err) {
          console.warn('[buildCreatureFromBlueprintV2] Failed to instantiate radius profile', name, err);
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

    geometries.push(geometry);
    partGeometries.push({ name: part.name, chain: chainName, generator: genName, geometry });
  }

  // If no geometry was generated, fall back to a sphere so something appears.
  if (geometries.length === 0) {
    const fallback = new THREE.SphereGeometry(0.45, 14, 12);
    geometries.push(fallback);
  }

  // Merge all geometries into one. Convert to non-indexed to allow merging with skin attributes.
  const mergedGeometry = mergeGeometries(
    geometries.map((g) => g.toNonIndexed()),
    true
  );
  if (!mergedGeometry) {
    throw new Error('[buildCreatureFromBlueprintV2] Failed to merge geometries');
  }
  mergedGeometry.computeBoundingSphere();
  mergedGeometry.computeBoundingBox();

  // Create a simple material. If blueprint defines surface material, use its color.
  // We do not set the `skinning` property in the constructor because
  // MeshStandardMaterial's constructor does not accept a `skinning` option in
  // some Three.js versions. Instead we assign `material.skinning = true` after
  // instantiation when appropriate.
  let color = 0x777777;
  const surface = blueprint.materials && blueprint.materials.surface;
  if (surface && typeof surface.color === 'string') {
    try {
      color = new THREE.Color(surface.color).getHex();
    } catch (_e) {
      // ignore invalid color strings
    }
  }
  const material = new THREE.MeshStandardMaterial({ color });

  // Determine if the merged geometry has skin attributes.  If it does, we
  // create a SkinnedMesh and enable skinning on the material.  Otherwise, we
  // create a plain Mesh.  Binding a skeleton to a mesh without skin
  // attributes causes errors like `Cannot read properties of undefined` when
  // applying bone transforms, so we avoid binding in that case.
  const hasSkin = !!mergedGeometry.getAttribute('skinIndex') && !!mergedGeometry.getAttribute('skinWeight');

  let mesh;
  if (hasSkin) {
    material.skinning = true;
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
    meta: {},
  };
}
