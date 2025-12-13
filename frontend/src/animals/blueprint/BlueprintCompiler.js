/**
 * BlueprintCompiler
 * ------------------
 *
 * Entry point for converting SpeciesBlueprint JSON documents into a
 * deterministic, versioned CompiledSpecies object that downstream renderers,
 * registries, and exporters can consume. The compiler delegates body-plan
 * specifics to adapters (Quadruped, etc.) to keep pipeline seams explicit.
 */

import { QuadrupedBlueprintAdapter } from "./adapters/QuadrupedBlueprintAdapter.js";
import { BipedBlueprintAdapter } from "./adapters/BipedBlueprintAdapter.js";
import { WingedBlueprintAdapter } from "./adapters/WingedBlueprintAdapter.js";

const DEFAULT_CONTRACT_VERSION = "1.0.0";
const DEFAULT_COMPILER_VERSION = "0.1.0";

/**
 * @typedef {object} CompileResult
 * @property {string} contractVersion
 * @property {string} compilerVersion
 * @property {string} bodyPlanType
 * @property {string} compiledAt ISO timestamp
 * @property {object} sourceMeta
 * @property {object} canonicalSkeleton
 * @property {object[]} canonicalChains
 * @property {object[]} canonicalBodyParts
 * @property {object} materialsIntent
 * @property {object} locomotion
 * @property {object} validation
 * @property {{ blueprint: object }} runtime
 */

export class BlueprintCompiler {
  constructor({ adapters, contractVersion, compilerVersion } = {}) {
    this.adapters = adapters || {
      quadruped: new QuadrupedBlueprintAdapter(),
      biped: new BipedBlueprintAdapter(),
      winged: new WingedBlueprintAdapter(),
    };
    this.contractVersion = contractVersion || DEFAULT_CONTRACT_VERSION;
    this.compilerVersion = compilerVersion || DEFAULT_COMPILER_VERSION;
  }

  /**
   * Compile a SpeciesBlueprint into a CompiledSpecies payload.
   *
   * @param {import("../../types/SpeciesBlueprint").SpeciesBlueprint | object} blueprint
   * @returns {CompileResult}
   */
  compile(blueprint) {
    if (!blueprint) {
      throw new Error("BlueprintCompiler.compile requires a SpeciesBlueprint");
    }

    const bodyPlanType = blueprint?.bodyPlan?.type;
    const adapter = this.adapters[bodyPlanType];

    if (!adapter) {
      const supported = Object.keys(this.adapters).join(", ") || "<none>";
      throw new Error(`No adapter registered for body plan type: ${bodyPlanType}. Supported: ${supported}`);
    }

    const adapted = adapter.adapt(blueprint);

    return {
      contractVersion: this.contractVersion,
      compilerVersion: this.compilerVersion,
      bodyPlanType,
      compiledAt: new Date().toISOString(),
      sourceMeta: {
        name: blueprint?.meta?.name || "unknown",
        version: blueprint?.meta?.version || "unversioned",
        schemaVersion: blueprint?.meta?.schemaVersion || null,
      },
      canonicalSkeleton: adapted.canonicalSkeleton,
      canonicalChains: adapted.canonicalChains,
      canonicalBodyParts: adapted.canonicalBodyParts,
      materialsIntent: adapted.materialsIntent || {},
      locomotion: adapted.locomotion || {},
      validation: adapted.validation || { errors: [], warnings: [] },
      runtime: {
        blueprint: adapted.runtimeBlueprint || blueprint,
      },
    };
  }
}

export default BlueprintCompiler;
