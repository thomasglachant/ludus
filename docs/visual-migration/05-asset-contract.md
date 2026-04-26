# Asset Contract

> Historical note: this contract informed the migration. Current asset
> boundaries are documented in `docs/02_technical/ARCHITECTURE.md`.

## Manifest Schema

Generated assets should produce a JSON manifest with this conceptual shape:

```ts
export interface VisualAssetManifest {
  version: 1;
  generatedAt: string;
  homepage: {
    backgrounds: Partial<Record<'day' | 'dusk', string>>;
    lastSaveThumbnail: string;
  };
  map: {
    backgrounds: Record<'dawn' | 'day' | 'dusk' | 'night', string>;
    ambient: Record<string, string>;
  };
  buildings: Record<string, Record<string, BuildingAssetSet>>;
  locations: Record<'market' | 'arena', Record<string, string>>;
  gladiators: Record<string, GladiatorAssetSet>;
  ui: Record<string, string>;
}

export interface BuildingAssetSet {
  exterior: string;
  roof?: string;
  interior?: string;
  props?: string;
  width: number;
  height: number;
}

export interface GladiatorAssetSet {
  portrait: string;
  frames: Record<string, string[]>;
  paletteId: string;
  bodyType: string;
  hairStyle: string;
  armorStyle: string;
}
```

The actual implementation may keep this as JSON plus helper functions, or convert it into a typed `src/game-data/visual-assets.ts` module.

## Building Visual Definition Target

Current `BuildingVisualDefinition` is simple. The target can extend it without breaking consumers:

```ts
export interface BuildingVisualDefinition {
  buildingId: BuildingId;
  level: number;
  exteriorAssetPath: string;
  roofAssetPath?: string;
  interiorAssetPath?: string;
  propsAssetPath?: string;
  width: number;
  height: number;
  labelOffset?: { x: number; y: number };
  hitArea?: { x: number; y: number; width: number; height: number };
  ambientSlots?: AmbientSlotDefinition[];
  stations?: BuildingActionStation[];
}
```

Avoid adding gameplay meaning to visual definitions. Stations can describe visual placements and action animation targets, but gameplay rules remain in domain/game-data modules.

## Time-of-Day Visual Definition Target

Current `TimeOfDayVisualTheme` can be extended:

```ts
export interface TimeOfDayVisualTheme {
  skyColor: string;
  terrainColor: string;
  terrainHighlightColor: string;
  overlayColor: string;
  overlayOpacity: number;
  lightColor: string;
  shadowColor: string;
  torchOpacity: number;
  spriteBrightness: number;
  mapBackgroundAssetPath?: string;
  cloudOpacity?: number;
  ambientSpeedMultiplier?: number;
}
```

## Gladiator Visual Definition Target

Current save model can stay stable. Use asset ids in `GladiatorVisualIdentity` and data helpers to resolve paths.

Recommended helper contract:

```ts
export function getGladiatorPortraitAssetPath(identity: GladiatorVisualIdentity): string;
export function getGladiatorSpriteFrames(
  identity: GladiatorVisualIdentity,
  animation: GladiatorAnimationState,
): string[];
export function getCombatSpriteFrames(
  identity: GladiatorVisualIdentity,
  animation: 'idle' | 'attack' | 'hit' | 'defeat',
): string[];
```

## CSS Animation Contract

Use CSS variables and `data-animation-state` where possible:

```tsx
<button
  className="ludus-map-sprite"
  data-animation-state={animation.state}
  style={{ '--sprite-frame-count': frames.length } as CSSProperties}
>
```

For SVG frame swapping, two implementation options are acceptable:

1. render two images and alternate opacity with keyframes;
2. use a sprite-sheet background with `steps(2)` animation.

Start with option 1 because it is easy to read and test.

## Performance Guardrails

- Keep SVG assets lightweight.
- Avoid large base64 blobs inside CSS.
- Do not animate layout-affecting properties when transform/opacity works.
- Use `will-change` sparingly.
- Respect `prefers-reduced-motion`.
- Do not block the main thread with per-frame React state updates for ambient animations.
