# Asset Generation Workflow

## Goal

Create enough assets for Codex to implement the new visual direction without waiting for hand-authored art.

The asset generator should produce deterministic SVG pixel-art scaffolding. These assets should be visually richer than the current placeholders and shaped like production assets:

- explicit folder hierarchy;
- stable ids;
- manifest output;
- separate map, buildings, characters, UI, ambient, and combat assets;
- dawn/day/dusk/night variants;
- multiple gladiator identities;
- two-frame animation-ready sprites.

## Command

From the repo root:

```bash
node scripts/generate-visual-migration-assets.mjs
```

Optional flags:

```bash
node scripts/generate-visual-migration-assets.mjs --clean
node scripts/generate-visual-migration-assets.mjs --variant-count=16
node scripts/generate-visual-migration-assets.mjs --dry-run
```

Expected output root:

```text
public/assets/pixel-art/
```

Expected manifest:

```text
public/assets/pixel-art/asset-manifest.visual-migration.json
```

## Generated Asset Categories

### Homepage

```text
public/assets/pixel-art/homepage/
├── homepage-background-day.svg
├── homepage-background-dusk.svg
└── last-save-thumbnail.svg
```

### Map

```text
public/assets/pixel-art/map/backgrounds/
├── ludus-map-dawn.svg
├── ludus-map-day.svg
├── ludus-map-dusk.svg
└── ludus-map-night.svg
```

```text
public/assets/pixel-art/map/ambient/
├── cloud-01.svg
├── cloud-02.svg
├── grass-tuft-01.svg
├── banner-red.svg
├── torch-on.svg
├── smoke-puff.svg
└── crowd-dot.svg
```

### Buildings

```text
public/assets/pixel-art/buildings/{buildingId}/level-{n}/
├── exterior.svg
├── roof.svg
├── interior.svg
└── props.svg
```

Generate at least levels `0`, `1`, `2`, and `3`.

### Special Locations

```text
public/assets/pixel-art/locations/market/
├── exterior.svg
└── props.svg

public/assets/pixel-art/locations/arena/
├── exterior.svg
├── crowd.svg
└── combat-background.svg
```

### Gladiators

```text
public/assets/pixel-art/characters/gladiators/{variantId}/
├── portrait.svg
├── map-idle-0.svg
├── map-idle-1.svg
├── map-walk-0.svg
├── map-walk-1.svg
├── map-train-0.svg
├── map-train-1.svg
├── combat-idle-0.svg
├── combat-idle-1.svg
├── combat-attack-0.svg
└── combat-attack-1.svg
```

Generate at least 12 variants.

### UI

```text
public/assets/pixel-art/ui/
├── panel-corner.svg
├── parchment-tile.svg
├── bronze-frame-tile.svg
├── roman-divider.svg
├── laurel-left.svg
├── laurel-right.svg
└── resource-icons.svg
```

## How Codex Should Wire Assets

1. Generate assets with the script.
2. Read the manifest JSON.
3. Add typed game-data references, for example `src/game-data/visual-assets.ts`.
4. Update existing visual data modules to use the new manifest paths:
   - `building-visuals.ts`;
   - `gladiator-visuals.ts`;
   - `map-layout.ts` or an adjacent `map-visuals.ts`;
   - `time-of-day.ts` if background asset paths are added.
5. Keep old placeholder paths as temporary fallback only.
6. Add tests for manifest shape or visual mapping helpers when practical.

## Asset Quality Criteria

Generated assets should be:

- readable at target UI sizes;
- limited-palette and pixel-art-inspired;
- Roman-themed without being noisy;
- consistent across buildings and characters;
- deterministic across runs unless parameters change;
- safe for a public repository.

No generated asset should include external licensed artwork or font files.
