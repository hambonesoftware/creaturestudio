import * as THREE from "three";

/**
 * Build a THREE.Skeleton from a SpeciesBlueprint skeleton definition.
 *
 * Returns an object:
 *   {
 *     root: THREE.Group,
 *     bones: THREE.Bone[],
 *     skeleton: THREE.Skeleton,
 *     bonesByName: Map<string, THREE.Bone>
 *   }
 */
export function buildSkeletonFromBlueprint(blueprint) {
  if (!blueprint || !blueprint.skeleton || !Array.isArray(blueprint.skeleton.bones)) {
    throw new Error("Invalid blueprint: missing skeleton.bones");
  }

  const bones = [];
  const bonesByName = new Map();

  const rootGroup = new THREE.Group();
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";
  rootGroup.name = `${creatureName}_SkeletonRoot`;

  // First pass: create all bones at their local positions.
  for (const boneDef of blueprint.skeleton.bones) {
    const bone = new THREE.Bone();
    bone.name = boneDef.name;

    const pos = boneDef.position || [0, 0, 0];
    const x = typeof pos[0] === "number" ? pos[0] : 0;
    const y = typeof pos[1] === "number" ? pos[1] : 0;
    const z = typeof pos[2] === "number" ? pos[2] : 0;
    bone.position.set(x, y, z);

    bones.push(bone);
    bonesByName.set(boneDef.name, bone);
  }

  // Second pass: hook up parent-child relationships.
  for (const boneDef of blueprint.skeleton.bones) {
    const bone = bonesByName.get(boneDef.name);
    if (!bone) {
      continue;
    }

    const parentName = boneDef.parent;
    const hasParent = typeof parentName === "string" && parentName.length > 0;

    if (!hasParent || parentName === "root" || !bonesByName.has(parentName)) {
      // Attach to skeleton root group.
      rootGroup.add(bone);
    } else {
      const parentBone = bonesByName.get(parentName);
      parentBone.add(bone);
    }
  }

  const skeleton = new THREE.Skeleton(bones);

  const skeletonRootName = blueprint.skeleton.root;
  const skeletonRoot =
    (typeof skeletonRootName === "string" && bonesByName.get(skeletonRootName)) ||
    bones[0] ||
    null;

  return {
    root: rootGroup,
    bones,
    skeleton,
    bonesByName,
    skeletonRoot,
  };
}
