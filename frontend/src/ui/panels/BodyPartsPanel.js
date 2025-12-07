import { getState, updateCurrentBlueprint, setDebugIsolatePart } from "../../studioState.js";
import { updateViewportFromBlueprint } from "../../viewport/viewportBridge.js";

/**
 * Body Parts panel (Phase 6)
 *
 * This simplified panel displays a list of body parts for both legacy and
 * anatomy‑V2 blueprints. It also exposes a handful of quick adjust
 * sliders that modify high‑impact proportions (global scale, limb
 * thickness, trunk thickness, spine thickness, and wing span). When a
 * body part row is clicked, the corresponding part is isolated in the
 * viewport via setDebugIsolatePart().
 */
export function createBodyPartsPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-body-parts";

  const title = document.createElement("h2");
  title.textContent = "Body Parts";
  root.appendChild(title);

  // Quick Adjust section
  const quickSection = document.createElement("section");
  quickSection.className = "cs-panel-section cs-panel-quick-adjust";
  root.appendChild(quickSection);

  const quickHeading = document.createElement("h3");
  quickHeading.textContent = "Quick Adjust";
  quickSection.appendChild(quickHeading);

  const quickCopy = document.createElement("p");
  quickCopy.className = "cs-panel-hint";
  quickCopy.textContent =
    "Tweak a few high‑impact proportions for the current creature. Adjust the sliders, then click “Update Preview” to rebuild the 3D view.";
  quickSection.appendChild(quickCopy);

  const sliderGrid = document.createElement("div");
  sliderGrid.className = "cs-quick-adjust-grid";
  quickSection.appendChild(sliderGrid);

  const sliders = {};

  function createSliderRow(labelText, key, min, max, step) {
    const row = document.createElement("div");
    row.className = "cs-quick-adjust-row";
    sliderGrid.appendChild(row);

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
  }

  // Create quick adjust sliders. Values loosely based on typical creature sizes.
  createSliderRow("Global scale", "globalScale", 0.5, 1.5, 0.01);
  createSliderRow("Spine thickness", "spineRadius", 0.2, 0.8, 0.01);
  createSliderRow("Front legs thickness", "frontLegRadius", 0.15, 0.7, 0.01);
  createSliderRow("Back legs thickness", "backLegRadius", 0.15, 0.7, 0.01);
  createSliderRow("Trunk thickness", "trunkRadius", 0.1, 0.6, 0.01);
  createSliderRow("Wing span", "wingSpan", 0.5, 2.5, 0.05);

  const buttonsRow = document.createElement("div");
  buttonsRow.className = "cs-quick-adjust-buttons";
  quickSection.appendChild(buttonsRow);

  const updatePreviewButton = document.createElement("button");
  updatePreviewButton.type = "button";
  updatePreviewButton.className = "cs-button cs-button-secondary cs-quick-adjust-preview-button";
  updatePreviewButton.textContent = "Update Preview";
  buttonsRow.appendChild(updatePreviewButton);

  // Content section lists body parts.
  const content = document.createElement("section");
  content.className = "cs-panel-section cs-panel-body-parts-content";
  root.appendChild(content);

  // Helper: set slider values from blueprint values.
  function setSliderValueFromBlueprint(key, value) {
    const slider = sliders[key];
    if (!slider) return;
    const clamped = Math.min(slider.max, Math.max(slider.min, value));
    slider.input.value = String(clamped);
    slider.valueSpan.textContent = clamped.toFixed(2);
  }

  // Synchronize slider positions from blueprint state.
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

    // Average wing span across all wing parts.
    let sum = 0;
    let count = 0;
    if (Array.isArray(blueprint.bodyPartsV2)) {
      blueprint.bodyPartsV2.forEach((part) => {
        if (part && part.generator === "wingGenerator") {
          const span = part.options && typeof part.options.span === "number" ? part.options.span : null;
          if (typeof span === "number") {
            sum += span;
            count++;
          }
        }
      });
    }
    const avg = count > 0 ? sum / count : 1.0;
    setSliderValueFromBlueprint("wingSpan", avg);
  }

  // Apply slider values back into the blueprint working copy.
  function applyQuickAdjustChanges() {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (!blueprint || !blueprint.sizes) {
      return;
    }
    const snapshot = {};
    Object.keys(sliders).forEach((key) => {
      const slider = sliders[key];
      const val = Number(slider.input.value);
      snapshot[key] = Number.isNaN(val) ? slider.min : val;
    });

    // Update sizes.byChain radii and globalScale for legacy and V2 blueprints.
    updateCurrentBlueprint((current) => {
      if (!current || !current.sizes) return current;
      const sizes = current.sizes;
      const byChain = sizes.byChain || {};
      const nextByChain = { ...byChain };
      const nextSizes = { ...sizes, byChain: nextByChain };
      if (typeof snapshot.globalScale === "number") nextSizes.globalScale = snapshot.globalScale;
      if (typeof snapshot.spineRadius === "number") {
        const existing = nextByChain.spine || {};
        nextByChain.spine = { ...existing, radius: snapshot.spineRadius };
      }
      if (typeof snapshot.frontLegRadius === "number") {
        const eFL = nextByChain.frontLegL || {};
        const eFR = nextByChain.frontLegR || {};
        nextByChain.frontLegL = { ...eFL, radius: snapshot.frontLegRadius };
        nextByChain.frontLegR = { ...eFR, radius: snapshot.frontLegRadius };
      }
      if (typeof snapshot.backLegRadius === "number") {
        const eBL = nextByChain.backLegL || {};
        const eBR = nextByChain.backLegR || {};
        nextByChain.backLegL = { ...eBL, radius: snapshot.backLegRadius };
        nextByChain.backLegR = { ...eBR, radius: snapshot.backLegRadius };
      }
      if (typeof snapshot.trunkRadius === "number") {
        const eTrunk = nextByChain.trunk || {};
        nextByChain.trunk = { ...eTrunk, radius: snapshot.trunkRadius };
      }
      return { ...current, sizes: nextSizes };
    });

    // Update wing span on bodyPartsV2 (if present)
    if (typeof snapshot.wingSpan === "number") {
      const spanVal = snapshot.wingSpan;
      updateCurrentBlueprint((current) => {
        if (!current || !Array.isArray(current.bodyPartsV2)) return current;
        const nextParts = current.bodyPartsV2.map((p) => {
          if (p && p.generator === "wingGenerator") {
            const opts = p.options ? { ...p.options, span: spanVal } : { span: spanVal };
            return { ...p, options: opts };
          }
          return p;
        });
        return { ...current, bodyPartsV2: nextParts };
      });
    }
  }

  // Clicking update preview triggers a rebuild in the viewport.
  updatePreviewButton.addEventListener("click", () => {
    const state = getState();
    const blueprint = state.currentBlueprint;
    if (blueprint) {
      updateViewportFromBlueprint(blueprint);
    }
  });

  // Helper to summarize options for display.
  function summarizeOptions(options) {
    const highlights = [];
    if (!options) return "no options";
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
    if (typeof options.span === "number") {
      highlights.push(`span ${options.span}`);
    }
    if (typeof options.rings === "number") {
      highlights.push(`rings ${options.rings}`);
    }
    return highlights.length ? highlights.join(", ") : "no options";
  }

  function update(state) {
    const blueprint = state.currentBlueprint;
    content.innerHTML = "";
    if (!blueprint) {
      const msg = document.createElement("p");
      msg.textContent = "No blueprint loaded.";
      content.appendChild(msg);
      return;
    }
    const useV2 = Array.isArray(blueprint.bodyPartsV2) && blueprint.bodyPartsV2.length > 0;
    if (!useV2 && !blueprint.bodyParts) {
      const msg = document.createElement("p");
      msg.textContent = "No body parts defined for this blueprint.";
      content.appendChild(msg);
      syncSlidersFromBlueprint(blueprint);
      return;
    }

    // Build summary list
    const summarySection = document.createElement("section");
    summarySection.className = "cs-panel-subsection cs-panel-body-parts-summary";
    const summaryTitle = document.createElement("h3");
    summaryTitle.textContent = "Body parts overview";
    summarySection.appendChild(summaryTitle);
    const summaryHint = document.createElement("p");
    summaryHint.className = "cs-panel-hint";
    summaryHint.textContent =
      "Each part lists its generator, chain and bone count, plus key options. Click a row to isolate the part in the viewport.";
    summarySection.appendChild(summaryHint);
    const list = document.createElement("ul");
    list.className = "cs-body-parts-summary-list";
    // Helper to append a row
    function appendRow(partName, generator, chainName, bonesCount, opts) {
      const li = document.createElement("li");
      li.className = "cs-body-part-summary-row";
      const nameSpan = document.createElement("span");
      nameSpan.className = "cs-body-part-name";
      nameSpan.textContent = partName;
      li.appendChild(nameSpan);
      const genSpan = document.createElement("span");
      genSpan.className = "cs-body-part-summary";
      genSpan.textContent = generator || "unknown";
      li.appendChild(genSpan);
      const chainSpan = document.createElement("span");
      chainSpan.className = "cs-body-part-chain";
      const chainLabel = chainName ? `${chainName} (${bonesCount} bones)` : "no chain";
      chainSpan.textContent = chainLabel;
      li.appendChild(chainSpan);
      const optionsSpan = document.createElement("span");
      optionsSpan.className = "cs-body-part-options";
      optionsSpan.textContent = summarizeOptions(opts);
      li.appendChild(optionsSpan);
      // Click to isolate this part
      li.addEventListener("click", () => {
        setDebugIsolatePart(partName);
        updateViewportFromBlueprint(blueprint);
      });
      list.appendChild(li);
    }
    if (useV2) {
      // Map chain names to bone count using chainsV2
      const chainCounts = {};
      if (Array.isArray(blueprint.chainsV2)) {
        blueprint.chainsV2.forEach((ch) => {
          if (ch && ch.name) {
            chainCounts[ch.name] = Array.isArray(ch.bones) ? ch.bones.length : 0;
          }
        });
      }
      blueprint.bodyPartsV2.forEach((part) => {
        if (!part) return;
        const bones = chainCounts[part.chain] || 0;
        appendRow(part.name || part.chain || part.generator, part.generator, part.chain, bones, part.options);
      });
    } else {
      // Legacy bodyParts object
      const entries = Object.entries(blueprint.bodyParts || {}).sort(([a], [b]) => a.localeCompare(b));
      entries.forEach(([partName, partDef]) => {
        const gen = partDef && partDef.generator ? partDef.generator : partDef.type;
        const chainName = partDef && partDef.chain;
        let bonesCount = 0;
        if (chainName) {
          const chainBones =
            (blueprint.chains && blueprint.chains[chainName]) ||
            (blueprint.chains && blueprint.chains.extraChains && blueprint.chains.extraChains[chainName]) ||
            [];
          bonesCount = Array.isArray(chainBones) ? chainBones.length : 0;
        }
        const opts = partDef && partDef.options;
        appendRow(partName, gen, chainName, bonesCount, opts);
      });
    }
    summarySection.appendChild(list);
    content.appendChild(summarySection);

    syncSlidersFromBlueprint(blueprint);
  }

  return {
    element: root,
    update,
  };
}