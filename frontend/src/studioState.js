// Global reactive state container for CreatureStudio.
//
// Canonical shape (following Phase 4 plan):
// - blueprintsIndex: list of { name, ...meta } objects from backend.
// - currentBlueprintName: string | null.
// - currentBlueprint: SpeciesBlueprint | null (working copy).
// - isDirty: boolean flag indicating unsaved changes.
// - loading: boolean flag for in-flight requests.
// - error: string | null for last error message.
//
// A tiny pub/sub mechanism is provided so UI modules can subscribe to state
// snapshots and re-render when things change.

const state = {
  blueprintsIndex: [],
  currentBlueprintName: null,
  currentBlueprint: null,
  isDirty: false,
  loading: false,
  error: null,
};

const listeners = new Set();

/**
 * Initialize / reset state to its defaults.
 */
export function initState() {
  state.blueprintsIndex = [];
  state.currentBlueprintName = null;
  state.currentBlueprint = null;
  state.isDirty = false;
  state.loading = false;
  state.error = null;
  notify();
}

/**
 * Return a shallow snapshot of the current state.
 */
export function getState() {
  return { ...state };
}

/**
 * Subscribe to state changes.
 *
 * The listener is immediately called with the current snapshot, then again
 * whenever the state changes. Returns an unsubscribe function.
 */
export function subscribe(listener) {
  if (typeof listener !== "function") {
    throw new Error("studioState.subscribe expects a function listener");
  }
  listeners.add(listener);
  listener(getState());
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  const snapshot = getState();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error("[studioState] listener error", error);
    }
  }
}

/**
 * Set the list of available blueprints and choose an initial selection if
 * none is set yet (preferring "Elephant").
 */
export function setBlueprintsIndex(list) {
  state.blueprintsIndex = Array.isArray(list) ? list.slice() : [];

  if (!state.currentBlueprintName && state.blueprintsIndex.length > 0) {
    const elephant = state.blueprintsIndex.find((item) => item.name === "Elephant");
    state.currentBlueprintName = elephant
      ? elephant.name
      : state.blueprintsIndex[0].name;
  }

  notify();
}

/**
 * Update only the current blueprint name (selection). This does NOT load
 * or modify the current blueprint object; callers should fetch and then
 * call setCurrentBlueprint when appropriate.
 */
export function setCurrentBlueprintName(name) {
  if (!name || typeof name !== "string") {
    return;
  }
  if (state.currentBlueprintName === name) {
    return;
  }
  state.currentBlueprintName = name;
  // When we change selection, clear the working copy and dirty flag.
  state.currentBlueprint = null;
  state.isDirty = false;
  notify();
}

/**
 * Set both the current blueprint name and its working copy.
 * Typically called after loading a blueprint from the backend.
 */
export function setCurrentBlueprint(name, blueprint) {
  if (!name || typeof name !== "string") {
    return;
  }
  state.currentBlueprintName = name;
  state.currentBlueprint = blueprint || null;
  state.isDirty = false;
  notify();
}

/**
 * Update fields of the current blueprint working copy and mark as dirty.
 * `partial` can be a plain object merged shallowly onto currentBlueprint,
 * or a function(current) => newBlueprint.
 */
export function updateCurrentBlueprint(partial) {
  if (!state.currentBlueprint) {
    return;
  }

  if (typeof partial === "function") {
    state.currentBlueprint = partial(state.currentBlueprint);
  } else if (partial && typeof partial === "object") {
    state.currentBlueprint = {
      ...state.currentBlueprint,
      ...partial,
    };
  }

  state.isDirty = true;
  notify();
}

export function markDirty() {
  if (!state.currentBlueprint) return;
  state.isDirty = true;
  notify();
}

export function markClean() {
  state.isDirty = false;
  notify();
}

export function setLoading(isLoading) {
  state.loading = Boolean(isLoading);
  notify();
}

export function setError(error) {
  state.error = error ? String(error) : null;
  notify();
}

/**
 * Convenience helpers / aliases used by earlier phases or small modules.
 * These keep the API ergonomic while maintaining the canonical field names.
 */

// Alias for Phase 4 plan wording.
export function setSpeciesList(list) {
  setBlueprintsIndex(list);
}

// Alias: selecting a species by name.
export function setSelectedSpecies(name) {
  setCurrentBlueprintName(name);
}

// Alias: set the current blueprint without changing the name.
export function setBlueprint(blueprint) {
  const name = state.currentBlueprintName;
  if (!name) return;
  setCurrentBlueprint(name, blueprint);
}

export function toggleDirty() {
  if (!state.currentBlueprint) return;
  state.isDirty = !state.isDirty;
  notify();
}
