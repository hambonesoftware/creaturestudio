export class AnimalRegistry {
  constructor() {
    this.animals = new Map();
  }

  register(animalConfig) {
    if (!animalConfig || !animalConfig.key) {
      throw new Error("[AnimalRegistry] register requires a config with a key");
    }
    this.animals.set(animalConfig.key, animalConfig);
  }

  get(key) {
    return this.animals.get(key) || null;
  }

  list() {
    return Array.from(this.animals.values());
  }

  async createPen(key, context = {}) {
    const entry = this.get(key);
    if (!entry || typeof entry.createPen !== "function") {
      throw new Error(`[AnimalRegistry] Unknown animal key: ${key}`);
    }
    return entry.createPen(context);
  }
}
