import * as THREE from "three";
import ElephantBlueprint from "../../blueprints/ElephantBlueprint.json";
import { ElephantFactory } from "../Elephant/ElephantFactory.js";

const DEFAULT_OPTIONS = {
  scale: 0.75,
  lowPoly: false,
};

export class ElephantPen {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async build() {
    const group = new THREE.Group();
    group.name = "ElephantPen";

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshStandardMaterial({ color: 0x7a6d4d, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "ElephantPenGround";
    group.add(ground);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x708070, 0.9);
    hemi.name = "ElephantPenHemi";
    group.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.22);
    ambient.name = "ElephantPenAmbient";
    group.add(ambient);

    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 2.5, 0);
    lightTarget.name = "ElephantPenLightTarget";
    group.add(lightTarget);

    const sun = new THREE.DirectionalLight(0xfff1d0, 1.1);
    sun.position.set(-6, 10, 4);
    sun.target = lightTarget;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.name = "ElephantPenSun";
    group.add(sun);

    const fill = new THREE.DirectionalLight(0xddeeff, 0.35);
    fill.position.set(5, 4, -5);
    fill.target = lightTarget;
    fill.name = "ElephantPenFill";
    group.add(fill);

    const factory = new ElephantFactory();
    const elephantRuntime = factory.createFromBlueprint(ElephantBlueprint, {
      zooParity: true,
      runtimeOptions: { lowPoly: !!this.options.lowPoly, scale: this.options.scale },
    });

    const elephantRoot = elephantRuntime.root || elephantRuntime.mesh || elephantRuntime.displayRoot;
    if (elephantRoot) {
      elephantRoot.name = elephantRoot.name || "ElephantCreature";
      elephantRoot.position.set(-1.8, 0, 0.6);
      group.add(elephantRoot);
    }

    return {
      key: "elephant",
      displayRoot: group,
      root: group,
      update: (dt) => {
        if (elephantRuntime && typeof elephantRuntime.update === "function") {
          elephantRuntime.update(dt);
        }
      },
      disableDefaultGround: true,
      disableDefaultLighting: true,
      creatureRuntime: elephantRuntime,
    };
  }
}
