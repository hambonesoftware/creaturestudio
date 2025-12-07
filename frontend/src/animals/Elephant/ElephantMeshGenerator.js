import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { generateTorsoGeometry } from "../../anatomy/TorsoGenerator.js";
import { generateNeckGeometry } from "../../anatomy/NeckGenerator.js";
import { generateHeadGeometry } from "../../anatomy/HeadGenerator.js";
import { generateTailGeometry } from "../../anatomy/TailGenerator.js";
import { generateNoseGeometry } from "../../anatomy/NoseGenerator.js";
import { generateLimbGeometry } from "../../anatomy/LimbGenerator.js";
import { ensureSkinAttributes, getBoneByName } from "../../anatomy/utils.js";

import { ElephantDefinition } from "./ElephantDefinition.js";
import { createElephantSkinMaterial } from "./ElephantSkinMaterial.js";
import { makeElephantTorsoRadiusProfile } from "./ElephantTorsoProfile.js";

function makeEarTransformMatrix(skeleton, earRootName) {
  const earRootBone = getBoneByName(skeleton, earRootName);
  if (!earRootBone) {
    return new THREE.Matrix4();
  }

  const pivot = new THREE.Vector3().setFromMatrixPosition(earRootBone.matrixWorld);

  const toOrigin = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  const fromOrigin = new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);

  const baseAngle = Math.PI / 4;
  const isLeft = earRootName.toLowerCase().includes("left");
  const tiltAngle = isLeft ? baseAngle : -baseAngle;

  const rotate = new THREE.Matrix4().makeRotationZ(tiltAngle);
  const flatten = new THREE.Matrix4().makeScale(1.5, 1.0, 0.18);

  const m = new THREE.Matrix4();
  m.copy(fromOrigin);
  m.multiply(rotate);
  m.multiply(flatten);
  m.multiply(toOrigin);

  return m;
}

export function generateElephantMesh(skeletonResult, options = {}) {
  const { bones, skeleton, bonesByName, root: skeletonRootGroup } = skeletonResult;
  skeletonRootGroup.updateWorldMatrix(true, true);
  bones.forEach((bone) => bone.updateMatrixWorld(true));

  const lowPoly = options.lowPoly === true || options.runtimeOptions?.lowPoly === true;

  const lowPolyTorsoSegments =
    typeof options.lowPolyTorsoSegments === "number" && options.lowPolyTorsoSegments >= 3
      ? options.lowPolyTorsoSegments
      : 9;

  const lowPolyTorsoWeldTolerance =
    typeof options.lowPolyTorsoWeldTolerance === "number" && options.lowPolyTorsoWeldTolerance > 0
      ? options.lowPolyTorsoWeldTolerance
      : 0.02;

  const headSidesLowPoly =
    typeof options.lowPolyHeadSides === "number" && options.lowPolyHeadSides >= 3
      ? options.lowPolyHeadSides
      : 12;

  const trunkSidesLowPoly =
    typeof options.lowPolyTrunkSides === "number" && options.lowPolyTrunkSides >= 3
      ? options.lowPolyTrunkSides
      : 10;

  const neckSidesLowPoly =
    typeof options.lowPolyNeckSides === "number" && options.lowPolyNeckSides >= 3
      ? options.lowPolyNeckSides
      : 12;

  const tuskSidesLowPoly =
    typeof options.lowPolyTuskSides === "number" && options.lowPolyTuskSides >= 3
      ? options.lowPolyTuskSides
      : 8;

  const earSidesLowPoly =
    typeof options.lowPolyEarSides === "number" && options.lowPolyEarSides >= 3
      ? options.lowPolyEarSides
      : 10;

  const tailSidesLowPoly =
    typeof options.lowPolyTailSides === "number" && options.lowPolyTailSides >= 3
      ? options.lowPolyTailSides
      : 8;

  const legSidesLowPoly =
    typeof options.lowPolyLegSides === "number" && options.lowPolyLegSides >= 3
      ? options.lowPolyLegSides
      : 9;

  const seed = typeof options.variantSeed === "number" ? options.variantSeed : 0.5;
  const random01 = (s) => Math.abs(Math.sin(s * 43758.5453)) % 1;
  const variantFactor = random01(seed);
  const legScale = 1.0 + (variantFactor - 0.5) * 0.2;
  const tuskScale = 1.0 + (variantFactor - 0.5) * 0.3;
  const headScale = 1.0 + (0.5 - variantFactor) * 0.15;
  const headRadius = 0.95 * headScale;
  const torsoRadiusProfile = makeElephantTorsoRadiusProfile(headScale);

  const rearLegRadii = {
    back_left_upper: 0.5 * legScale,
    back_right_upper: 0.5 * legScale,
    back_left_lower: 0.42 * legScale,
    back_right_lower: 0.42 * legScale,
    back_left_foot: 0.44 * legScale,
    back_right_foot: 0.44 * legScale,
  };

  const torsoGeometry = generateTorsoGeometry(skeleton, {
    bones: ["spine_base", "spine_mid", "spine_neck"],
    radii: [1.15 * headScale, 1.35, 1.0 * headScale],
    sides: 28,
    radiusProfile: torsoRadiusProfile,
    rumpBulgeDepth: 0.4,
    extendRumpToRearLegs: {
      bones: [
        "back_left_foot",
        "back_right_foot",
        "back_left_lower",
        "back_right_lower",
        "back_left_upper",
        "back_right_upper",
      ],
      extraMargin: 0.05,
      boneRadii: rearLegRadii,
    },
    lowPoly,
    lowPolySegments: lowPoly ? lowPolyTorsoSegments : undefined,
    lowPolyWeldTolerance: lowPoly ? lowPolyTorsoWeldTolerance : 0,
  });

  const neckBaseRadius = 0.95 * headScale;
  const neckRadiusAtHead = 0.4 * (0.95 * headScale);
  const neckGeometry = generateNeckGeometry(skeleton, {
    bones: ["spine_neck", "spine_head"],
    radii: [neckBaseRadius, neckRadiusAtHead],
    sides: lowPoly ? Math.max(neckSidesLowPoly, 10) : 18,
    capBase: true,
    capEnd: true,
  });

  const tuskLeft = getBoneByName(skeleton, "tusk_left");
  const tuskRight = getBoneByName(skeleton, "tusk_right");
  let tuskSeparation = 0.6;
  if (tuskLeft && tuskRight) {
    const leftPos = new THREE.Vector3().setFromMatrixPosition(tuskLeft.matrixWorld);
    const rightPos = new THREE.Vector3().setFromMatrixPosition(tuskRight.matrixWorld);
    tuskSeparation = leftPos.distanceTo(rightPos);
  }

  const maxTrunkRadius = (tuskSeparation * 0.8) * 0.5;
  const maxTrunkRadiusByHead = headRadius * 0.6;

  const defaultTrunkBaseRadius = 0.46;
  const defaultTrunkMidRadius =
    typeof options.trunkMidRadius === "number" ? options.trunkMidRadius : 0.07;
  const defaultTrunkTipRadius = 0.26;

  const trunkBaseRadius = Math.min(defaultTrunkBaseRadius, maxTrunkRadius, maxTrunkRadiusByHead);
  const trunkMidRadius = Math.min(defaultTrunkMidRadius, maxTrunkRadius, maxTrunkRadiusByHead);
  const trunkTipRadius = Math.min(defaultTrunkTipRadius, maxTrunkRadius, maxTrunkRadiusByHead);

  const trunkRootBoneName = getBoneByName(skeleton, "trunk_anchor")
    ? "trunk_anchor"
    : getBoneByName(skeleton, "trunk_root")
      ? "trunk_root"
      : "trunk_root";

  const headGeometry = generateHeadGeometry(skeleton, {
    parentBone: "head",
    radius: headRadius,
    elongation: 1.0,
    detail: lowPoly ? 0 : 1,
  });

  const trunkGeometry = generateNoseGeometry(skeleton, {
    bones: ["trunk_base", "trunk_mid1", "trunk_mid2", "trunk_tip"],
    rootBone: trunkRootBoneName,
    sides: lowPoly ? Math.max(trunkSidesLowPoly, 12) : 24,
    baseRadius: trunkBaseRadius,
    midRadius: trunkMidRadius,
    tipRadius: trunkTipRadius,
    partName: "trunk",
    runtimeOptions: { lowPoly },
  });

  const leftTusk = generateNoseGeometry(skeleton, {
    rootBone: "head_tip_3",
    bones: ["tusk_left", "tusk_left_tip"],
    sides: lowPoly ? tuskSidesLowPoly : 16,
    baseRadius: 0.12,
    tipRadius: 0.02,
    lengthScale: tuskScale,
    partName: "tusk_left",
    runtimeOptions: { lowPoly },
  });

  const rightTusk = generateNoseGeometry(skeleton, {
    rootBone: "head_tip_4",
    bones: ["tusk_right", "tusk_right_tip"],
    sides: lowPoly ? tuskSidesLowPoly : 16,
    baseRadius: 0.12,
    tipRadius: 0.02,
    lengthScale: tuskScale,
    partName: "tusk_right",
    runtimeOptions: { lowPoly },
  });

  const leftEar = generateLimbGeometry(skeleton, {
    bones: ["ear_left", "ear_left_tip"],
    radii: [0.65, 0.35],
    sides: lowPoly ? earSidesLowPoly : 20,
    partName: "ear_left",
  });

  const rightEar = generateLimbGeometry(skeleton, {
    bones: ["ear_right", "ear_right_tip"],
    radii: [0.65, 0.35],
    sides: lowPoly ? earSidesLowPoly : 20,
    partName: "ear_right",
  });

  const leftEarMatrix = makeEarTransformMatrix(skeleton, "ear_left");
  const rightEarMatrix = makeEarTransformMatrix(skeleton, "ear_right");
  leftEar.applyMatrix4(leftEarMatrix);
  rightEar.applyMatrix4(rightEarMatrix);
  leftEar.computeVertexNormals();
  rightEar.computeVertexNormals();

  const tailGeometry = generateTailGeometry(skeleton, {
    bones: ["tail_base", "tail_mid", "tail_tip"],
    sides: lowPoly ? tailSidesLowPoly : 14,
    baseRadius: 0.15,
    tipRadius: 0.05,
    partName: "tail",
    runtimeOptions: { lowPoly },
  });

  const legConfig = {
    sides: lowPoly ? legSidesLowPoly : 20,
    runtimeOptions: { lowPoly },
  };

  const fl = generateLimbGeometry(skeleton, {
    bones: ["front_left_collarbone", "front_left_upper", "front_left_lower", "front_left_foot"],
    radii: [0.5 * legScale, 0.45 * legScale, 0.4 * legScale, 0.38 * legScale, 0.43 * legScale],
    partName: "front_left_leg",
    ...legConfig,
  });

  const fr = generateLimbGeometry(skeleton, {
    bones: ["front_right_collarbone", "front_right_upper", "front_right_lower", "front_right_foot"],
    radii: [0.5 * legScale, 0.45 * legScale, 0.4 * legScale, 0.38 * legScale, 0.43 * legScale],
    partName: "front_right_leg",
    ...legConfig,
  });

  const bl = generateLimbGeometry(skeleton, {
    bones: ["back_left_pelvis", "back_left_upper", "back_left_lower", "back_left_foot"],
    radii: [0.55 * legScale, 0.5 * legScale, 0.42 * legScale, 0.38 * legScale, 0.44 * legScale],
    partName: "back_left_leg",
    ...legConfig,
  });

  const br = generateLimbGeometry(skeleton, {
    bones: ["back_right_pelvis", "back_right_upper", "back_right_lower", "back_right_foot"],
    radii: [0.55 * legScale, 0.5 * legScale, 0.42 * legScale, 0.38 * legScale, 0.44 * legScale],
    partName: "back_right_leg",
    ...legConfig,
  });

  const mergedGeometry = mergeGeometries(
    [
      torsoGeometry,
      neckGeometry,
      headGeometry,
      trunkGeometry,
      leftTusk,
      rightTusk,
      leftEar,
      rightEar,
      tailGeometry,
      fl,
      fr,
      bl,
      br,
    ].map((geometry) => ensureSkinAttributes(geometry, { makeNonIndexed: true })),
    false
  );

  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();

  const skinMaterial = createElephantSkinMaterial({ flatShading: lowPoly });
  const mesh = new THREE.SkinnedMesh(mergedGeometry, skinMaterial);
  mesh.name = `${ElephantDefinition.name}_SkinnedMesh`;
  mesh.add(skeletonRootGroup);
  mesh.bind(skeleton);

  return { mesh, mergedGeometry };
}

export default generateElephantMesh;
