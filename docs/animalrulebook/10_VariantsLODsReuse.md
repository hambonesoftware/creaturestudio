# Chapter 10 – Variants, LODs, and Reuse

This chapter covers patterns that let you reuse code and definitions across many animals, while still achieving variation in appearance and performance.

## 10.1 Variants via seeds and parameters

Each animal can support a `variantSeed` value that influences:

- Overall scale.
- Limb lengths and thickness.
- Head size and proportions.
- Tail length and thickness.
- Ear size.

Use the seed to derive a variant factor in the range `[0.0, 1.0]` and then use that factor to adjust numeric parameters.

Example:

```js
function variantFactorFromSeed(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const fractional = x - Math.floor(x);
  return fractional;
}

const factor = variantFactorFromSeed(variantSeed);

const legScale = 1.0 + (factor - 0.5) * 0.2;
const tuskScale = 1.0 + (factor - 0.5) * 0.3;
const headScale = 1.0 + (0.5 - factor) * 0.15;
```

Apply the resulting scales when computing radii and torse sizes inside your generator.

## 10.2 Low-poly and high-poly modes

To support level-of-detail:

- Use `lowPoly` flags for each body part.
- Choose smaller `sides` and fewer spine samples in low-poly mode.
- Optionally weld vertices so shading produces faceted effects.

This lets you show many animals at once in low-poly form, while close-up pens can display higher resolution meshes.

## 10.3 Sharing generators between related species

Many species share most of their geometry logic:

- Dogs, wolves, foxes: similar skeletons and limb configurations.
- Big cats: similar to each other and to mid-sized quadrupeds.
- Birds: similar wing patterns and beak structures with small variations.

Ideas for reuse:

- Create a `CanineGenerator` that supports adjustable proportions via parameters.
- Create a `FelineGenerator` with adjustable head and tail length.
- Create shared torso profiles for groups of related animals.

Use configuration objects or blueprint files to drive a single generator with different values.

## 10.4 Editing and exporting

Combined with blueprint-based import and export (Chapter 13), you can:

- Start from an existing animal blueprint.
- Adjust radii, spine lengths, and attachment placement.
- Export a new species which shares the same generator base class but has its own definition files.
