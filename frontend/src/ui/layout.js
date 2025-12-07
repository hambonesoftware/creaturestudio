import {
  subscribe,
  getState,
  setViewportMode,
  setLightingMode,
  setDebugShowBones,
  setDebugChainName,
  setDebugIsolatePart,
} from "../studioState.js";
import { createLeftSidebarSpeciesBrowser } from "./leftSidebarSpeciesBrowser.js";
import { createRightSidebarInspector } from "./rightSidebarInspector.js";
import {
  initCreatureViewport,
  updateViewportFromBlueprint,
  setViewportLighting,
} from "../viewport/viewportBridge.js";

/**
 * Create the main CreatureStudio layout inside the given root element.
 *
 * The layout is:
 *
 *   [Header]
 *   [Left Sidebar] [Center Viewport] [Right Inspector]
 *
 * The center viewport is a placeholder <div> for now; real 3D integration
 * happens in Phase 5.
 *
 * The header includes:
 * - App title
 * - Selected species name
 * - Backend / loading status
 * - Save button
 * - Debug "Mark Dirty" button (hooked up by the caller)
 */
export function createLayout(rootElement, options = {}) {
  const { onSaveClick, onDebugMarkDirtyClick } = options;

  if (!rootElement) {
    throw new Error("createLayout requires a root element");
  }

  // Clear any previous content.
  rootElement.innerHTML = "";

  const root = document.createElement("div");
  root.className = "cs-root";
  rootElement.appendChild(root);

  // Header
  const header = document.createElement("header");
  header.className = "cs-header";
  root.appendChild(header);

  const titleGroup = document.createElement("div");
  titleGroup.className = "cs-header-title-group";
  header.appendChild(titleGroup);

  const title = document.createElement("h1");
  title.className = "cs-header-title";
  title.textContent = "CreatureStudio";
  titleGroup.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.className = "cs-header-subtitle";
  subtitle.textContent = "Phase 5 – Viewer & Editing Shell";
  titleGroup.appendChild(subtitle);

  const statusGroup = document.createElement("div");
  statusGroup.className = "cs-header-status-group";
  header.appendChild(statusGroup);

  const speciesLabel = document.createElement("div");
  speciesLabel.className = "cs-header-species";
  speciesLabel.textContent = "Species: –";
  statusGroup.appendChild(speciesLabel);

  const backendStatus = document.createElement("div");
  backendStatus.className = "cs-header-backend-status";
  backendStatus.textContent = "Backend: unknown";
  statusGroup.appendChild(backendStatus);

  const dirtyIndicator = document.createElement("div");
  dirtyIndicator.className = "cs-header-dirty-indicator";
  dirtyIndicator.textContent = "Saved ✓";
  statusGroup.appendChild(dirtyIndicator);

  const headerButtons = document.createElement("div");
  headerButtons.className = "cs-header-buttons";
  header.appendChild(headerButtons);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "cs-button cs-button-primary";
  saveButton.textContent = "Save Blueprint";
  saveButton.disabled = true;
  headerButtons.appendChild(saveButton);

  const debugDirtyButton = document.createElement("button");
  debugDirtyButton.type = "button";
  debugDirtyButton.className = "cs-button cs-button-secondary";
  debugDirtyButton.textContent = "Mark Dirty (debug)";
  headerButtons.appendChild(debugDirtyButton);

  if (typeof onSaveClick === "function") {
    saveButton.addEventListener("click", () => {
      onSaveClick(getState());
    });
  }

  if (typeof onDebugMarkDirtyClick === "function") {
    debugDirtyButton.addEventListener("click", () => {
      onDebugMarkDirtyClick(getState());
    });
  }

  // Main layout columns
  const main = document.createElement("div");
  main.className = "cs-main";
  root.appendChild(main);

  // Left sidebar: species browser
  const leftSidebar = createLeftSidebarSpeciesBrowser();
  main.appendChild(leftSidebar.element);

  // Center viewport with live Three.js creature preview.
  const center = document.createElement("section");
  center.className = "cs-center-viewport";

  const viewportHeader = document.createElement("div");
  viewportHeader.className = "cs-center-viewport-header";

  const viewportTitle = document.createElement("span");
  viewportTitle.className = "cs-center-viewport-title";
  viewportTitle.textContent = "Viewport – 3D Creature Preview";
  viewportHeader.appendChild(viewportTitle);

  const viewportModeGroup = document.createElement("div");
  viewportModeGroup.className = "cs-viewport-mode-toggle";

  const viewportModeInputs = {};
  const lightingModeInputs = {};

  function createViewportModeOption(value, label) {
    const wrapper = document.createElement("label");
    wrapper.className = "cs-viewport-mode-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "cs-viewport-mode";
    input.value = value;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      setViewportMode(value);
      const { currentBlueprint } = getState();
      if (currentBlueprint) {
        updateViewportFromBlueprint(currentBlueprint);
      }
    });

    const text = document.createElement("span");
    text.textContent = label;

    wrapper.appendChild(input);
    wrapper.appendChild(text);

    viewportModeInputs[value] = input;
    viewportModeGroup.appendChild(wrapper);
  }

  createViewportModeOption("mesh", "Mesh");
  createViewportModeOption("skeleton", "Skeleton");
  createViewportModeOption("both", "Mesh + Skeleton");

  viewportHeader.appendChild(viewportModeGroup);

  const lightingModeGroup = document.createElement("div");
  lightingModeGroup.className = "cs-viewport-mode-toggle";

  const lightingLabel = document.createElement("span");
  lightingLabel.textContent = "Lighting:";
  lightingModeGroup.appendChild(lightingLabel);

  function createLightingModeOption(value, label) {
    const wrapper = document.createElement("label");
    wrapper.className = "cs-viewport-mode-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "cs-lighting-mode";
    input.value = value;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      setLightingMode(value);
      setViewportLighting(value);
    });

    const text = document.createElement("span");
    text.textContent = label;

    wrapper.appendChild(input);
    wrapper.appendChild(text);

    lightingModeInputs[value] = input;
    lightingModeGroup.appendChild(wrapper);
  }

  createLightingModeOption("studio", "Studio Spotlights");
  createLightingModeOption("allAround", "All-Around");

  viewportHeader.appendChild(lightingModeGroup);
  center.appendChild(viewportHeader);

  const viewportCanvasPlaceholder = document.createElement("div");
  viewportCanvasPlaceholder.className = "cs-center-viewport-placeholder";

  const viewportOverlay = document.createElement("div");
  viewportOverlay.className = "cs-viewport-overlay";

  const meshToggleLabel = document.createElement("label");
  meshToggleLabel.className = "cs-viewport-toggle";
  const meshToggle = document.createElement("input");
  meshToggle.type = "checkbox";
  meshToggle.checked = true;
  meshToggle.addEventListener("change", () => {
    handleViewportToggleChange();
  });
  const meshToggleText = document.createElement("span");
  meshToggleText.textContent = "Show Mesh";
  meshToggleLabel.appendChild(meshToggle);
  meshToggleLabel.appendChild(meshToggleText);

  const skeletonToggleLabel = document.createElement("label");
  skeletonToggleLabel.className = "cs-viewport-toggle";
  const skeletonToggle = document.createElement("input");
  skeletonToggle.type = "checkbox";
  skeletonToggle.checked = false;
  skeletonToggle.addEventListener("change", () => {
    handleViewportToggleChange();
  });
  const skeletonToggleText = document.createElement("span");
  skeletonToggleText.textContent = "Show Skeleton";
  skeletonToggleLabel.appendChild(skeletonToggle);
  skeletonToggleLabel.appendChild(skeletonToggleText);

  const boneLinesToggleLabel = document.createElement("label");
  boneLinesToggleLabel.className = "cs-viewport-toggle";
  const boneLinesToggle = document.createElement("input");
  boneLinesToggle.type = "checkbox";
  boneLinesToggle.checked = false;
  boneLinesToggle.addEventListener("change", () => {
    setDebugShowBones(boneLinesToggle.checked);
    const { currentBlueprint } = getState();
    if (currentBlueprint) {
      updateViewportFromBlueprint(currentBlueprint);
    }
  });
  const boneLinesText = document.createElement("span");
  boneLinesText.textContent = "Bone Lines";
  boneLinesToggleLabel.appendChild(boneLinesToggle);
  boneLinesToggleLabel.appendChild(boneLinesText);

  const chainSelectWrapper = document.createElement("label");
  chainSelectWrapper.className = "cs-viewport-toggle";
  const chainSelect = document.createElement("select");
  chainSelect.className = "cs-select cs-select-compact";
  chainSelect.addEventListener("change", () => {
    setDebugChainName(chainSelect.value);
    const { currentBlueprint } = getState();
    if (currentBlueprint) {
      updateViewportFromBlueprint(currentBlueprint);
    }
  });
  const chainSelectText = document.createElement("span");
  chainSelectText.textContent = "Highlight Chain";
  chainSelectWrapper.appendChild(chainSelectText);
  chainSelectWrapper.appendChild(chainSelect);

  const partSelectWrapper = document.createElement("label");
  partSelectWrapper.className = "cs-viewport-toggle";
  const partSelect = document.createElement("select");
  partSelect.className = "cs-select cs-select-compact";
  partSelect.addEventListener("change", () => {
    setDebugIsolatePart(partSelect.value);
    const { currentBlueprint } = getState();
    if (currentBlueprint) {
      updateViewportFromBlueprint(currentBlueprint);
    }
  });
  const partSelectText = document.createElement("span");
  partSelectText.textContent = "Isolate Part";
  partSelectWrapper.appendChild(partSelectText);
  partSelectWrapper.appendChild(partSelect);

  viewportOverlay.appendChild(meshToggleLabel);
  viewportOverlay.appendChild(skeletonToggleLabel);
  viewportOverlay.appendChild(boneLinesToggleLabel);
  viewportOverlay.appendChild(chainSelectWrapper);
  viewportOverlay.appendChild(partSelectWrapper);
  viewportCanvasPlaceholder.appendChild(viewportOverlay);
  center.appendChild(viewportCanvasPlaceholder);

  function handleViewportToggleChange() {
    const { currentBlueprint } = getState();
    const showMesh = meshToggle.checked;
    const showSkeleton = skeletonToggle.checked;

    let nextMode = "mesh";
    if (showMesh && showSkeleton) {
      nextMode = "both";
    } else if (showSkeleton && !showMesh) {
      nextMode = "skeleton";
    } else if (!showMesh && !showSkeleton) {
      nextMode = "mesh";
      meshToggle.checked = true;
    }

    setViewportMode(nextMode);
    if (currentBlueprint) {
      updateViewportFromBlueprint(currentBlueprint);
    }
  }

  function syncViewportToggles(mode) {
    const showMesh = mode === "mesh" || mode === "both";
    const showSkeleton = mode === "skeleton" || mode === "both";
    meshToggle.checked = showMesh;
    skeletonToggle.checked = showSkeleton;
  }

  function syncLightingMode(mode) {
    const selectedMode = lightingModeInputs[mode] ? mode : "allAround";
    Object.entries(lightingModeInputs).forEach(([value, input]) => {
      input.checked = value === selectedMode;
    });
    setViewportLighting(selectedMode);
  }

  function populateChainOptions(blueprint, selectedName) {
    chainSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "None";
    chainSelect.appendChild(noneOption);

    const chains = (blueprint && blueprint.chains) || {};
    Object.keys(chains)
      .filter((name) => name !== "extraChains")
      .sort()
      .forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        chainSelect.appendChild(opt);
      });

    if (chains.extraChains && typeof chains.extraChains === "object") {
      Object.keys(chains.extraChains)
        .sort()
        .forEach((name) => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          chainSelect.appendChild(opt);
        });
    }

    chainSelect.value = selectedName || "";
  }

  function populatePartOptions(blueprint, selectedName) {
    partSelect.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Parts";
    partSelect.appendChild(allOption);

    const parts = (blueprint && blueprint.bodyParts) || {};
    Object.keys(parts)
      .sort()
      .forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        partSelect.appendChild(opt);
      });

    partSelect.value = selectedName || "";
  }

  // Initialize the Three.js viewport inside the placeholder container.
  initCreatureViewport(viewportCanvasPlaceholder);

  main.appendChild(center);

  // Right inspector with tabs.
  const rightInspector = createRightSidebarInspector();
  main.appendChild(rightInspector.element);

  // Footer / status bar (optional lightweight)
  const footer = document.createElement("footer");
  footer.className = "cs-footer";
  footer.textContent = "CreatureStudio – Zoo / Animal Rulebook driven blueprint editor (Phase 4 shell).";
  root.appendChild(footer);

  // Subscribe to studio state updates to refresh header labels.
  const unsubscribe = subscribe((state) => {
    const {
      currentBlueprintName,
      loading,
      error,
      isDirty,
      currentBlueprint,
      viewportMode,
      lightingMode,
      debugShowBones,
      debugChainName,
      debugIsolatePart,
    } = state;

    if (currentBlueprintName) {
      speciesLabel.textContent = `Species: ${currentBlueprintName}`;
    } else {
      speciesLabel.textContent = "Species: –";
    }

    if (loading) {
      backendStatus.textContent = "Backend: loading…";
      backendStatus.classList.add("is-loading");
    } else if (error) {
      backendStatus.textContent = "Backend: error";
      backendStatus.classList.remove("is-loading");
      backendStatus.classList.add("is-error");
    } else {
      backendStatus.textContent = "Backend: ready";
      backendStatus.classList.remove("is-loading");
      backendStatus.classList.remove("is-error");
    }

    if (isDirty) {
      dirtyIndicator.textContent = "Unsaved changes";
      dirtyIndicator.classList.add("is-dirty");
    } else {
      dirtyIndicator.textContent = currentBlueprint ? "Saved ✓" : "No blueprint loaded";
      dirtyIndicator.classList.remove("is-dirty");
    }

    // Save button is enabled only when we have a blueprint loaded.
    saveButton.disabled = !currentBlueprint;

    // Sync viewport mode radio buttons with state.
    const selectedMode = viewportModeInputs[viewportMode] ? viewportMode : "mesh";
    Object.entries(viewportModeInputs).forEach(([mode, input]) => {
      input.checked = mode === selectedMode;
    });
    syncViewportToggles(selectedMode);
    syncLightingMode(lightingMode);

    populateChainOptions(currentBlueprint, debugChainName);
    populatePartOptions(currentBlueprint, debugIsolatePart);
    boneLinesToggle.checked = Boolean(debugShowBones);
    chainSelect.value = debugChainName || "";
    partSelect.value = debugIsolatePart || "";
  });

  return {
    rootElement: root,
    destroy() {
      unsubscribe();
      leftSidebar.destroy();
      rightInspector.destroy();
      rootElement.innerHTML = "";
    },
  };
}
