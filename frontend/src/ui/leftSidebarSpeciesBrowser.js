import { listBlueprints, createBlueprintFromTemplate, importBlueprintFromFile } from "../api/blueprintsApi.js";
import { updateViewportFromBlueprint } from "../viewport/viewportBridge.js";
import { subscribe, setSelectedSpecies } from "../studioState.js";

/**
 * Left sidebar – Species / Blueprint Browser.
 *
 * Renders the list of blueprint names from studioState.blueprintsIndex and
 * highlights the currently selected blueprint. Clicking an item updates the
 * current selection; the main controller is responsible for loading the
 * corresponding blueprint.
 */
export function createLeftSidebarSpeciesBrowser() {
  const container = document.createElement("aside");
  container.className = "cs-left-sidebar";

  const header = document.createElement("div");
  header.className = "cs-left-sidebar-header";
  header.textContent = "Species";
  container.appendChild(header);

  const list = document.createElement("ul");
  list.className = "cs-species-list";
  container.appendChild(list);

  function render(state) {
    const { blueprintsIndex, currentBlueprintName } = state;

    list.innerHTML = "";

    if (!blueprintsIndex || blueprintsIndex.length === 0) {
      const li = document.createElement("li");
      li.className = "cs-species-list-empty";
      li.textContent = "No species yet";
      list.appendChild(li);
      return;
    }

    for (const meta of blueprintsIndex) {
      const li = document.createElement("li");
      li.className = "cs-species-list-item";
      if (meta.name === currentBlueprintName) {
        li.classList.add("is-selected");
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "cs-species-name";
      nameSpan.textContent = meta.name;

      const versionSpan = document.createElement("span");
      versionSpan.className = "cs-species-version";
      if (meta.version) {
        versionSpan.textContent = meta.version;
      }

      li.appendChild(nameSpan);
      if (versionSpan.textContent) {
        li.appendChild(versionSpan);
      }

      li.addEventListener("click", () => {
        setSelectedSpecies(meta.name);
      });

      list.appendChild(li);
    }
  }

  // Initial render + subscription.
  const unsubscribe = subscribe(render);

  return {
    element: container,
    destroy() {
      unsubscribe();
    },
  };
}

async function handleNewFromTemplateClick() {
  const state = getState();
  const defaultName = state.currentBlueprintName
    ? state.currentBlueprintName + "_copy"
    : "NewSpecies";

  const name = window.prompt("Enter a name for the new species:", defaultName);
  if (!name) {
    return;
  }

  const templateType = window.prompt(
    "Enter template type (quadruped, biped, winged, no-ped):",
    "quadruped"
  );
  if (!templateType) {
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const blueprint = await createBlueprintFromTemplate(name, templateType);

    // Refresh species list so the new entry appears in the sidebar.
    const metas = await listBlueprints();
    if (Array.isArray(metas)) {
      setSpeciesList(metas);
    }

    // Focus the new blueprint in state and viewport.
    setCurrentBlueprintName(blueprint.meta.name);
    setBlueprint(blueprint);
    markClean();
    updateViewportFromBlueprint(blueprint);
  } catch (error) {
    console.error("Failed to create blueprint from template:", error);
    setError(error);
    window.alert("Failed to create blueprint from template: " + error.message);
  } finally {
    setLoading(false);
  }
}

async function handleImportBlueprintClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.style.display = "none";

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    document.body.removeChild(input);

    if (!file) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const blueprint = await importBlueprintFromFile(file);

      // Refresh the list of blueprints so the imported one is visible.
      const metas = await listBlueprints();
      if (Array.isArray(metas)) {
        setSpeciesList(metas);
      }

      setCurrentBlueprintName(blueprint.meta.name);
      setBlueprint(blueprint);
      markClean();
      updateViewportFromBlueprint(blueprint);
    } catch (error) {
      console.error("Failed to import blueprint:", error);
      setError(error);
      window.alert("Failed to import blueprint: " + error.message);
    } finally {
      setLoading(false);
    }
  });

  document.body.appendChild(input);
  input.click();
}

