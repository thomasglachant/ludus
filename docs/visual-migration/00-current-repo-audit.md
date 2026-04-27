# Current Repository Audit

> Historical note: this audit describes the repository before the visual
> migration was completed. Use permanent docs in `docs/03_product/` and
> `docs/02_technical/ARCHITECTURE.md` for current durable guidance.

## Current Stack

At the time of the visual migration, `ludus` was a Vite + React + TypeScript browser game with Vitest, React Testing Library, Playwright, ESLint, Prettier, Husky, lint-staged, and commitlint.

The current architecture already supports the migration because it separates:

- game definitions and balance data in `src/game-data`;
- business/domain rules in `src/domain`;
- app and UI state in `src/state`;
- React presentation in `src/ui`;
- persistence in `src/persistence`;
- bilingual copy in `src/i18n`.

This migration should not collapse those boundaries.

## Existing UI Structure

The normal game route renders `LudusScreen`, which delegates to `GameShell`.

Current shell structure:

```tsx
<GameShell>
  <TopHud />
  <LeftNavigationRail />
  <LudusMap />
  <ContextualPanelHost />
  <BottomGladiatorRoster />
  <ToastAndAlertLayer />
</GameShell>
```

This is the correct foundation. The work is visual replacement and feature presentation, not a full application rewrite.

## Map State

`src/ui/map/LudusMap.tsx` already supports:

- pan and zoom;
- data-driven map size, bounds, locations, paths, decorations, and gladiator slots;
- clickable buildings and external locations;
- selected building/gladiator state;
- map focus on selected gladiators/locations;
- time-of-day visual variables.

`src/game-data/map-layout.ts` already defines:

- `LUDUS_MAP_DEFINITION`;
- buildings: Domus, Canteen, Dormitory, Training Ground, Pleasure Hall, Infirmary;
- external locations: Market and Arena;
- internal/external paths;
- gladiator slots.

This should remain data-driven. Codex should not hardcode new positions directly in components.

## Asset State

At the time of this audit, asset definitions used simple SVG scaffolding:

- `src/game-data/building-visuals.ts` points to `/assets/buildings/{buildingId}-level-{level}.svg`;
- `src/game-data/gladiator-visuals.ts` points to `/assets/portraits/*.svg` and `/assets/sprites/*.svg`;
- `scripts/generate-placeholder-assets.mjs` creates simple SVG placeholders.

The migration replaced this direction with the generated
`public/assets/pixel-art/` hierarchy and manifest-driven visual data. Permanent
asset guidance now lives in `docs/02_technical/ARCHITECTURE.md`.

## Gladiators

The domain already has `GladiatorVisualIdentity` with:

```ts
export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
}
```

This is a strong base. Extend it carefully only if needed. Prefer adding game-data mapping and generated assets before changing save schema.

Current map animation states include:

- idle;
- walking;
- training;
- eating;
- resting;
- celebrating;
- healing.

These should map to actual two-frame or sprite-sheet animations.

## Time of Day

`src/game-data/time-of-day.ts` already defines four phases:

- dawn;
- day;
- dusk;
- night.

The target migration must upgrade this from mostly CSS tinting to asset-aware visual themes:

- different map background/tint per phase;
- torch visibility and flicker at dusk/night;
- cloud/sky color changes;
- lower sprite brightness at night;
- stronger warm highlights at dawn/dusk.

## Modal and Panel System

The repo already has reusable primitives in `src/ui/components/shared.tsx`:

- `PanelShell`;
- `SectionCard`;
- `Tabs`;
- `EmptyState`;
- `NoticeBox`;
- `MetricList`;
- `EffectList`;
- `Badge`;
- `CostSummary`;
- `LogRow`.

Codex should restyle these globally instead of duplicating modal/panel chrome per feature.

## Combat State

Combat currently exists through the arena panel and domain state, not as a dedicated full-screen combat presentation. `ActivityPanels.tsx` renders:

- combat list;
- summary;
- selected combat details;
- combat log with next-turn progression;
- scouting/betting preview.

The target reference requires a dedicated combat screen or overlay route that uses existing combat state and domain results but presents them in a much more theatrical arena layout.

## Main Risks

1. **Overwriting architecture boundaries**: do not move game rules into React.
2. **Hardcoding visual layout in CSS only**: asset paths, map objects, and animations should be data-driven.
3. **Breaking tests**: keep stable `data-testid` selectors.
4. **Trying to finish all art in one PR**: this migration should be split into phases.
5. **Generating too many heavy assets too early**: first produce deterministic SVG/pixel-art scaffold; refine later.
6. **Losing i18n**: no hardcoded player-facing strings.
