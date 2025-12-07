// Types and interfaces for the general anatomy system.
//
// NOTE: This module defines the core data structures used by the
// generalized creature pipeline. It does not contain any runtime
// implementation logic; generators will be implemented in separate
// modules. All structures are designed to be driven by blueprint
// data. See docs/anatomy_design_v2.md for an overview.

import * as THREE from 'three';

/**
 * AnatomyChain
 *
 * Represents a named sequence of bones used to guide the extrusion of a
 * body part. A chain typically corresponds to a region of a creature,
 * such as the spine, a leg, a wing, or a tail. It may include an
 * optional list of radii (one per bone or one more than the number of
 * bones) and an optional radius profile function for smooth tapering.
 */
export interface AnatomyChain {
  /** Human‑readable name of this chain (e.g. "spine", "frontLeftLeg"). */
  name: string;
  /** Ordered list of bone names that define the chain. */
  boneNames: string[];
  /**
   * Optional radii values corresponding to each bone. When the array
   * length is one greater than the number of bones, the final entry
   * defines the radius at the end of the chain (e.g. a hoof flare).
   */
  radii?: number[];
  /**
   * Optional profile function mapping t∈[0,1] → radius multiplier.
   * Profiles allow custom shapes (e.g. rumps, wing membranes) to be
   * expressed independently of the raw radii. The final radius used
   * at a position along the chain is radius[i] * profile(t).
   */
  profile?: (t: number) => number;
  /**
   * When true, the generator should insert an extra sample behind the
   * first bone based on the positions of leg bones (for rump extension).
   * When an object, allows specifying which bones to sample and how
   * far to extend. See TorsoOptions.extendRumpToRearLegs for details.
   */
  extendTo?: boolean | {
    bones?: string[];
    extraMargin?: number;
    boneRadii?: Record<string, number>;
  };
}

/** Base options shared by all generators. */
export interface AnatomyGeneratorOptions {
  /** Number of radial subdivisions (sides) around the ring. */
  sides?: number;
  /** Toggle faceted low‑poly mode. */
  lowPoly?: boolean;
  /** Explicit segment count when lowPoly is true. */
  lowPolySegments?: number;
  /** Weld tolerance for merging vertices in low‑poly mode. */
  lowPolyWeldTolerance?: number;
  /** Whether to cap the start of the tube/mesh. */
  capStart?: boolean;
  /** Whether to cap the end of the tube/mesh. */
  capEnd?: boolean;
  /** Optional material identifier or hint to be used by the runtime. */
  materialKey?: string;
}

/** Options specific to torso generation. */
export interface TorsoOptions extends AnatomyGeneratorOptions {
  /** Custom radius profile for hips → ribcage → neck transition. */
  radiusProfile?: (t: number) => number;
  /**
   * Depth of the rump bulge. When > 0, the generator inflates the
   * initial rings along the spine to create a pronounced rump.
   */
  rumpBulgeDepth?: number;
  /**
   * Extend the rump beyond the hips to cover the rear legs. When set
   * to true, the default leg bones and radii are used. When an object,
   * custom bones, margins and bone radii may be provided.
   */
  extendRumpToRearLegs?: boolean | {
    bones?: string[];
    extraMargin?: number;
    boneRadii?: Record<string, number>;
  };
}

/** Options specific to limbs (arms, legs, ears as thin limbs). */
export interface LimbOptions extends AnatomyGeneratorOptions {
  /** Radii per joint (may contain one extra value for end flare). */
  radii?: number[];
  /** Number of axial rings between consecutive bones. */
  rings?: number;
}

/** Options specific to wing generation. */
export interface WingOptions extends AnatomyGeneratorOptions {
  /** Approximate span of the wing relative to the bone chain length. */
  span?: number;
  /** Thickness profile across the wing membrane (0 at root → 1 at tip). */
  thicknessProfile?: (t: number) => number;
  /** Resolution of the membrane surface (subdivisions along the span). */
  membraneResolution?: number;
  /** Number of feather/segment hints (unused in MVP implementation). */
  featherCount?: number;
}

/** Options specific to tails or trunks. */
export interface TailOptions extends AnatomyGeneratorOptions {
  /** Base radius at the root (defaults to the first radius in the chain). */
  baseRadius?: number;
  /** Mid‑segment radius; used when no per‑bone radii are provided. */
  midRadius?: number;
  /** Tip radius at the end of the chain. */
  tipRadius?: number;
  /** Optional radii array overriding base/mid/tip values. */
  radii?: number[];
  /** Vertical offset applied to all vertices (for ears/fins). */
  yOffset?: number;
}

/** Options specific to heads or skulls. */
export interface HeadOptions extends AnatomyGeneratorOptions {
  /** Base radius (overall head size). */
  radius?: number;
  /** Icosahedron subdivision level controlling smoothness. */
  detail?: number;
}

/** Options specific to noses/trunks/tusks built from TailOptions. */
export interface NoseOptions extends TailOptions {
  /** Preferred root bone for the nose (e.g. 'trunk_anchor', 'head'). */
  rootBone?: string;
  /** List of fallback bones to anchor the nose if rootBone is missing. */
  fallbackRoots?: string[];
  /** Extra scaling factor applied to the length of the nose. */
  lengthScale?: number;
}

/** Options specific to ears, which are thin limb‑like structures. */
export interface EarOptions extends LimbOptions {
  /** Angle in radians to rotate the ear around its root (fan spread). */
  fanAngle?: number;
  /** Flattening factor applied to the ear thickness (0..1). */
  flattenScale?: number;
}

/**
 * Generic anatomy generator function type. A generator takes a
 * skeleton, a chain and a set of options and returns a geometry (and
 * optional metadata). Generators may be asynchronous if they need to
 * perform I/O or lengthy computations, but by default they return
 * synchronously.
 */
export type AnatomyGenerator<TOptions extends AnatomyGeneratorOptions> = (args: {
  skeleton: THREE.Skeleton;
  chain: AnatomyChain;
  options: TOptions;
}) => {
  /** The generated geometry ready to be skinned and merged. */
  geometry: THREE.BufferGeometry;
  /** Optional metadata such as attachment transforms or debug info. */
  meta?: Record<string, unknown>;
};
