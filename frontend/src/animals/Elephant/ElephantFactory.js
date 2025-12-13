import { ElephantBlueprintAdapter } from "./ElephantBlueprintAdapter.js";
import { resolveElephantMaterials } from "./ElephantMaterials.js";
import { buildElephantFromBodyParts } from "../../runtime/buildElephantFromBodyParts.js";

const DEFAULT_OPTIONS = { zooParity: true };

export class ElephantFactory {
  constructor(adapter = new ElephantBlueprintAdapter()) {
    this.adapter = adapter;
  }

  createFromBlueprint(blueprint, options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const compiled = this.adapter.compile(blueprint, { zooParity: mergedOptions.zooParity });
    const materials = resolveElephantMaterials(compiled.materialsIntent || {});

    const runtime = buildElephantFromBodyParts(compiled.runtime.blueprint, {
      ...mergedOptions.runtimeOptions,
      elephantMaterials: materials,
    });

    runtime.compiledSpecies = compiled;
    runtime.materials = materials;
    runtime.speciesKey = "elephant";

    return runtime;
  }
}

export function createElephantFactory(options = {}) {
  const adapter = new ElephantBlueprintAdapter({ zooParityDefault: options.zooParityDefault });
  return new ElephantFactory(adapter);
}

export default ElephantFactory;
