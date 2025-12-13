# Export Contract v1 (CreatureStudio → Zoo-compatible)

This document defines the minimum export surface that CreatureStudio must
produce so a Zoo-style renderer (including Zoo itself) can import an
animal without manual adjustments. It is versioned to allow compatible
changes over time.

## Versioning fields

Every exported artifact MUST include the following top-level fields:

- `contractVersion` (string) – currently `1.0.0`; increments only when the
  contract itself changes.
- `schemaVersion` (string) – version of the data schema for the exported
  JSON payloads (e.g., `1.0.0`).
- `minZooVersion` (string) – lowest Zoo application version known to
  support this contract.
- `tooling` (object) – metadata about the exporter (app name, version,
  commit SHA, build timestamp).

## Core export contents

Exported packages MUST provide the following JSON documents:

1. **AnimalDefinition.json** – structural description of the animal in a
   Zoo-compatible format:
   - `speciesKey` (string)
   - `displayName` (string)
   - `skeleton` (array) – ordered list of bones with:
     - `name` (string, canonical Zoo naming where possible)
     - `parent` (string | null)
     - `restTransform` (position, rotation, scale)
   - `parts` (array) – body-part parameter blocks keyed by the bones they
     attach to; includes dimensions, radii, and mesh generator hints.
   - `lod` (optional) – level-of-detail presets.
   - `materials` (array) – material slots referenced by parts.

2. **materials.json** – intent-first description of how the renderer
   should resolve materials:
   - `slots` keyed by material name, each with:
     - `type` (e.g., `skin`, `nails`, `eyes`)
     - `workflow` (e.g., `pbr`, `node/tsl`)
     - `parameters` (color, roughness, normal maps, displacement maps)
     - `nodeGraph` (optional) – when `workflow` is `node/tsl`, provides the
       node pipeline inputs needed to rebuild the material (required for
       elephant parity).
   - `textures` (optional) – relative paths in the export package.

3. **runtime.json** (optional) – default runtime hooks:
   - `locomotion` – gait or stance presets (walk speed, stride length,
     ground contact frames) that downstream apps may consume.
   - `behavior` – idle/ambient behavior tuning, if available.

4. **blueprint.json** (optional) – the original SpeciesBlueprint used to
   produce the export for traceability.

All JSON files MUST be UTF-8 encoded and formatted with stable key order
so structural tests can diff them reliably.

## Material intent for elephants

Elephant exports MUST signal the node-based skin path used by Zoo:

- `materials.json` MUST set `workflow: "node/tsl"` for the elephant skin
  slot.
- `nodeGraph` MUST include the parameters and graph identifiers necessary
  to recreate the Zoo elephant TSL material (albedo tint, roughness,
  subtle displacement/normal layering).
- A boolean `useTSLSkin: true` flag MAY be duplicated in
  `AnimalDefinition.json` under the material slot for quick detection.

## Structural guarantees

- Bone names MUST be unique and stable; adapters are responsible for
  canonicalizing names to Zoo expectations (e.g., trunk, tusks, ears).
- Bone ordering MUST be deterministic (preorder traversal from the root).
- Part attachments MUST reference existing bones only.
- All transforms are expressed in meters; rotation uses XYZ Euler in
  radians unless otherwise noted.

## Package layout

When exported as an archive, the following layout is expected:

```text
manifest.json
AnimalDefinition.json
materials.json
runtime.json        (optional)
blueprint.json      (optional)
assets/             (textures or supporting files)
```

`manifest.json` collects the versioning fields plus checksums for each
payload to allow integrity verification.

### Example manifest emitted by the backend

```json
{
  "contractVersion": "1.0.0",
  "schemaVersion": "4.2.0",
  "minZooVersion": "0.1.0",
  "tooling": {
    "app": "CreatureStudio",
    "version": "4.1.0",
    "timestamp": "2024-01-01T00:00:00.000000+00:00"
  },
  "animal": {
    "speciesKey": "Elephant",
    "displayName": "Elephant"
  },
  "payloads": {
    "AnimalDefinition.json": "<sha256>",
    "materials.json": "<sha256>",
    "runtime.json": "<sha256>",
    "blueprint.json": "<sha256>"
  }
}
```

### Backend export behavior

The FastAPI export service now writes data-first payloads into the package
root. `AnimalDefinition.json` is derived from the blueprint skeleton, body
parts, and chain definitions. `materials.json` expresses material intent with
TSL/node hints when the animal is an elephant (detected via trunk presence or
`Elephant` naming). `runtime.json` surfaces gait and idle behavior defaults, and
`blueprint.json` retains the source blueprint for traceability. All payloads
are hashed into `manifest.json` for integrity checks.

## Acceptance statement

If CreatureStudio emits the above files with matching version fields,
canonical bone naming, and the elephant skin marked as `node/tsl`, a
Zoo-style renderer can import the animal without manual edits.
