import * as THREE from "three";

export function createLightingRig(mode = "allAround") {
  const group = new THREE.Group();
  group.name = `Lighting_${mode}`;
  if (mode === "studio") {
    buildStudioLighting(group);
  } else {
    buildAllAroundLighting(group);
  }
  return group;
}

export function disposeLightingRig(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.isLight && obj.shadow?.map) {
      obj.shadow.map.dispose();
    }
  });
}

function buildStudioLighting(group) {
  const keySpot = new THREE.SpotLight(0xffffff, 3.1, 46, Math.PI / 3.7, 0.38, 1);
  keySpot.position.set(7.5, 10.5, 6.5);
  keySpot.castShadow = true;
  keySpot.shadow.mapSize.set(2048, 2048);
  keySpot.target.position.set(0, 1, 0);
  group.add(keySpot);
  group.add(keySpot.target);

  const fillSpot = new THREE.SpotLight(0xe8f0ff, 2.4, 44, Math.PI / 3.6, 0.48, 1);
  fillSpot.position.set(-8.5, 9.5, 5.5);
  fillSpot.castShadow = true;
  fillSpot.shadow.mapSize.set(1024, 1024);
  fillSpot.target.position.set(0, 1, 0);
  group.add(fillSpot);
  group.add(fillSpot.target);

  const rimSpot = new THREE.SpotLight(0xbcd8ff, 1.7, 54, Math.PI / 3.45, 0.3, 1);
  rimSpot.position.set(0, 11.5, -9);
  rimSpot.castShadow = true;
  rimSpot.shadow.mapSize.set(1024, 1024);
  rimSpot.target.position.set(0, 1, 0);
  group.add(rimSpot);
  group.add(rimSpot.target);

  group.add(new THREE.AmbientLight(0xffffff, 1.45));

  const skyFill = new THREE.HemisphereLight(0xf5f8ff, 0x1e2533, 1.1);
  skyFill.position.set(0, 9, 0);
  group.add(skyFill);
}

function buildAllAroundLighting(group) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2c3a52, 6.4);
  hemi.position.set(0, 7, 0);
  group.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 4.65);
  group.add(ambient);

  const north = new THREE.DirectionalLight(0xf5f8ff, 4.85);
  north.position.set(0, 12, 6);
  north.castShadow = true;
  north.shadow.mapSize.set(1024, 1024);
  group.add(north);

  const west = new THREE.DirectionalLight(0xf5f8ff, 4.35);
  west.position.set(-6.5, 9, -3.5);
  group.add(west);

  const east = new THREE.DirectionalLight(0xf5f8ff, 4.25);
  east.position.set(6.5, 9, -3.5);
  group.add(east);
}
