// Smoothstep-style falloff in [0, 1].
function smoothFalloff01(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

// Smallest signed angle difference in radians, in [-π, π].
function shortestAngleDiff(a, b) {
  let d = a - b;
  const twoPi = Math.PI * 2;
  while (d > Math.PI) {
    d -= twoPi;
  }
  while (d < -Math.PI) {
    d += twoPi;
  }
  return d;
}

// Smallest barrel curve used when no base radius is provided.
function baseTorsoRadius(s, headScale) {
  const clampedHeadScale = typeof headScale === "number" ? headScale : 1.0;

  // Simple "big belly" bell curve centred along the spine.
  const bellyCenter = 0.5;
  const bellyWidth = 0.65;
  const d = (s - bellyCenter) / bellyWidth;
  const bell = 1.0 - d * d;
  const clamped = Math.max(0.35, bell);
  const scale = 0.5 * clampedHeadScale;
  return scale * clamped;
}

// Attachment definitions in (s, theta) space for the elephant.
// Coordinate assumptions for the local ring frame:
//   s    : 0 = hips, 1 = head along the spine
//   theta: 0      → +X (elephant's right side)
//          π / 2  → +Y (top / back)
//          π      → -X (elephant's left side)
//          -π / 2 → -Y (belly)
const ATTACHMENTS = [
  {
    name: "neck_hump",
    s: 0.18,
    theta: Math.PI / 2,
    bumpRadius: 0.18,
    sFalloff: 0.25,
    thetaFalloff: 1.0,
  },
  {
    name: "front_left_leg",
    s: 0.32,
    theta: 2.2,
    bumpRadius: 0.14,
    sFalloff: 0.2,
    thetaFalloff: 0.85,
  },
  {
    name: "front_right_leg",
    s: 0.32,
    theta: -0.6,
    bumpRadius: 0.14,
    sFalloff: 0.2,
    thetaFalloff: 0.85,
  },
  {
    name: "rear_left_leg",
    s: 0.8,
    theta: 2.4,
    bumpRadius: 0.16,
    sFalloff: 0.22,
    thetaFalloff: 0.9,
  },
  {
    name: "rear_right_leg",
    s: 0.8,
    theta: -0.4,
    bumpRadius: 0.16,
    sFalloff: 0.22,
    thetaFalloff: 0.9,
  },
];

// Factory that returns a torso radius profile suitable for the elephant.
// Intended to be passed into TorsoGenerator.buildTorsoFromSpine.
export function makeElephantTorsoRadiusProfile(headScale) {
  const clampedHeadScale = typeof headScale === "number" ? headScale : 1.0;

  return function radiusProfile(s, theta, baseRadius) {
    const base =
      typeof baseRadius === "number" ? baseRadius : baseTorsoRadius(s, clampedHeadScale);

    let radius = base;

    // Longitudinal shaping: round off hips and taper into the neck
    const hipFalloffWidth = 0.22;
    if (s <= hipFalloffWidth) {
      const tHip = smoothFalloff01(s / hipFalloffWidth);
      const hipScale = 0.55 + 0.45 * tHip;
      radius *= hipScale;
    }

    const neckFalloffStart = 0.65;
    const neckFalloffWidth = 0.35;
    if (s >= neckFalloffStart) {
      const tNeck = smoothFalloff01((1.0 - s) / neckFalloffWidth);
      const neckScale = 0.75 + 0.25 * tNeck;
      radius *= neckScale;
    }

    // Localised bumps for legs and dorsal hump
    for (let i = 0; i < ATTACHMENTS.length; i += 1) {
      const attachment = ATTACHMENTS[i];

      const dsNorm = Math.abs(s - attachment.s) / attachment.sFalloff;
      if (dsNorm >= 1.0) {
        continue;
      }

      const dTheta = Math.abs(shortestAngleDiff(theta, attachment.theta));
      const dThetaNorm = dTheta / attachment.thetaFalloff;
      if (dThetaNorm >= 1.0) {
        continue;
      }

      const wS = smoothFalloff01(1.0 - dsNorm);
      const wTheta = smoothFalloff01(1.0 - dThetaNorm);
      const weight = wS * wTheta;

      radius += attachment.bumpRadius * weight;
    }

    return radius;
  };
}

export default makeElephantTorsoRadiusProfile;
