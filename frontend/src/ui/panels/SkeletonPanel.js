import { getState, updateCurrentBlueprint } from "../../studioState.js";
import { updateViewportFromBlueprint } from "../../viewport/viewportBridge.js";

/****
 * Skeleton panel – summary plus editable bones and chains.
 *
 * Phase 7 upgrades this panel from a read-only summary to a simple editor
 * for the SpeciesBlueprint skeleton and chain definitions:
 * - Shows root, coordinate system, and a table of bones.
 * - Lets you pick a bone and adjust its parent and local position.
 * - Lets you edit the chains map (which bones each named chain follows).
 * - Provides an "Update Preview" button to rebuild the 3D creature.
 */
export function createSkeletonPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-skeleton";

  const title = document.createElement("h2");
  title.textContent = "Skeleton";
  root.appendChild(title);

  const summarySection = document.createElement("section");
  summarySection.className = "cs-panel-section";
  root.appendChild(summarySection);

  const tableSection = document.createElement("section");
  tableSection.className = "cs-panel-section";
  root.appendChild(tableSection);

  const editorSection = document.createElement("section");
  editorSection.className = "cs-panel-section cs-panel-skeleton-editor";
  root.appendChild(editorSection);

  function renderSummary(blueprint) {
    summarySection.innerHTML = "";

    if (!blueprint || !blueprint.skeleton || !Array.isArray(blueprint.skeleton.bones)) {
      const msg = document.createElement("p");
      msg.textContent = "No skeleton data found for this blueprint.";
      summarySection.appendChild(msg);
      return;
    }

    const skeleton = blueprint.skeleton;
    const bones = skeleton.bones || [];

    const summaryLine = document.createElement("p");
    const rootName = skeleton.root || "root";
    summaryLine.textContent = `Root: ${rootName} • Bones: ${bones.length}`;
    summarySection.appendChild(summaryLine);

    if (skeleton.coordinateSystem) {
      const coordPara = document.createElement("p");
      coordPara.className = "cs-panel-hint";
      coordPara.textContent = skeleton.coordinateSystem;
      summarySection.appendChild(coordPara);
    }
  }

  function renderTable(blueprint) {
    tableSection.innerHTML = "";

    if (!blueprint || !blueprint.skeleton || !Array.isArray(blueprint.skeleton.bones)) {
      return;
    }

    const bones = blueprint.skeleton.bones || [];
    if (!bones.length) {
      const msg = document.createElement("p");
      msg.textContent = "Skeleton has no bones.";
      tableSection.appendChild(msg);
      return;
    }

    const table = document.createElement("table");
    table.className = "cs-table cs-skeleton-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    [ "Bone", "Parent", "Position (x, y, z)" ].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const bone of bones) {
      const tr = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = bone.name || "";

      const parentCell = document.createElement("td");
      parentCell.textContent = bone.parent || "";

      const posCell = document.createElement("td");
      if (Array.isArray(bone.position)) {
        posCell.textContent = bone.position
          .map((v) => Number(v).toFixed(2))
          .join(", ");
      } else {
        posCell.textContent = "-";
      }

      tr.appendChild(nameCell);
      tr.appendChild(parentCell);
      tr.appendChild(posCell);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    tableSection.appendChild(table);
  }

  function renderEditor(blueprint) {
    editorSection.innerHTML = "";

    if (!blueprint || !blueprint.skeleton || !Array.isArray(blueprint.skeleton.bones)) {
      const msg = document.createElement("p");
      msg.textContent = "No editable skeleton data available.";
      editorSection.appendChild(msg);
      return;
    }

    const skeleton = blueprint.skeleton;
    const bones = skeleton.bones || [];
    const chains = blueprint.chains || {};
    const boneNames = bones
      .map((b) => (b && typeof b.name === "string" ? b.name : ""))
      .filter((name) => name.length > 0);

    if (!boneNames.length) {
      const msg = document.createElement("p");
      msg.textContent = "Skeleton has bones array but no named bones.";
      editorSection.appendChild(msg);
      return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Edit Bones & Chains";
    editorSection.appendChild(heading);

    const hint = document.createElement("p");
    hint.className = "cs-panel-hint";
    hint.textContent =
      "Select a bone to tweak its parent or local position. Edit chains to control which bones each body part follows. " +
      "Click “Update Preview” to rebuild the 3D creature using the current blueprint.";
    editorSection.appendChild(hint);

    // --- Bone editor ------------------------------------------------------
    const boneEditor = document.createElement("div");
    boneEditor.className = "cs-skeleton-bone-editor";
    editorSection.appendChild(boneEditor);

    // Row: bone selector
    const boneSelectRow = document.createElement("div");
    boneSelectRow.className = "cs-form-row";
    boneEditor.appendChild(boneSelectRow);

    const boneLabel = document.createElement("label");
    boneLabel.textContent = "Bone";
    boneSelectRow.appendChild(boneLabel);

    const boneSelect = document.createElement("select");
    boneSelect.className = "cs-select";
    boneSelectRow.appendChild(boneSelect);

    const defaultBoneName =
      (skeleton.root && boneNames.includes(skeleton.root) && skeleton.root) ||
      boneNames[0];

    for (const name of boneNames) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      boneSelect.appendChild(opt);
    }
    boneSelect.value = defaultBoneName || boneNames[0] || "";

    // Row: parent + position inputs
    const parentRow = document.createElement("div");
    parentRow.className = "cs-form-row cs-form-row-inline";
    boneEditor.appendChild(parentRow);

    const parentLabel = document.createElement("label");
    parentLabel.textContent = "Parent";
    parentRow.appendChild(parentLabel);

    const parentInput = document.createElement("input");
    parentInput.type = "text";
    parentInput.className = "cs-input cs-input-parent";
    parentInput.placeholder = "root";
    parentRow.appendChild(parentInput);

    const posRow = document.createElement("div");
    posRow.className = "cs-form-row cs-form-row-inline cs-form-row-position";
    boneEditor.appendChild(posRow);

    const posLabel = document.createElement("label");
    posLabel.textContent = "Position (x, y, z)";
    posRow.appendChild(posLabel);

    function makePosInput() {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.01";
      input.className = "cs-input cs-input-number";
      return input;
    }

    const posXInput = makePosInput();
    const posYInput = makePosInput();
    const posZInput = makePosInput();

    posRow.appendChild(posXInput);
    posRow.appendChild(posYInput);
    posRow.appendChild(posZInput);

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "cs-form-row cs-form-row-buttons";
    boneEditor.appendChild(buttonsRow);

    const applyBoneButton = document.createElement("button");
    applyBoneButton.type = "button";
    applyBoneButton.className = "cs-button cs-button-secondary";
    applyBoneButton.textContent = "Apply Bone Changes";
    buttonsRow.appendChild(applyBoneButton);

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "cs-button cs-button-secondary";
    previewButton.textContent = "Update Preview";
    buttonsRow.appendChild(previewButton);

    function findBoneByName(name) {
      return bones.find((b) => b && b.name === name) || null;
    }

    function syncInputsForBone(name) {
      const bone = findBoneByName(name);
      if (!bone) {
        parentInput.value = "";
        posXInput.value = "";
        posYInput.value = "";
        posZInput.value = "";
        return;
      }

      parentInput.value = bone.parent || "";
      const pos = Array.isArray(bone.position) ? bone.position : [0, 0, 0];
      posXInput.value = Number(pos[0] || 0).toFixed(2);
      posYInput.value = Number(pos[1] || 0).toFixed(2);
      posZInput.value = Number(pos[2] || 0).toFixed(2);
    }

    syncInputsForBone(boneSelect.value);

    boneSelect.addEventListener("change", () => {
      syncInputsForBone(boneSelect.value);
    });

    function parseNumberOrFallback(input, fallback) {
      const v = parseFloat(input.value);
      return Number.isFinite(v) ? v : fallback;
    }

    applyBoneButton.addEventListener("click", () => {
      const targetName = boneSelect.value;
      if (!targetName) {
        return;
      }

      const nextParent = parentInput.value.trim() || "root";
      const x = parseNumberOrFallback(posXInput, 0);
      const y = parseNumberOrFallback(posYInput, 0);
      const z = parseNumberOrFallback(posZInput, 0);

      updateCurrentBlueprint((current) => {
        if (!current || !current.skeleton || !Array.isArray(current.skeleton.bones)) {
          return current;
        }

        const nextBones = current.skeleton.bones.map((boneDef) => {
          if (!boneDef || boneDef.name !== targetName) {
            return boneDef;
          }

          return {
            ...boneDef,
            parent: nextParent,
            position: [x, y, z],
          };
        });

        return {
          ...current,
          skeleton: {
            ...current.skeleton,
            bones: nextBones,
          },
        };
      });
    });

    previewButton.addEventListener("click", () => {
      const state = getState();
      const blueprintForPreview = state.currentBlueprint;
      if (!blueprintForPreview) {
        return;
      }
      updateViewportFromBlueprint(blueprintForPreview);
    });

    // --- Chains editor ----------------------------------------------------
    const chainsSection = document.createElement("div");
    chainsSection.className = "cs-skeleton-chains-editor";
    editorSection.appendChild(chainsSection);

    const chainsHeading = document.createElement("h4");
    chainsHeading.textContent = "Chains";
    chainsSection.appendChild(chainsHeading);

    if (!chains || typeof chains !== "object" || Array.isArray(chains)) {
      const msg = document.createElement("p");
      msg.textContent = "No chains map defined on this blueprint.";
      chainsSection.appendChild(msg);
      return;
    }

    const chainNames = Object.keys(chains);
    if (!chainNames.length) {
      const msg = document.createElement("p");
      msg.textContent = "Chains map is empty.";
      chainsSection.appendChild(msg);
      return;
    }

    const chainsList = document.createElement("div");
    chainsList.className = "cs-chains-list";
    chainsSection.appendChild(chainsList);

    chainNames.sort().forEach((chainName) => {
      const chainRow = document.createElement("div");
      chainRow.className = "cs-form-row cs-chain-row";

      const label = document.createElement("label");
      label.textContent = chainName;
      chainRow.appendChild(label);

      const input = document.createElement("input");
      input.type = "text";
      input.className = "cs-input cs-chain-input";
      const boneSequence = Array.isArray(chains[chainName]) ? chains[chainName] : [];
      input.value = boneSequence.join(", ");
      chainRow.appendChild(input);

      const hintSpan = document.createElement("span");
      hintSpan.className = "cs-inline-hint";
      hintSpan.textContent = "Comma-separated bone names, e.g. spine_base, spine_mid, spine_top";
      chainRow.appendChild(hintSpan);

      input.addEventListener("change", () => {
        const raw = input.value || "";
        const names = raw
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const filteredNames = names.filter((name) => boneNames.includes(name));

        updateCurrentBlueprint((current) => {
          if (!current) {
            return current;
          }
          const existingChains = current.chains || {};
          return {
            ...current,
            chains: {
              ...existingChains,
              [chainName]: filteredNames,
            },
          };
        });
      });

      chainsList.appendChild(chainRow);
    });
  }

  function update(state) {
    const blueprint = state.currentBlueprint;
    renderSummary(blueprint);
    renderTable(blueprint);
    renderEditor(blueprint);
  }

  return {
    element: root,
    update,
  };
}
