import * as THREE from "three";

export function createGroundPlane({ radius = 6, color = 0x11121b } = {}) {
  const geometry = new THREE.CircleGeometry(radius, 64);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.name = "GroundPlane";
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}
