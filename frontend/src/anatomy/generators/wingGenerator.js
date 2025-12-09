// Wing generator stub (runtime-friendly JS version).
//
// Wings are complex membranes anchored along a series of bones.
// This implementation builds a simple skinned membrane suitable for
// previews and runtime smoke tests. A more detailed implementation can
// refine the geometry without changing the runtime contract.

import * as THREE from 'three';
function sampleChainPositions(chain, skeleton) {
  if (!chain || !Array.isArray(chain.boneNames) || !skeleton?.bones) {
    return [];
  }
  return chain.boneNames
    .map((name) => skeleton.bones.find((b) => b.name === name))
    .filter(Boolean)
    .map((bone) => {
      bone.updateMatrixWorld(true);
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(bone.matrixWorld);
      return pos;
    });
}

export const generateWingGeometry = ({ skeleton, chain, options }) => {
  const bones = sampleChainPositions(chain, skeleton);
  if (bones.length < 2) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }

  let chainLength = 0;
  for (let i = 0; i < bones.length - 1; i += 1) {
    chainLength += bones[i].distanceTo(bones[i + 1]);
  }

  const span = (options?.span ?? 1) * chainLength;
  const positions = [];
  const uvs = [];
  const indices = [];
  const boneIndices = [];
  const boneWeights = [];

  const thicknessProfile = (t) => {
    if (typeof options?.thicknessProfile === 'function') {
      return options.thicknessProfile(t);
    }
    return t;
  };

  bones.forEach((pt, i) => {
    const t = bones.length > 1 ? i / (bones.length - 1) : 0;
    const thickness = thicknessProfile(t);
    const offsetVec = new THREE.Vector3(0, -1, 0).multiplyScalar(span * thickness);
    const top = pt.clone();
    const bottom = pt.clone().add(offsetVec);

    positions.push(top.x, top.y, top.z);
    positions.push(bottom.x, bottom.y, bottom.z);

    uvs.push(t, 0);
    uvs.push(t, 1);

    boneIndices.push(i, 0, 0, 0);
    boneIndices.push(i, 0, 0, 0);
    boneWeights.push(1, 0, 0, 0);
    boneWeights.push(1, 0, 0, 0);
  });

  const vertPerBone = 2;
  for (let i = 0; i < bones.length - 1; i += 1) {
    const a = i * vertPerBone;
    const b = a + 1;
    const c = (i + 1) * vertPerBone;
    const d = c + 1;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(boneIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(boneWeights, 4));
  geometry.computeVertexNormals();

  return { geometry, meta: { materialKey: options?.materialKey } };
};
