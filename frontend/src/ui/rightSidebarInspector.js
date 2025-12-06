import { getState, setViewportMode, subscribe } from "../studioState.js";
import { createBodyPlanPanel } from "./panels/BodyPlanPanel.js";
import { createSkeletonPanel } from "./panels/SkeletonPanel.js";
import { createBodyPartsPanel } from "./panels/BodyPartsPanel.js";
import { createMaterialsPanel } from "./panels/MaterialsPanel.js";
import { createBehaviorPanel } from "./panels/BehaviorPanel.js";

/**
 * Create the right-hand inspector sidebar with tabbed panels.
 *
 * Panels are read-only views over the currently loaded blueprint. They
 * re-render automatically when the global studio state changes.
 */
export function createRightSidebarInspector() {
  const container = document.createElement("aside");
  container.className = "cs-right-sidebar";

  const header = document.createElement("div");
  header.className = "cs-right-sidebar-header";

  const headerTitle = document.createElement("span");
  headerTitle.className = "cs-right-sidebar-title";
  headerTitle.textContent = "Inspector";
  header.appendChild(headerTitle);

  const viewToggle = document.createElement("div");
  viewToggle.className = "cs-inspector-view-toggle";

  function getToggleFlags(mode) {
    return {
      showMesh: mode === "mesh" || mode === "both",
      showSkeleton: mode === "skeleton" || mode === "both",
    };
  }

  const meshToggle = document.createElement("button");
  meshToggle.type = "button";
  meshToggle.className = "cs-inspector-toggle";
  meshToggle.textContent = "Mesh";
  meshToggle.addEventListener("click", () => {
    const { viewportMode } = getState();
    const { showMesh, showSkeleton } = getToggleFlags(viewportMode);
    const nextShowMesh = !showMesh;
    const nextShowSkeleton = showSkeleton;

    const nextMode = nextShowMesh && nextShowSkeleton
      ? "both"
      : nextShowMesh
      ? "mesh"
      : nextShowSkeleton
      ? "skeleton"
      : "mesh";

    setViewportMode(nextMode);
  });

  const skeletonToggle = document.createElement("button");
  skeletonToggle.type = "button";
  skeletonToggle.className = "cs-inspector-toggle";
  skeletonToggle.textContent = "Skeleton";
  skeletonToggle.addEventListener("click", () => {
    const { viewportMode } = getState();
    const { showMesh, showSkeleton } = getToggleFlags(viewportMode);
    const nextShowMesh = showMesh;
    const nextShowSkeleton = !showSkeleton;

    const nextMode = nextShowMesh && nextShowSkeleton
      ? "both"
      : nextShowMesh
      ? "mesh"
      : nextShowSkeleton
      ? "skeleton"
      : "mesh";

    setViewportMode(nextMode);
  });

  viewToggle.appendChild(meshToggle);
  viewToggle.appendChild(skeletonToggle);
  header.appendChild(viewToggle);
  container.appendChild(header);

  const tabsRow = document.createElement("div");
  tabsRow.className = "cs-inspector-tabs";
  container.appendChild(tabsRow);

  const panelsHost = document.createElement("div");
  panelsHost.className = "cs-inspector-panels";
  container.appendChild(panelsHost);

  const tabs = [
    { id: "bodyPlan", label: "Body Plan" },
    { id: "skeleton", label: "Skeleton" },
    { id: "bodyParts", label: "Body Parts" },
    { id: "materials", label: "Materials" },
    { id: "behavior", label: "Behavior" },
  ];

  // Create panel instances.
  const panelInstances = {
    bodyPlan: createBodyPlanPanel(),
    skeleton: createSkeletonPanel(),
    bodyParts: createBodyPartsPanel(),
    materials: createMaterialsPanel(),
    behavior: createBehaviorPanel(),
  };

  let activeTabId = "bodyPlan";

  function renderTabs() {
    tabsRow.innerHTML = "";

    for (const tab of tabs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cs-tab-button";
      if (tab.id === activeTabId) {
        btn.classList.add("is-active");
      }
      btn.textContent = tab.label;
      btn.addEventListener("click", () => {
        if (activeTabId !== tab.id) {
          activeTabId = tab.id;
          renderTabs();
          renderPanels(getLastState());
        }
      });
      tabsRow.appendChild(btn);
    }
  }

  let lastState = null;
  function getLastState() {
    return lastState;
  }

  function updateInspectorViewToggle(mode) {
    const { showMesh, showSkeleton } = getToggleFlags(mode);
    meshToggle.classList.toggle("is-active", showMesh);
    meshToggle.setAttribute("aria-pressed", showMesh ? "true" : "false");
    skeletonToggle.classList.toggle("is-active", showSkeleton);
    skeletonToggle.setAttribute("aria-pressed", showSkeleton ? "true" : "false");
  }

  function renderPanels(state) {
    panelsHost.innerHTML = "";

    const panel = panelInstances[activeTabId];
    if (!panel) {
      const msg = document.createElement("div");
      msg.className = "cs-panel-empty";
      msg.textContent = "No panel for tab: " + activeTabId;
      panelsHost.appendChild(msg);
      return;
    }

    // Ensure the panel has a root element and update function.
    if (!panel.element) {
      panel.element = document.createElement("div");
      panel.element.textContent = "Panel missing element implementation.";
    }

    if (typeof panel.update === "function") {
      panel.update(state);
    }

    panelsHost.appendChild(panel.element);
  }

  function handleStateChange(state) {
    lastState = state;
    updateInspectorViewToggle(state.viewportMode);
    renderPanels(state);
  }

  // Initial tabs + subscription.
  renderTabs();
  const unsubscribe = subscribe(handleStateChange);

  return {
    element: container,
    destroy() {
      unsubscribe();
    },
  };
}
