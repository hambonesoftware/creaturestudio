import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function normalizeGeneratorParams(arg1, arg2 = {}) {
  if (arg1 && arg1.isSkeleton) {
    return { skeleton: arg1, ...arg2 };
  }

  if (arg1 && arg1.skeleton) {
    return { ...arg1, ...arg2 };
  }

  if (arg1 && Array.isArray(arg1.bones)) {
    return { skeleton: arg1, ...arg2 };
  }

  return arg1 || {};
}

export function getBoneByName(skeleton, name) {
  if (!skeleton || !Array.isArray(skeleton.bones)) {
    return null;
  }
  return skeleton.bones.find((bone) => bone.name === name) || null;
}

export function sampleWorldPositionsFromBones(skeleton, boneNames = []) {
  if (!skeleton || !Array.isArray(boneNames) || boneNames.length === 0) {
    return [];
  }

  skeleton.bones.forEach((bone) => bone.updateMatrixWorld(true));

  const positions = [];
  for (const name of boneNames) {
    const bone = getBoneByName(skeleton, name);
    if (!bone) {
      continue;
    }
    const pos = new THREE.Vector3();
    bone.getWorldPosition(pos);
    positions.push(pos);
  }
  return positions;
}

export function resolveChainPositions(params) {
  const { skeleton, bones, chainBones, chainWorldPositions } = params;

  if (Array.isArray(chainWorldPositions) && chainWorldPositions.length > 0) {
    return chainWorldPositions.map((p) => p.clone());
  }

  if (Array.isArray(chainBones) && chainBones.length > 0) {
    return chainBones.map((bone) => {
      const pos = new THREE.Vector3();
      bone.getWorldPosition(pos);
      return pos;
    });
  }

  const boneNames = bones || [];
  return sampleWorldPositionsFromBones(skeleton, boneNames);
}

export function resolveBoneNames(params) {
  if (Array.isArray(params?.bones)) {
    return params.bones;
  }
  if (Array.isArray(params?.chainBones) && params.chainBones.length > 0) {
    return params.chainBones.map((bone) => bone.name);
  }
  return [];
}

export function expandRadii(radii, count, fallback = 0.25) {
  if (!Array.isArray(radii) || radii.length === 0) {
    return new Array(count).fill(fallback);
  }

  const result = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.min(i, radii.length - 1);
    result.push(radii[idx]);
  }
  return result;
}

export function makeFrames(points) {
  const tangents = [];
  const normals = [];
  const binormals = [];

  for (let i = 0; i < points.length; i += 1) {
    const prev = points[i - 1] || points[i];
    const next = points[i + 1] || points[i];
    const tangent = new THREE.Vector3().subVectors(next, prev);
    if (tangent.lengthSq() < 1e-8) {
      tangent.set(0, 1, 0);
    } else {
      tangent.normalize();
    }

    tangents.push(tangent);

    let normal = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(tangent)) > 0.95) {
      normal.set(1, 0, 0);
    }

    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    normals.push(normal);
    binormals.push(binormal);
  }

  return { tangents, normals, binormals };
}

export function buildSkinnedTubeGeometry(options) {
  const {
    points,
    radii,
    sides = 16,
    radiusProfile,
    capStart = false,
    capEnd = false,
    skeleton,
    boneNames = [],
    weldTolerance = 0,
  } = options;

  if (!points || points.length < 2) {
    return new THREE.CylinderGeometry(0.25, 0.25, 1, Math.max(6, sides));
  }

  const ringCount = points.length;
  const safeSides = Math.max(3, sides);
  const positions = [];
  const uvs = [];
  const indices = [];

  const frames = makeFrames(points);

  const boneCount = boneNames.length;
  const skinIndices = [];
  const skinWeights = [];

  for (let i = 0; i < ringCount; i += 1) {
    const center = points[i];
    const t = ringCount === 1 ? 0 : i / (ringCount - 1);
    const tangent = frames.tangents[i];
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const baseRadius = radii[Math.min(i, radii.length - 1)] || radii[0] || 0.25;

    for (let j = 0; j < safeSides; j += 1) {
      const theta = (j / safeSides) * Math.PI * 2;
      const profileRadius =
        typeof radiusProfile === "function"
          ? radiusProfile(t, theta, baseRadius)
          : baseRadius;

      const radial = new THREE.Vector3()
        .copy(normal)
        .multiplyScalar(Math.cos(theta) * profileRadius)
        .addScaledVector(binormal, Math.sin(theta) * profileRadius);

      const vertex = new THREE.Vector3().addVectors(center, radial);
      positions.push(vertex.x, vertex.y, vertex.z);

      uvs.push(j / safeSides, t);

      const mapped =
        boneCount > 1
          ? t * (boneCount - 1)
          : 0;
      const boneIndex0 = Math.max(0, Math.min(boneCount - 1, Math.floor(mapped)));
      const boneIndex1 = Math.max(0, Math.min(boneCount - 1, boneIndex0 + 1));
      const weight1 = mapped - Math.floor(mapped);
      const weight0 = 1 - weight1;

      skinIndices.push(boneIndex0, boneIndex1, 0, 0);
      skinWeights.push(weight0, weight1, 0, 0);
    }
  }

  for (let ring = 0; ring < ringCount - 1; ring += 1) {
    const ringStart = ring * safeSides;
    const nextRingStart = (ring + 1) * safeSides;
    for (let side = 0; side < safeSides; side += 1) {
      const a = ringStart + side;
      const b = ringStart + ((side + 1) % safeSides);
      const c = nextRingStart + side;
      const d = nextRingStart + ((side + 1) % safeSides);

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  let geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndices, 4)
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );

  if (capStart) {
    const centerIndex = geometry.getAttribute("position").count;
    const firstRingStart = 0;
    const center = points[0];

    const posArray = Array.from(geometry.getAttribute("position").array);
    posArray.push(center.x, center.y, center.z);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(posArray, 3)
    );

    const uvArray = Array.from(geometry.getAttribute("uv").array);
    uvArray.push(0.5, 0);
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvArray, 2));

    const skinIdxArray = Array.from(geometry.getAttribute("skinIndex").array);
    skinIdxArray.push(0, 0, 0, 0);
    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIdxArray, 4)
    );
    const skinWArray = Array.from(geometry.getAttribute("skinWeight").array);
    skinWArray.push(1, 0, 0, 0);
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWArray, 4)
    );

    for (let side = 0; side < safeSides; side += 1) {
      const a = centerIndex;
      const b = firstRingStart + side;
      const c = firstRingStart + ((side + 1) % safeSides);
      indices.push(a, b, c);
    }
  }

  if (capEnd) {
    const posAttr = geometry.getAttribute("position");
    const endCenterIndex = posAttr.count;
    const lastRingStart = (ringCount - 1) * safeSides;
    const center = points[points.length - 1];

    const posArray = Array.from(posAttr.array);
    posArray.push(center.x, center.y, center.z);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(posArray, 3)
    );

    const uvArray = Array.from(geometry.getAttribute("uv").array);
    uvArray.push(0.5, 1);
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvArray, 2));

    const skinIdxArray = Array.from(geometry.getAttribute("skinIndex").array);
    skinIdxArray.push(boneNames.length - 1, boneNames.length - 1, 0, 0);
    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIdxArray, 4)
    );
    const skinWArray = Array.from(geometry.getAttribute("skinWeight").array);
    skinWArray.push(1, 0, 0, 0);
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWArray, 4)
    );

    for (let side = 0; side < safeSides; side += 1) {
      const a = lastRingStart + side;
      const b = lastRingStart + ((side + 1) % safeSides);
      const c = endCenterIndex;
      indices.push(a, b, c);
    }
  }

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  if (weldTolerance && weldTolerance > 0) {
    geometry = mergeVertices(geometry, weldTolerance);
  }

  return geometry;
}

export function buildSegmentedCylinders(options) {
  const { points, radii, sides = 10, boneNames = [] } = options;

  if (!points || points.length < 2) {
    return new THREE.CylinderGeometry(0.15, 0.15, 1, Math.max(6, sides));
  }

  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = Math.max(dir.length(), 0.0001);
    const radiusTop = radii[Math.min(i + 1, radii.length - 1)] || radii[0];
    const radiusBottom = radii[Math.min(i, radii.length - 1)] || radii[0];
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      length,
      Math.max(3, sides)
    );

    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      up,
      dir.clone().normalize()
    );
    geometry.applyQuaternion(quaternion);
    const midpoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    geometry.translate(midpoint.x, midpoint.y, midpoint.z);

    const vertexCount = geometry.getAttribute("position").count;
    const indicesArray = new Uint16Array(vertexCount * 4);
    const weightsArray = new Float32Array(vertexCount * 4);

    const boneIndex0 = Math.max(0, Math.min(boneNames.length - 1, i));
    const boneIndex1 = Math.max(0, Math.min(boneNames.length - 1, i + 1));
    const dirNorm = dir.clone().normalize();

    for (let v = 0; v < vertexCount; v += 1) {
      const position = new THREE.Vector3();
      position.fromBufferAttribute(geometry.getAttribute("position"), v);
      const t = Math.max(
        0,
        Math.min(
          1,
          dir.length() > 1e-5
            ? position.clone().sub(start).dot(dirNorm) / length
            : 0
        )
      );

      indicesArray[v * 4] = boneIndex0;
      indicesArray[v * 4 + 1] = boneIndex1;
      weightsArray[v * 4] = 1 - t;
      weightsArray[v * 4 + 1] = t;
    }

    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(indicesArray, 4)
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(weightsArray, 4)
    );

    segments.push(geometry);
  }

  const merged = mergeGeometries(segments, true);
  merged.computeVertexNormals();
  return merged;
}

export function ensureSkinAttributes(geometry, options = {}) {
  if (!geometry || !geometry.isBufferGeometry) {
    return geometry;
  }

  const {
    defaultBoneIndex = 0,
    makeNonIndexed = false,
    ensureNormals = true,
    ensureUVs = true,
  } = options;

  let geo = geometry;

  const getCount = () => geo.getAttribute("position")?.count || 0;
  const ensureAttribute = (name, factory) => {
    if (!geo.getAttribute(name)) {
      geo.setAttribute(name, factory(getCount()));
    }
  };

  if (ensureNormals && !geo.getAttribute("normal") && geo.getAttribute("position")) {
    geo.computeVertexNormals();
  }

  if (ensureUVs) {
    ensureAttribute(
      "uv",
      (count) => new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2)
    );
  }

  ensureAttribute("skinIndex", (count) => {
    const indices = new Uint16Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      indices[i * 4] = defaultBoneIndex;
    }
    return new THREE.Uint16BufferAttribute(indices, 4);
  });

  ensureAttribute("skinWeight", (count) => {
    const weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      weights[i * 4] = 1;
    }
    return new THREE.Float32BufferAttribute(weights, 4);
  });

  if (makeNonIndexed && geo.index) {
    geo = geo.toNonIndexed();
  }

  geo.morphAttributes = geo.morphAttributes || {};
  return geo;
}
