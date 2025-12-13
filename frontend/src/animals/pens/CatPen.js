import * as THREE from "three";
import { createStandardMaterial } from "../../renderkit/materialUtils.js";

const DEFAULT_OPTIONS = {
  color: 0x7788aa,
};

export class CatPen {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async build() {
    const group = new THREE.Group();
    group.name = "CatPen";

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(12, 36),
      createStandardMaterial({ color: 0x4a4a4a, roughness: 0.85, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "CatPenGround";
    group.add(ground);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    ambient.name = "CatPenAmbient";
    group.add(ambient);

    const sun = new THREE.DirectionalLight(0xffefd5, 0.9);
    sun.position.set(4, 6, 3);
    sun.name = "CatPenSun";
    group.add(sun);

    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 2),
      createStandardMaterial({ color: this.options.color })
    );
    placeholder.position.set(0, 0.6, 0);
    placeholder.castShadow = true;
    placeholder.receiveShadow = true;
    placeholder.name = "CatPlaceholder";
    group.add(placeholder);

    return {
      key: "cat",
      displayRoot: group,
      root: group,
      update: () => {},
      disableDefaultGround: true,
      disableDefaultLighting: true,
    };
  }
}
