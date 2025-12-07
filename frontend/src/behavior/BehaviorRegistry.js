import * as THREE from "three";
import StudioElephantBehavior from "../animals/Elephant/StudioElephantBehavior.js";
import { ElephantBehavior } from "../../../Elephant/ElephantBehavior.js";

/**
 * @typedef {import("./CreatureController.ts").CreatureController} CreatureController
 */

/**
 * @typedef {Object} BehaviorFactoryArgs
 * @property {THREE.Skeleton} skeleton
 * @property {THREE.SkinnedMesh} mesh
 * @property {import("../types/SpeciesBlueprint").SpeciesBlueprint} blueprint
 * @property {Object} [options]
 */

/**
 * @callback BehaviorFactory
 * @param {BehaviorFactoryArgs} args
 * @returns {CreatureController | null}
 */

class GenericQuadrupedController {
  constructor(skeleton, mesh, blueprint) {
    this.skeleton = skeleton;
    this.mesh = mesh;
    this.blueprint = blueprint;
    this.time = 0;
    this.state = "idle";
    this.bonesByName = new Map();
    this.restRotations = new Map();
    skeleton?.bones?.forEach((bone) => {
      this.bonesByName.set(bone.name, bone);
      this.restRotations.set(bone.name, bone.rotation.clone());
    });

    this.legChains = this._deriveLegChains(blueprint);
  }

  setState(nextState) {
    this.state = nextState || "idle";
  }

  update(dt) {
    if (!dt) return;
    this.time += dt;

    const speed = this.state === "walk" || this.state === "wander" ? 1.2 : 0.65;
    const cycle = this.time * speed;

    this._applySpineBob(cycle);
    this._applyLegs(cycle);
    this._updateMatrices();
  }

  dispose() {}

  _deriveLegChains(blueprint) {
    const chains = blueprint?.chains || {};
    return [
      { bones: chains.frontLegL || chains.frontLeft, phase: 0.0 },
      { bones: chains.frontLegR || chains.frontRight, phase: 0.5 },
      { bones: chains.backLegL || chains.backLeft, phase: 0.25 },
      { bones: chains.backLegR || chains.backRight, phase: 0.75 },
    ].filter((entry) => Array.isArray(entry.bones) && entry.bones.length > 0);
  }

  _applySpineBob(cycle) {
    const bob = Math.sin(cycle * Math.PI * 2) * 0.035;
    const sway = Math.sin(cycle * Math.PI * 1.3) * 0.025;
    ["spine_base", "spine_mid", "spine_neck", "spine_head"].forEach((name, idx) => {
      const bone = this.bonesByName.get(name);
      if (!bone) return;
      this._restoreRotation(name);
      bone.rotation.x += bob * (1 - idx * 0.25);
      bone.rotation.z += sway * (idx * 0.4);
    });
  }

  _applyLegs(cycle) {
    const stride = 0.4;
    const lift = 0.25;

    this.legChains.forEach(({ bones, phase }) => {
      const t = (cycle + phase) * Math.PI * 2;
      const swing = Math.sin(t);
      const liftAmount = Math.max(0, -Math.sin(t + Math.PI / 2));

      bones.forEach((name, idx) => {
        const bone = this.bonesByName.get(name);
        if (!bone) return;

        this._restoreRotation(name);
        if (idx === 0) {
          bone.rotation.x += -0.1 + swing * stride;
        } else if (idx === bones.length - 1) {
          bone.rotation.x += 0.05 + liftAmount * lift;
        } else {
          bone.rotation.x += -swing * stride * 0.5;
        }
      });
    });
  }

  _restoreRotation(name) {
    const rest = this.restRotations.get(name);
    const bone = this.bonesByName.get(name);
    if (rest && bone) {
      bone.rotation.copy(rest);
    }
  }

  _updateMatrices() {
    this.bonesByName.forEach((bone) => {
      bone.updateMatrixWorld(true);
    });
    if (this.mesh) {
      this.mesh.updateMatrixWorld(true);
    }
    if (this.skeleton && typeof this.skeleton.update === "function") {
      this.skeleton.update();
    }
  }
}

const BEHAVIOR_REGISTRY = {
  /**
   * Default elephant behavior shared between Zoo and CreatureStudio.
   */
  elephant_default: ({ skeleton, mesh, options }) => {
    const variant = options && options.variant === "zoo" ? "zoo" : "studio";
    if (variant === "zoo") {
      return new ElephantBehavior(skeleton, mesh);
    }
    return new StudioElephantBehavior(skeleton, mesh);
  },

  /**
   * Lightweight quadruped walk suitable for templates and previews.
   */
  quadruped_walk: ({ skeleton, mesh, blueprint }) =>
    new GenericQuadrupedController(skeleton, mesh, blueprint),

  /**
   * Explicit null behavior.
   */
  none: () => null,
};

export function createBehaviorControllerForBlueprint(blueprint, skeleton, mesh, options = {}) {
  const behaviorId = blueprint?.behaviorPresets?.gait || "none";
  const factory = BEHAVIOR_REGISTRY[behaviorId] || BEHAVIOR_REGISTRY.none;
  return factory({ blueprint, skeleton, mesh, options }) || null;
}

export { BEHAVIOR_REGISTRY };
