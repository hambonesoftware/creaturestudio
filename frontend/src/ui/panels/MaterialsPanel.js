import { getState, updateCurrentBlueprint } from "../../studioState.js";
import { updateViewportFromBlueprint } from "../../viewport/viewportBridge.js";

/**
 * Materials panel – editable material slots defined in the blueprint.
 *
 * Phase 7 upgrades this panel so you can:
 * - Use a color picker to change each material's base color.
 * - Adjust roughness with a 0–1 slider.
 * - Adjust metalness with a 0–1 slider (backed by the `metallic` field).
 * - Click "Update Preview" to rebuild the 3D mesh material.
 */
export function createMaterialsPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-materials";

  const title = document.createElement("h2");
  title.textContent = "Materials";
  root.appendChild(title);

  const headerSection = document.createElement("section");
  headerSection.className = "cs-panel-section cs-panel-materials-header";
  root.appendChild(headerSection);

  const controlsRow = document.createElement("div");
  controlsRow.className = "cs-form-row cs-form-row-buttons";
  headerSection.appendChild(controlsRow);

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "cs-button cs-button-secondary";
  previewButton.textContent = "Update Preview";
  controlsRow.appendChild(previewButton);

  const previewHint = document.createElement("p");
  previewHint.className = "cs-panel-hint";
  previewHint.textContent =
    "Material edits update the blueprint immediately. Click “Update Preview” to rebuild the 3D mesh using the current surface material.";
  headerSection.appendChild(previewHint);

  const content = document.createElement("section");
  content.className = "cs-panel-section";
  root.appendChild(content);

  previewButton.addEventListener("click", () => {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (!blueprint) {
      return;
    }
    updateViewportFromBlueprint(blueprint);
  });

  function clamp01(value) {
    const v = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function normalizeColorHex(value) {
    if (typeof value !== "string") {
      return "#888888";
    }
    let v = value.trim();
    if (!v) return "#888888";
    if (!v.startsWith("#")) {
      v = "#" + v;
    }
    if (v.length === 4) {
      const r = v[1];
      const g = v[2];
      const b = v[3];
      v = "#" + r + r + g + g + b + b;
    }
    if (v.length !== 7) {
      return "#888888";
    }
    return v.toLowerCase();
  }

  function applyMaterialChange(slot, changes) {
    updateCurrentBlueprint((current) => {
      if (!current || !current.materials) {
        return current;
      }
      const materials = current.materials;
      const prevCfg = materials[slot] || {};

      const nextCfg = {
        ...prevCfg,
        ...changes,
      };

      if (Object.prototype.hasOwnProperty.call(changes, "metallic")) {
        nextCfg.metalness = changes.metallic;
      }

      return {
        ...current,
        materials: {
          ...materials,
          [slot]: nextCfg,
        },
      };
    });
  }

  function update(state) {
    content.innerHTML = "";
    const blueprint = state.currentBlueprint;
    if (!blueprint || !blueprint.materials) {
      const msg = document.createElement("p");
      msg.textContent = "No materials configuration available.";
      content.appendChild(msg);
      return;
    }

    const materials = blueprint.materials;
    const matNames = Object.keys(materials);
    if (matNames.length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "Materials configuration is empty.";
      content.appendChild(msg);
      return;
    }

    matNames.sort();

    const table = document.createElement("table");
    table.className = "cs-table cs-materials-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    [ "Slot", "Color", "Roughness", "Metalness" ].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const slot of matNames) {
      const cfg = materials[slot] || {};
      const tr = document.createElement("tr");

      const slotCell = document.createElement("td");
      slotCell.textContent = slot;
      tr.appendChild(slotCell);

      const colorCell = document.createElement("td");
      const colorWrapper = document.createElement("div");
      colorWrapper.className = "cs-color-editor";

      const initialColor = normalizeColorHex(cfg.color);
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "cs-input-color";
      colorInput.value = initialColor;

      const colorHexInput = document.createElement("input");
      colorHexInput.type = "text";
      colorHexInput.className = "cs-input cs-input-hex";
      colorHexInput.value = initialColor;

      colorInput.addEventListener("input", () => {
        const hex = normalizeColorHex(colorInput.value);
        colorHexInput.value = hex;
        applyMaterialChange(slot, { color: hex });
      });

      colorHexInput.addEventListener("change", () => {
        const hex = normalizeColorHex(colorHexInput.value);
        colorHexInput.value = hex;
        colorInput.value = hex;
        applyMaterialChange(slot, { color: hex });
      });

      colorWrapper.appendChild(colorInput);
      colorWrapper.appendChild(colorHexInput);
      colorCell.appendChild(colorWrapper);
      tr.appendChild(colorCell);

      const roughCell = document.createElement("td");
      const roughWrapper = document.createElement("div");
      roughWrapper.className = "cs-slider-editor";

      const roughnessValue = clamp01(
        typeof cfg.roughness === "number" ? cfg.roughness : 0.85
      );

      const roughSlider = document.createElement("input");
      roughSlider.type = "range";
      roughSlider.min = "0";
      roughSlider.max = "1";
      roughSlider.step = "0.01";
      roughSlider.value = String(roughnessValue);

      const roughReadout = document.createElement("span");
      roughReadout.className = "cs-slider-value";
      roughReadout.textContent = roughnessValue.toFixed(2);

      roughSlider.addEventListener("input", () => {
        const v = clamp01(parseFloat(roughSlider.value));
        roughReadout.textContent = v.toFixed(2);
      });

      roughSlider.addEventListener("change", () => {
        const v = clamp01(parseFloat(roughSlider.value));
        applyMaterialChange(slot, { roughness: v });
      });

      roughWrapper.appendChild(roughSlider);
      roughWrapper.appendChild(roughReadout);
      roughCell.appendChild(roughWrapper);
      tr.appendChild(roughCell);

      const metalCell = document.createElement("td");
      const metalWrapper = document.createElement("div");
      metalWrapper.className = "cs-slider-editor";

      const initialMetal =
        typeof cfg.metallic === "number"
          ? clamp01(cfg.metallic)
          : typeof cfg.metalness === "number"
          ? clamp01(cfg.metalness)
          : 0.0;

      const metalSlider = document.createElement("input");
      metalSlider.type = "range";
      metalSlider.min = "0";
      metalSlider.max = "1";
      metalSlider.step = "0.01";
      metalSlider.value = String(initialMetal);

      const metalReadout = document.createElement("span");
      metalReadout.className = "cs-slider-value";
      metalReadout.textContent = initialMetal.toFixed(2);

      metalSlider.addEventListener("input", () => {
        const v = clamp01(parseFloat(metalSlider.value));
        metalReadout.textContent = v.toFixed(2);
      });

      metalSlider.addEventListener("change", () => {
        const v = clamp01(parseFloat(metalSlider.value));
        applyMaterialChange(slot, { metallic: v });
      });

      metalWrapper.appendChild(metalSlider);
      metalWrapper.appendChild(metalReadout);
      metalCell.appendChild(metalWrapper);
      tr.appendChild(metalCell);

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    content.appendChild(table);
  }

  return {
    element: root,
    update,
  };
}
