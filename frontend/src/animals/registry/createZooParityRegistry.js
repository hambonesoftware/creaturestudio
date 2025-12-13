import { AnimalRegistry } from "./AnimalRegistry.js";
import { ElephantPen } from "../pens/ElephantPen.js";
import { CatPen } from "../pens/CatPen.js";

export function createZooParityRegistry(options = {}) {
  const registry = new AnimalRegistry();

  registry.register({
    key: "elephant",
    label: "Elephant",
    description: "Zoo-style elephant pen",
    createPen: async (context = {}) => {
      const pen = new ElephantPen(options.elephant || {});
      return pen.build(context);
    },
  });

  registry.register({
    key: "cat",
    label: "Cat",
    description: "Placeholder cat pen",
    createPen: async (context = {}) => {
      const pen = new CatPen(options.cat || {});
      return pen.build(context);
    },
  });

  return registry;
}
