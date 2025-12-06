import StudioElephantLocomotion from "./StudioElephantLocomotion.js";

/**
 * CreatureStudio-local behavior wrapper for the Elephant. It mirrors the
 * responsibilities of the Zoo ElephantBehavior: keep a bone map, expose a
 * state string, and drive locomotion updates per frame.
 */
export class StudioElephantBehavior {
  constructor(skeleton, mesh) {
    this.skeleton = skeleton;
    this.mesh = mesh;
    this.state = "idle";
    this.bonesByName = new Map();
    skeleton?.bones?.forEach((bone) => {
      this.bonesByName.set(bone.name, bone);
    });

    this.locomotion = new StudioElephantLocomotion(this.bonesByName);
  }

  setState(nextState) {
    this.state = nextState || "idle";
    this.locomotion.setState(this.state);
  }

  setEnvironment(env) {
    this.environment = env;
    this.locomotion.setEnvironment(env);
  }

  update(dt) {
    if (this.locomotion) {
      this.locomotion.update(dt);
    }

    if (this.skeleton && typeof this.skeleton.update === "function") {
      this.skeleton.update();
    }

    this.bonesByName.forEach((bone) => {
      bone.updateMatrixWorld(true);
    });

    if (this.mesh) {
      this.mesh.updateMatrixWorld(true);
    }
  }
}

export default StudioElephantBehavior;
