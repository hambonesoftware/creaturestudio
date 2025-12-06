import * as THREE from "three";

function cloneEuler(euler) {
  return new THREE.Euler(euler.x, euler.y, euler.z, euler.order);
}

/**
 * Lightweight locomotion controller that mirrors the cadence and sway of the
 * reference Zoo elephant. This focuses on heavy footfalls, trunk sway, and ear
 * fans so authored skeletons preview correctly inside CreatureStudio.
 */
export class StudioElephantLocomotion {
  constructor(bonesByName) {
    this.bonesByName = bonesByName;
    this.state = "idle";
    this.time = 0;
    this.stepFrequency = 0.7; // steps per second

    this.restRotations = new Map();
    this.restPositions = new Map();
    bonesByName.forEach((bone, name) => {
      this.restRotations.set(name, cloneEuler(bone.rotation));
      this.restPositions.set(name, bone.position.clone());
    });
  }

  setState(nextState) {
    this.state = nextState || "idle";
  }

  setEnvironment(env) {
    this.environment = env;
  }

  update(dt) {
    if (!dt) return;
    this.time += dt;
    const gaitSpeed = this.state === "wander" || this.state === "walk" ? 1.1 : 0.6;
    const cycle = this.time * this.stepFrequency * gaitSpeed;

    this._applySpineBreathe(cycle);
    this._applyLegCycle(cycle);
    this._applyHeadAndTrunk(cycle);
    this._applyEars(cycle);
    this._applyTail(cycle);
  }

  _restoreRotation(name) {
    const bone = this.bonesByName.get(name);
    const rest = this.restRotations.get(name);
    if (bone && rest) {
      bone.rotation.copy(rest);
    }
  }

  _applySpineBreathe(cycle) {
    const base = Math.sin(cycle * Math.PI * 2) * 0.04;
    const bob = Math.sin(cycle * Math.PI * 4) * 0.025;
    ["spine_mid", "spine_neck", "spine_head"].forEach((name, idx) => {
      this._restoreRotation(name);
      const bone = this.bonesByName.get(name);
      if (!bone) return;
      bone.rotation.x += base * (1 - idx * 0.25);
      bone.rotation.z += bob * (idx * 0.5);
    });
  }

  _applyLegCycle(cycle) {
    const legs = [
      { upper: "back_left_upper", lower: "back_left_lower", foot: "back_left_foot", phase: 0 },
      { upper: "front_left_upper", lower: "front_left_lower", foot: "front_left_foot", phase: 0.25 },
      { upper: "back_right_upper", lower: "back_right_lower", foot: "back_right_foot", phase: 0.5 },
      { upper: "front_right_upper", lower: "front_right_lower", foot: "front_right_foot", phase: 0.75 },
    ];

    legs.forEach((leg) => {
      const t = (cycle + leg.phase) * Math.PI * 2;
      const swing = Math.sin(t);
      this._restoreRotation(leg.upper);
      this._restoreRotation(leg.lower);
      this._restoreRotation(leg.foot);

      const upper = this.bonesByName.get(leg.upper);
      const lower = this.bonesByName.get(leg.lower);
      const foot = this.bonesByName.get(leg.foot);
      if (!upper || !lower || !foot) return;

      upper.rotation.x += swing * 0.35 - 0.1;
      lower.rotation.x += Math.max(0, -swing) * 0.45 + 0.1;
      foot.rotation.x += Math.max(0, swing) * 0.25 - 0.05;
    });
  }

  _applyHeadAndTrunk(cycle) {
    const nod = Math.sin(cycle * Math.PI * 2) * 0.08;
    this._restoreRotation("head");
    const head = this.bonesByName.get("head");
    if (head) {
      head.rotation.x += nod;
      head.rotation.y += Math.sin(cycle * Math.PI * 1.5) * 0.05;
    }

    const sway = Math.sin(this.time * 0.9) * 0.35;
    const curl = Math.cos(this.time * 0.7) * 0.3;
    ["trunk_root", "trunk_base", "trunk_mid1", "trunk_mid2", "trunk_tip"].forEach((name, idx) => {
      this._restoreRotation(name);
      const bone = this.bonesByName.get(name);
      if (!bone) return;
      const decay = 1 - idx * 0.15;
      bone.rotation.x += -0.12 + curl * 0.15 * decay;
      bone.rotation.y += sway * 0.25 * decay;
    });
  }

  _applyEars(cycle) {
    const fanBase = Math.sin(this.time * 1.4) * 0.25 + 0.2;
    const excitementBoost = this.state === "excited" ? 0.3 : 0;

    [
      { name: "ear_left", sign: 1 },
      { name: "ear_right", sign: -1 },
    ].forEach(({ name, sign }) => {
      this._restoreRotation(name);
      const bone = this.bonesByName.get(name);
      if (!bone) return;
      bone.rotation.z += sign * (fanBase + excitementBoost);
      bone.rotation.y += Math.sin(cycle * Math.PI * 2) * 0.05;
    });
  }

  _applyTail(cycle) {
    this._restoreRotation("tail_base");
    this._restoreRotation("tail_mid");
    this._restoreRotation("tail_tip");

    const sway = Math.sin(this.time * 2.1) * 0.35;
    const lift = Math.cos(cycle * Math.PI * 2) * 0.08;

    const base = this.bonesByName.get("tail_base");
    const mid = this.bonesByName.get("tail_mid");
    const tip = this.bonesByName.get("tail_tip");
    if (base) {
      base.rotation.y += sway * 0.8;
      base.rotation.x += lift * 0.5 - 0.05;
    }
    if (mid) {
      mid.rotation.y += sway * 0.4;
      mid.rotation.x += lift * 0.3 - 0.05;
    }
    if (tip) {
      tip.rotation.y += sway * 0.2;
      tip.rotation.x += -0.08 + lift * 0.2;
    }
  }
}

export default StudioElephantLocomotion;
