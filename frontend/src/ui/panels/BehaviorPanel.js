import { getState, updateCurrentBlueprint } from "../../studioState.js";
import { updateViewportFromBlueprint } from "../../viewport/viewportBridge.js";

/**
 * Behavior panel – editable behavior presets for the creature.
 *
 * Phase 7 upgrades this panel from a read-only summary to a small editor:
 * - Gait name (string used by locomotion systems).
 * - Idle behaviors (comma-separated list).
 * - Special interactions (comma-separated list).
 * - Tags (comma-separated list for high-level classification).
 *
 * These values are stored under `blueprint.behaviorPresets`. They do not
 * yet drive animation inside CreatureStudio, but they are fully persisted
 * and ready for future runtime behavior systems.
 */
export function createBehaviorPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-behavior";

  const title = document.createElement("h2");
  title.textContent = "Behavior Presets";
  root.appendChild(title);

  const headerSection = document.createElement("section");
  headerSection.className = "cs-panel-section cs-panel-behavior-header";
  root.appendChild(headerSection);

  const controlsRow = document.createElement("div");
  controlsRow.className = "cs-form-row cs-form-row-buttons";
  headerSection.appendChild(controlsRow);

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "cs-button cs-button-secondary";
  previewButton.textContent = "Update Preview";
  controlsRow.appendChild(previewButton);

  const headerHint = document.createElement("p");
  headerHint.className = "cs-panel-hint";
  headerHint.textContent =
    "Edit high-level behavior presets for this species. Preview currently rebuilds the mesh; future phases may also wire these into animation.";
  headerSection.appendChild(headerHint);

  const content = document.createElement("section");
  content.className = "cs-panel-section";
  root.appendChild(content);

  previewButton.addEventListener("click", () => {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (!blueprint) return;
    updateViewportFromBlueprint(blueprint);
  });

  function parseList(value) {
    if (typeof value !== "string") return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  function joinList(list) {
    if (!Array.isArray(list) || !list.length) return "";
    return list.join(", ");
  }

  function applyBehaviorChange(partial) {
    updateCurrentBlueprint((current) => {
      if (!current) return current;
      const currentPresets = current.behaviorPresets || {};
      return {
        ...current,
        behaviorPresets: {
          ...currentPresets,
          ...partial,
        },
      };
    });
  }

  function update(state) {
    content.innerHTML = "";
    const blueprint = state.currentBlueprint;
    if (!blueprint) {
      const msg = document.createElement("p");
      msg.textContent = "No blueprint loaded.";
      content.appendChild(msg);
      return;
    }

    const behavior = blueprint.behaviorPresets || {};
    const form = document.createElement("div");
    form.className = "cs-behavior-form";
    content.appendChild(form);

    const gaitRow = document.createElement("div");
    gaitRow.className = "cs-form-row";
    form.appendChild(gaitRow);

    const gaitLabel = document.createElement("label");
    gaitLabel.textContent = "Gait pattern";
    gaitRow.appendChild(gaitLabel);

    const gaitInput = document.createElement("input");
    gaitInput.type = "text";
    gaitInput.className = "cs-input";
    gaitInput.placeholder = "e.g. elephant_default";
    gaitInput.value = behavior.gait || "";
    gaitRow.appendChild(gaitInput);

    gaitInput.addEventListener("change", () => {
      applyBehaviorChange({ gait: gaitInput.value.trim() || undefined });
    });

    const idleRow = document.createElement("div");
    idleRow.className = "cs-form-row";
    form.appendChild(idleRow);

    const idleLabel = document.createElement("label");
    idleLabel.textContent = "Idle behaviors";
    idleRow.appendChild(idleLabel);

    const idleInput = document.createElement("textarea");
    idleInput.className = "cs-input cs-input-multiline";
    idleInput.rows = 2;
    idleInput.placeholder = "Comma-separated, e.g. ear_fan, trunk_sway, weight_shift";
    idleInput.value = joinList(behavior.idleBehaviors || []);
    idleRow.appendChild(idleInput);

    idleInput.addEventListener("change", () => {
      const list = parseList(idleInput.value);
      applyBehaviorChange({ idleBehaviors: list });
    });

    const specialRow = document.createElement("div");
    specialRow.className = "cs-form-row";
    form.appendChild(specialRow);

    const specialLabel = document.createElement("label");
    specialLabel.textContent = "Special interactions";
    specialRow.appendChild(specialLabel);

    const specialInput = document.createElement("textarea");
    specialInput.className = "cs-input cs-input-multiline";
    specialInput.rows = 2;
    specialInput.placeholder = "Comma-separated, e.g. drink_from_pond, spray_water";
    specialInput.value = joinList(behavior.specialInteractions || []);
    specialRow.appendChild(specialInput);

    specialInput.addEventListener("change", () => {
      const list = parseList(specialInput.value);
      applyBehaviorChange({ specialInteractions: list });
    });

    const tagsRow = document.createElement("div");
    tagsRow.className = "cs-form-row";
    form.appendChild(tagsRow);

    const tagsLabel = document.createElement("label");
    tagsLabel.textContent = "Tags";
    tagsRow.appendChild(tagsLabel);

    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.className = "cs-input";
    tagsInput.placeholder = "Comma-separated, e.g. quadruped, reference, elephant";
    tagsInput.value = joinList(behavior.tags || blueprint.meta?.tags || []);
    tagsRow.appendChild(tagsInput);

    tagsInput.addEventListener("change", () => {
      const list = parseList(tagsInput.value);
      applyBehaviorChange({ tags: list });
    });

    const summarySection = document.createElement("section");
    summarySection.className = "cs-panel-subsection cs-behavior-summary";
    content.appendChild(summarySection);

    const summaryTitle = document.createElement("h3");
    summaryTitle.textContent = "Current preset summary";
    summarySection.appendChild(summaryTitle);

    const list = document.createElement("dl");
    list.className = "cs-definition-list";

    const add = (label, value) => {
      if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
        return;
      }
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      if (Array.isArray(value)) {
        dd.textContent = value.join(", ");
      } else {
        dd.textContent = String(value);
      }
      list.appendChild(dt);
      list.appendChild(dd);
    };

    add("Gait", behavior.gait);
    add("Idle behaviors", behavior.idleBehaviors);
    add("Special interactions", behavior.specialInteractions);
    add("Tags", behavior.tags || blueprint.meta?.tags);

    if (list.children.length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "No behavior presets defined.";
      summarySection.appendChild(msg);
    } else {
      summarySection.appendChild(list);
    }
  }

  return {
    element: root,
    update,
  };
}
