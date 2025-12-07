import { getState, setDebugChainName } from "../../studioState.js";

/**
 * Body Plan panel – shows high-level body plan information from the blueprint.
 */
export function createBodyPlanPanel() {
  const root = document.createElement("div");
  root.className = "cs-panel cs-panel-body-plan";

  const title = document.createElement("h2");
  title.textContent = "Body Plan";
  root.appendChild(title);

  const metaSection = document.createElement("section");
  metaSection.className = "cs-panel-section";
  root.appendChild(metaSection);

  const bodyPlanSection = document.createElement("section");
  bodyPlanSection.className = "cs-panel-section";
  root.appendChild(bodyPlanSection);

  function update(state) {
    const blueprint = state.currentBlueprint;
    metaSection.innerHTML = "";
    bodyPlanSection.innerHTML = "";

    if (!blueprint) {
      const msg = document.createElement("p");
      msg.textContent = "No blueprint loaded.";
      metaSection.appendChild(msg);
      return;
    }

    const { meta, bodyPlan } = blueprint;

    const metaList = document.createElement("dl");
    metaList.className = "cs-definition-list";

    const addMeta = (label, value) => {
      if (value == null || value === "") return;
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = String(value);
      metaList.appendChild(dt);
      metaList.appendChild(dd);
    };

    addMeta("Name", meta.name);
    addMeta("Version", meta.version);
    addMeta("Author", meta.author);
    addMeta("Source", meta.source);
    addMeta("Notes", meta.notes);
    // Expose the blueprint schema version if present. Prefer a top-level
    // schemaVersion field on the blueprint, falling back to meta.schemaVersion.
    const schemaVersion = blueprint.schemaVersion || meta.schemaVersion;
    addMeta("Schema", schemaVersion);

    metaSection.appendChild(metaList);

    const bodyPlanList = document.createElement("dl");
    bodyPlanList.className = "cs-definition-list";

    if (bodyPlan) {
      const addBP = (label, value) => {
        if (value == null || value === "") return;
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = String(value);
        bodyPlanList.appendChild(dt);
        bodyPlanList.appendChild(dd);
      };

      addBP("Type", bodyPlan.type);
      addBP("Symmetry", bodyPlan.symmetryMode);
      addBP("Has Tail", bodyPlan.hasTail);
      addBP("Has Trunk", bodyPlan.hasTrunk);
      addBP("Has Wings", bodyPlan.hasWings);
      addBP("Has Ears", bodyPlan.hasEars);

      if (Array.isArray(bodyPlan.specialFeatures) && bodyPlan.specialFeatures.length) {
        addBP("Special Features", bodyPlan.specialFeatures.join(", "));
      }
    }

    bodyPlanSection.appendChild(bodyPlanList);

    // List generalised chains with bone counts for anatomy V2 blueprints.
    if (Array.isArray(blueprint.chainsV2) && blueprint.chainsV2.length) {
      const chainsHeading = document.createElement("h3");
      chainsHeading.textContent = "Chains";
      bodyPlanSection.appendChild(chainsHeading);
      const chainsList = document.createElement("ul");
      chainsList.className = "cs-chains-list";
      blueprint.chainsV2.forEach((chainDef) => {
        if (!chainDef || !chainDef.name) return;
        const li = document.createElement("li");
        li.className = "cs-chain-row";
        const nameSpan = document.createElement("span");
        nameSpan.className = "cs-chain-name";
        nameSpan.textContent = chainDef.name;
        li.appendChild(nameSpan);
        const countSpan = document.createElement("span");
        countSpan.className = "cs-chain-count";
        const bonesCount = Array.isArray(chainDef.bones) ? chainDef.bones.length : 0;
        countSpan.textContent = `(${bonesCount} bones)`;
        li.appendChild(countSpan);
        // Click handler: update debugChainName in global state so the viewport highlights this chain.
        li.addEventListener('click', () => {
          setDebugChainName(chainDef.name);
        });
        chainsList.appendChild(li);
      });
      bodyPlanSection.appendChild(chainsList);
    }
  }

  return {
    element: root,
    update,
  };
}
