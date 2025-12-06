import path from "path";
import { fileURLToPath } from "url";
import { convertElephantDefinitionToSkeletonBlueprint } from "../frontend/src/tools/elephantDefinitionToBlueprint.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolved = path.resolve(__dirname, "../frontend/src/blueprints/ElephantBlueprint.json");

const converted = convertElephantDefinitionToSkeletonBlueprint();

console.log("Converted Elephant skeleton (definition → blueprint-ready):");
console.log(JSON.stringify(converted.skeleton, null, 2));
console.log("\nSizes.byBone (radius approximations from definition sizes):");
console.log(JSON.stringify(converted.sizes.byBone, null, 2));
console.log("\nMeta:");
console.log(JSON.stringify({ ...converted.meta, blueprintReference: resolved }, null, 2));
