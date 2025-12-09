# Species blueprint inventory

This snapshot enumerates the blueprints currently checked into `frontend/src/blueprints` and their mirrored copies under `shared/blueprints` / `shared/templates`. It highlights anatomy coverage relative to the Elephant V2 schema (chainsV2 + bodyPartsV2) and notes whether a temporary legacy fallback flag is set.

| Species/template | Blueprint paths | Anatomy V2 coverage | Chain coverage summary | Notes |
| --- | --- | --- | --- | --- |
| Elephant | `frontend/src/blueprints/ElephantBlueprint.json`, `shared/blueprints/ElephantBlueprint.json` | `chainsV2` + `bodyPartsV2` populated for torso, neck/head, trunk, tail, ears, and all four legs | Spine, neck/head, trunk, tail, both ears, front/back legs, tusks | Marked with `forceLegacyBuild: true` so runtime can stay on the legacy pipeline while V2 data is validated; materials include surface/eye/tusk/nail presets. |
| Cat | `frontend/src/blueprints/CatBlueprint.json`, `shared/blueprints/CatBlueprint.json` | `chainsV2` + `bodyPartsV2` populated with v2 generator keys | Spine, neck/head, tail, both ears, all four legs | Updated materials now carry specular values to match Elephant conventions. |
| TemplateQuadruped | `frontend/src/blueprints/TemplateQuadruped.json`, mirrors in `shared/blueprints` and `shared/templates` | `chainsV2` + `bodyPartsV2` mapped to v2 generators | Spine, neck/head, tail, both ears, all four legs | Radii and materials mirror Elephant-style defaults for reuse across quadrupeds. |
| TemplateBiped | `frontend/src/blueprints/TemplateBiped.json`, mirrors in `shared/blueprints` and `shared/templates` | `chainsV2` + `bodyPartsV2` mapped to v2 generators | Spine, neck/head, both ears, arms, legs | Materials include specular/metallic defaults; ready for V2 generator pipeline with optional legacy fallback flag. |
| TemplateWinged | `frontend/src/blueprints/TemplateWinged.json`, mirrors in `shared/blueprints` and `shared/templates` | `chainsV2` + `bodyPartsV2` mapped to torso/limb/wing generators | Spine, neck/head, tail, both ears, hind legs, wings | Wing chains now include radii for V2 generators; materials align to Elephant-style fields. |
| TemplateNoPed | `frontend/src/blueprints/TemplateNoPed.json`, mirrors in `shared/blueprints` and `shared/templates` | `chainsV2` + `bodyPartsV2` mapped to torso/tail generators | Spine and tail | Minimal nopeds example ready for V2 generators; surface material includes specular to match other species. |

Additional utility and unit-test blueprints remain in `shared/blueprints`, but the entries above cover the species and templates targeted for the anatomy V2 rollout.
