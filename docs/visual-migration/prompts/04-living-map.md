# Codex Prompt 04 — Living Map Visual Replacement

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/01-visual-target.md`, `06-animation-and-life.md`, and inspect `docs/visual-migration/references/map.jpeg`.

## Goal

Transform `LudusMap` from styled placeholder blocks into a living pixel-art Roman school map with time-of-day variants and ambient animations.

## Scope

- Update `src/ui/map/LudusMap.tsx` only as needed for layers/class hooks.
- Keep map layout and hit areas data-driven.
- Add map visual data if needed, for example `src/game-data/map-visuals.ts`.
- Use generated map/background/building/location/ambient assets.
- Add ambient animation layers:
  - moving clouds;
  - grass/tree sway;
  - banner flutter;
  - torch flicker at dusk/night;
  - small smoke/fire/crowd details.
- Improve building hover/selected states and labels.
- Ensure dawn/day/dusk/night are visually distinct.

## Constraints

- Preserve `data-testid="map-container"`.
- Preserve `map-building-{buildingId}` and `map-special-location-{id}` test ids.
- Do not add gameplay formulas to React.
- Use CSS transforms/opacity for ambient motion, not React per-frame state.
- Respect `prefers-reduced-motion`.

## Suggested Implementation

- Add a `LudusMapAmbientLayer` component if it makes `LudusMap` cleaner.
- Add a `LudusMapLocationArt` component if building rendering becomes too large.
- Keep camera/pan/zoom logic intact unless there is a bug.
- Use `getTimeOfDayDefinition(save.time.hour)` for asset/tint decisions.

## Acceptance Criteria

- Map resembles `references/map.jpeg` in overall composition and mood.
- The map has visible subtle life even if gladiators do not walk paths yet.
- Time-of-day phases are clear.
- Build/lint/tests pass.

## Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
