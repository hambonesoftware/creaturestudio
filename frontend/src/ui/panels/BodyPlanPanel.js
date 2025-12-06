import { getState } from "../../studioState.js";

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
  }

  return {
    element: root,
    update,
  };
}
