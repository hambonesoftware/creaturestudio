import { getState, updateCurrentBlueprint } from "../../studioState.js";
import { updateViewportFromBlueprint } from "../../viewport/viewportBridge.js";

/**
 * Body Parts panel
 *
 * Phase 5 adds a "Quick Adjust" section above the read-only list of body parts.
 * The quick adjust sliders edit a few high-impact fields on the active
 * blueprint (sizes.defaultRadius and a handful of chain radii), while the
 * list below continues to show the bodyParts keys and basic types.
 */
export function createBodyPartsPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-body-parts";

  const title = document.createElement("h2");
  title.textContent = "Body Parts";
  root.appendChild(title);

  // Quick Adjust section (Phase 5).
  const quickSection = document.createElement("section");
  quickSection.className = "cs-panel-section cs-panel-quick-adjust";

  const quickHeading = document.createElement("h3");
  quickHeading.textContent = "Quick Adjust (Phase 5)";
  quickSection.appendChild(quickHeading);

  const quickCopy = document.createElement("p");
  quickCopy.className = "cs-panel-hint";
  quickCopy.textContent =
    "Tweak a few high-impact proportions for the current creature. Adjust the sliders, then click “Update Preview” to rebuild the 3D view.";
  quickSection.appendChild(quickCopy);

  const sliderGrid = document.createElement("div");
  sliderGrid.className = "cs-quick-adjust-grid";
  quickSection.appendChild(sliderGrid);

  const sliders = {};

  function createSliderRow(labelText, key, min, max, step) {
    const row = document.createElement("div");
    row.className = "cs-quick-adjust-row";

    const label = document.createElement("label");
    label.className = "cs-quick-adjust-label";
    label.textContent = labelText;
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String((min + max) * 0.5);
    input.className = "cs-quick-adjust-slider";
    row.appendChild(input);

    const valueSpan = document.createElement("span");
    valueSpan.className = "cs-quick-adjust-value";
    valueSpan.textContent = Number(input.value).toFixed(2);
    row.appendChild(valueSpan);

    sliders[key] = {
      input,
      valueSpan,
      min,
      max,
      step,
    };

    input.addEventListener("input", () => {
      valueSpan.textContent = Number(input.value).toFixed(2);
      applyQuickAdjustChanges();
    });

    sliderGrid.appendChild(row);
  }

  // A few obvious proportions mapped to blueprint.sizes.*
  createSliderRow("Global scale", "globalScale", 0.5, 1.5, 0.01);
  createSliderRow("Spine thickness", "spineRadius", 0.2, 0.8, 0.01);
  createSliderRow("Front legs thickness", "frontLegRadius", 0.15, 0.7, 0.01);
  createSliderRow("Back legs thickness", "backLegRadius", 0.15, 0.7, 0.01);
  createSliderRow("Trunk thickness", "trunkRadius", 0.1, 0.6, 0.01);

  const buttonsRow = document.createElement("div");
  buttonsRow.className = "cs-quick-adjust-buttons";

  const updatePreviewButton = document.createElement("button");
  updatePreviewButton.type = "button";
  updatePreviewButton.className = "cs-button cs-button-secondary cs-quick-adjust-preview-button";
  updatePreviewButton.textContent = "Update Preview";
  buttonsRow.appendChild(updatePreviewButton);

  quickSection.appendChild(buttonsRow);

  root.appendChild(quickSection);

  // Body parts list section (read-only, as in earlier phases).
  const content = document.createElement("section");
  content.className = "cs-panel-section";
  root.appendChild(content);
function classifyBodyPartKey(key) {
  const lower = String(key || "").toLowerCase();
  if (lower.includes("torso") || lower.includes("barrel") || lower.includes("body")) return "Torso";
  if (lower.includes("leg") || lower.includes("arm") || lower.includes("limb")) return "Limbs";
  if (lower.includes("head") || lower.includes("neck") || lower.includes("ear") || lower.includes("face")) return "Head & Neck";
  if (lower.includes("tail")) return "Tail";
  if (lower.includes("trunk") || lower.includes("snout")) return "Trunk";
  if (lower.includes("wing")) return "Wings";
  return "Other";
}


  function setSliderValueFromBlueprint(key, value) {
    const slider = sliders[key];
    if (!slider) {
      return;
    }
    const clamped = Math.min(slider.max, Math.max(slider.min, value));
    slider.input.value = String(clamped);
    slider.valueSpan.textContent = clamped.toFixed(2);
  }

  function syncSlidersFromBlueprint(blueprint) {
    if (!blueprint || !blueprint.sizes) {
      return;
    }

    const sizes = blueprint.sizes;
    const byChain = sizes.byChain || {};

    const globalScale =
      typeof sizes.globalScale === "number" && Number.isFinite(sizes.globalScale)
        ? sizes.globalScale
        : 1.0;

    const defaultRadius =
      typeof sizes.defaultRadius === "number" && Number.isFinite(sizes.defaultRadius)
        ? sizes.defaultRadius
        : 0.35;

    const spineRadius =
      byChain.spine && typeof byChain.spine.radius === "number"
        ? byChain.spine.radius
        : defaultRadius;

    const frontLegRadius =
      byChain.frontLegL && typeof byChain.frontLegL.radius === "number"
        ? byChain.frontLegL.radius
        : defaultRadius;

    const backLegRadius =
      byChain.backLegL && typeof byChain.backLegL.radius === "number"
        ? byChain.backLegL.radius
        : defaultRadius;

    const trunkRadius =
      byChain.trunk && typeof byChain.trunk.radius === "number"
        ? byChain.trunk.radius
        : defaultRadius;

    setSliderValueFromBlueprint("globalScale", globalScale);
    setSliderValueFromBlueprint("spineRadius", spineRadius);
    setSliderValueFromBlueprint("frontLegRadius", frontLegRadius);
    setSliderValueFromBlueprint("backLegRadius", backLegRadius);
    setSliderValueFromBlueprint("trunkRadius", trunkRadius);
  }

  function applyQuickAdjustChanges() {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (!blueprint || !blueprint.sizes) {
      return;
    }

    const slidersSnapshot = {};
    Object.keys(sliders).forEach((key) => {
      const slider = sliders[key];
      if (!slider) {
        return;
      }
      const numericValue = Number(slider.input.value);
      slidersSnapshot[key] = Number.isNaN(numericValue) ? slider.min : numericValue;
    });

    updateCurrentBlueprint((current) => {
      if (!current || !current.sizes) {
        return current;
      }

      const sizes = current.sizes;
      const byChain = sizes.byChain || {};
      const nextByChain = { ...byChain };

      const nextSizes = {
        ...sizes,
        byChain: nextByChain,
      };

      if (typeof slidersSnapshot.globalScale === "number") {
        nextSizes.globalScale = slidersSnapshot.globalScale;
      }

      if (typeof slidersSnapshot.spineRadius === "number") {
        const existingSpine = nextByChain.spine || {};
        nextByChain.spine = {
          ...existingSpine,
          radius: slidersSnapshot.spineRadius,
        };
      }

      if (typeof slidersSnapshot.frontLegRadius === "number") {
        const existingFrontL = nextByChain.frontLegL || {};
        const existingFrontR = nextByChain.frontLegR || {};
        nextByChain.frontLegL = {
          ...existingFrontL,
          radius: slidersSnapshot.frontLegRadius,
        };
        nextByChain.frontLegR = {
          ...existingFrontR,
          radius: slidersSnapshot.frontLegRadius,
        };
      }

      if (typeof slidersSnapshot.backLegRadius === "number") {
        const existingBackL = nextByChain.backLegL || {};
        const existingBackR = nextByChain.backLegR || {};
        nextByChain.backLegL = {
          ...existingBackL,
          radius: slidersSnapshot.backLegRadius,
        };
        nextByChain.backLegR = {
          ...existingBackR,
          radius: slidersSnapshot.backLegRadius,
        };
      }

      if (typeof slidersSnapshot.trunkRadius === "number") {
        const existingTrunk = nextByChain.trunk || {};
        nextByChain.trunk = {
          ...existingTrunk,
          radius: slidersSnapshot.trunkRadius,
        };
      }

      return {
        ...current,
        sizes: nextSizes,
      };
    });
  }

  updatePreviewButton.addEventListener("click", () => {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (!blueprint) {
      return;
    }
    updateViewportFromBlueprint(blueprint);
  });

  function update(state) {
    const blueprint = state.currentBlueprint;

    content.innerHTML = "";

    if (!blueprint || !blueprint.bodyParts) {
      const msg = document.createElement("p");
      msg.textContent = "No body parts defined for this blueprint.";
      content.appendChild(msg);
    } else {
      const summarySection = document.createElement("section");
      summarySection.className = "cs-panel-subsection cs-panel-body-parts-summary";
      const summaryTitle = document.createElement("h3");
      summaryTitle.textContent = "Resolved parts overview";
      summarySection.appendChild(summaryTitle);

      const summaryHint = document.createElement("p");
      summaryHint.className = "cs-panel-hint";
      summaryHint.textContent =
        "Each part lists its generator, chain, and a few headline options to help debug geometry choices.";
      summarySection.appendChild(summaryHint);

      const summaryList = document.createElement("ul");
      summaryList.className = "cs-body-parts-summary-list";

      const summarizeOptions = (options = {}) => {
        const highlights = [];
        if (Array.isArray(options.radii) && options.radii.length) {
          highlights.push(`radii x${options.radii.length}`);
        }
        if (typeof options.sides === "number") {
          highlights.push(`sides ${options.sides}`);
        }
        if (typeof options.rumpBulgeDepth === "number") {
          highlights.push(`rumpBulge ${options.rumpBulgeDepth}`);
        }
        if (typeof options.baseRadius === "number") {
          highlights.push(`baseRadius ${options.baseRadius}`);
        }
        if (typeof options.tipRadius === "number") {
          highlights.push(`tipRadius ${options.tipRadius}`);
        }
        return highlights.length ? highlights.join(", ") : "no options";
      };

      Object.entries(blueprint.bodyParts)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([partKey, partDef]) => {
          const row = document.createElement("li");
          row.className = "cs-body-part-summary-row";

          const nameSpan = document.createElement("span");
          nameSpan.className = "cs-body-part-name";
          nameSpan.textContent = partKey;
          row.appendChild(nameSpan);

          const generatorSpan = document.createElement("span");
          generatorSpan.className = "cs-body-part-summary";
          generatorSpan.textContent = partDef?.generator || "unknown";
          row.appendChild(generatorSpan);

          const chainSpan = document.createElement("span");
          chainSpan.className = "cs-body-part-chain";
          const chainBones =
            blueprint.chains?.[partDef?.chain] ||
            blueprint.chains?.extraChains?.[partDef?.chain] ||
            [];
          const chainLabel = partDef?.chain ? `${partDef.chain} (${chainBones.length} bones)` : "no chain";
          chainSpan.textContent = chainLabel;
          row.appendChild(chainSpan);

          const optionsSpan = document.createElement("span");
          optionsSpan.className = "cs-body-part-options";
          const options = partDef && typeof partDef.options === "object" ? partDef.options : {};
          optionsSpan.textContent = summarizeOptions(options);
          row.appendChild(optionsSpan);

          summaryList.appendChild(row);
        });

      summarySection.appendChild(summaryList);
      content.appendChild(summarySection);

      const list = document.createElement("ul");
      list.className = "cs-body-parts-list";

      const partKeys = Object.keys(blueprint.bodyParts).sort();
      partKeys.forEach((key) => {
        const bodyPartDef = blueprint.bodyParts[key];

        const li = document.createElement("li");
        li.className = "cs-body-part-row";

        const nameSpan = document.createElement("span");
        nameSpan.className = "cs-body-part-name";
        nameSpan.textContent = key;
        li.appendChild(nameSpan);

        const summarySpan = document.createElement("span");
        summarySpan.className = "cs-body-part-summary";
        if (bodyPartDef && typeof bodyPartDef.type === "string") {
          summarySpan.textContent = bodyPartDef.type;
        } else if (bodyPartDef && typeof bodyPartDef.generator === "string") {
          summarySpan.textContent = bodyPartDef.generator;
        } else {
          summarySpan.textContent = "Custom part";
        }
        li.appendChild(summarySpan);

        list.appendChild(li);
      });

      content.appendChild(list);

  const editorHeading = document.createElement("h3");
  editorHeading.textContent = "Body part details";
  editorHeading.className = "cs-subheading";
  content.appendChild(editorHeading);

  const editorHint = document.createElement("p");
  editorHint.className = "cs-panel-hint";
  editorHint.textContent =
    "Each body part is defined by a generator, an optional chain, and a bag of per-part options. " +
    "Editing these values updates the blueprint immediately; click \"Update Preview\" above to rebuild the mesh.";
  content.appendChild(editorHint);

  const editorContainer = document.createElement("div");
  editorContainer.className = "cs-body-part-editor";
  content.appendChild(editorContainer);

  let lastGroupLabel = null;
  const partKeysForEditor = Object.keys(blueprint.bodyParts).sort();
  partKeysForEditor.forEach((key) => {
    const bodyPartDef = blueprint.bodyParts[key] || {};
    const groupLabel = classifyBodyPartKey(key);

    if (groupLabel !== lastGroupLabel) {
      const groupHeader = document.createElement("h4");
      groupHeader.className = "cs-body-part-group";
      groupHeader.textContent = groupLabel;
      editorContainer.appendChild(groupHeader);
      lastGroupLabel = groupLabel;
    }

    const row = document.createElement("div");
    row.className = "cs-body-part-editor-row";
    editorContainer.appendChild(row);

    const nameHeading = document.createElement("h5");
    nameHeading.textContent = key;
    row.appendChild(nameHeading);

    const metaRow = document.createElement("div");
    metaRow.className = "cs-form-row cs-form-row-inline";
    row.appendChild(metaRow);

    const genLabel = document.createElement("label");
    genLabel.textContent = "Generator";
    metaRow.appendChild(genLabel);

    const genInput = document.createElement("input");
    genInput.type = "text";
    genInput.className = "cs-input cs-input-generator";
    genInput.placeholder = "e.g. torso, limb, trunk, tail";
    genInput.value = bodyPartDef.generator || bodyPartDef.type || "";
    metaRow.appendChild(genInput);

    genInput.addEventListener("change", () => {
      const nextGenerator = genInput.value.trim() || undefined;
      updateCurrentBlueprint((current) => {
        if (!current || !current.bodyParts) return current;
        const existing = current.bodyParts[key] || {};
        return {
          ...current,
          bodyParts: {
            ...current.bodyParts,
            [key]: {
              ...existing,
              generator: nextGenerator,
            },
          },
        };
      });
    });

    const chainLabel = document.createElement("label");
    chainLabel.textContent = "Chain";
    metaRow.appendChild(chainLabel);

    const chainInput = document.createElement("input");
    chainInput.type = "text";
    chainInput.className = "cs-input cs-input-chain";
    chainInput.placeholder = "e.g. spine, frontLegL, tail";
    chainInput.value = bodyPartDef.chain || "";
    metaRow.appendChild(chainInput);

    chainInput.addEventListener("change", () => {
      const nextChain = chainInput.value.trim() || undefined;
      updateCurrentBlueprint((current) => {
        if (!current || !current.bodyParts) return current;
        const existing = current.bodyParts[key] || {};
        return {
          ...current,
          bodyParts: {
            ...current.bodyParts,
            [key]: {
              ...existing,
              chain: nextChain,
            },
          },
        };
      });
    });

    const options =
      bodyPartDef.options && typeof bodyPartDef.options === "object"
        ? bodyPartDef.options
        : {};

    const optionKeys = Object.keys(options);
    if (optionKeys.length) {
      const optionsBlock = document.createElement("div");
      optionsBlock.className = "cs-body-part-options-block";
      row.appendChild(optionsBlock);

      const optionsTitle = document.createElement("h6");
      optionsTitle.textContent = "Options";
      optionsBlock.appendChild(optionsTitle);

      optionKeys.sort().forEach((optKey) => {
        const optRow = document.createElement("div");
        optRow.className = "cs-form-row cs-form-row-inline";
        optionsBlock.appendChild(optRow);

        const optLabel = document.createElement("label");
        optLabel.textContent = optKey;
        optRow.appendChild(optLabel);

        const value = options[optKey];
        const input = document.createElement("input");
        input.className = "cs-input cs-input-option";

        const isNumeric =
          typeof value === "number" ||
          (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));

        if (isNumeric) {
          input.type = "number";
          input.step = "0.01";
          input.value = String(value);
        } else {
          input.type = "text";
          input.value = value == null ? "" : String(value);
        }

        optRow.appendChild(input);

        input.addEventListener("change", () => {
          const raw = input.value;
          let nextVal;
          if (isNumeric) {
            const num = Number(raw);
            nextVal = Number.isFinite(num) ? num : value;
          } else {
            nextVal = raw;
          }

          updateCurrentBlueprint((current) => {
            if (!current || !current.bodyParts) return current;
            const existingPart = current.bodyParts[key] || {};
            const existingOptions =
              existingPart.options && typeof existingPart.options === "object"
                ? existingPart.options
                : {};
            return {
              ...current,
              bodyParts: {
                ...current.bodyParts,
                [key]: {
                  ...existingPart,
                  options: {
                    ...existingOptions,
                    [optKey]: nextVal,
                  },
                },
              },
            };
          });
        });
      });
    }
  });
}

    if (blueprint) {
      syncSlidersFromBlueprint(blueprint);
    }
  }

  return {
    element: root,
    update,
  };
}
