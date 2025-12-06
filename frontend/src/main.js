import "./styles.css";

import {
  setSpeciesList,
  setBlueprint,
  setLoading,
  setError,
  markDirty,
  markClean,
  getState,
  subscribe,
} from "./studioState.js";

import { listBlueprints, getBlueprint, putBlueprint } from "./api/blueprintsApi.js";
import { createLayout } from "./ui/layout.js";
import { updateViewportFromBlueprint } from "./viewport/viewportBridge.js";

/**
 * Initialize the CreatureStudio frontend shell.
 */
async function init() {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("Root element #app not found");
  }

  // Set up the main layout with callbacks for header buttons.
  createLayout(appElement, {
    onSaveClick: handleSaveClick,
    onDebugMarkDirtyClick: handleDebugMarkDirtyClick,
  });

  // Set up a watcher that reacts to user-initiated species changes.
  setupSelectionWatcher();

  // Bootstrap species list and initial blueprint (Elephant by default).
  await bootstrapBlueprints();
}

/**
 * Load the list of blueprints from the backend and select the initial species.
 */
async function bootstrapBlueprints() {
  setLoading(true);
  setError(null);

  try {
    const metas = await listBlueprints();
    setSpeciesList(metas || []);

    const { currentBlueprintName } = getState();
    if (currentBlueprintName) {
      const blueprint = await getBlueprint(currentBlueprintName);
      setBlueprint(blueprint);
      updateViewportFromBlueprint(blueprint);
      setError(null);
    }
  } catch (error) {
    console.error("[CreatureStudio] Failed to bootstrap blueprints:", error);
    setError(error);
  } finally {
    setLoading(false);
  }
}

/**
 * Watch for selection changes after initial bootstrap and load blueprints
 * when the user switches species.
 */
function setupSelectionWatcher() {
  let initialized = false;
  let lastSelected = null;

  subscribe(async (state) => {
    const { currentBlueprintName } = state;

    // Ignore until bootstrapBlueprints has run once.
    if (!initialized) {
      if (currentBlueprintName) {
        initialized = true;
        lastSelected = currentBlueprintName;
      }
      return;
    }

    if (!currentBlueprintName || currentBlueprintName === lastSelected) {
      return;
    }

    lastSelected = currentBlueprintName;

    setLoading(true);
    setError(null);
    try {
      const blueprint = await getBlueprint(currentBlueprintName);
      setBlueprint(blueprint);
      updateViewportFromBlueprint(blueprint);
      setError(null);
    } catch (error) {
      console.error("[CreatureStudio] Failed to load blueprint:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  });
}

/**
 * Handle Save button clicks from the header.
 */
async function handleSaveClick(state) {
  const { currentBlueprintName, currentBlueprint } = state;
  if (!currentBlueprintName || !currentBlueprint) {
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const saved = await putBlueprint(currentBlueprintName, currentBlueprint);
    // The backend returns the canonical blueprint. Use that to mark things clean.
    setBlueprint(saved || currentBlueprint);
    updateViewportFromBlueprint(saved || currentBlueprint);
    markClean();
  } catch (error) {
    console.error("[CreatureStudio] Failed to save blueprint:", error);
    setError(error);
  } finally {
    setLoading(false);
  }
}

/**
 * Debug helper: mark the current blueprint as dirty so we can verify
 * that the header indicator and save plumbing behave as expected.
 */
function handleDebugMarkDirtyClick() {
  markDirty();
}

// Kick everything off.
init().catch((error) => {
  console.error("CreatureStudio init error:", error);
});