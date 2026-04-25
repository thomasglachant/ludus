# Codex Prompt 05 — Gladiator Visual Variants and Animations

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/06-animation-and-life.md` and inspect `references/map.jpeg` and `references/fight.jpeg`.

## Goal

Make gladiators visually varied and lightly animated across map, roster, panels, market, and combat.

## Scope

- Expand `src/game-data/gladiator-visuals.ts` to resolve generated portrait and sprite frame paths.
- Update `src/game-data/gladiator-animations.ts` if frame-based animation data is needed.
- Update `GladiatorPortrait` to use generated portraits while keeping CSS fallback.
- Update map sprite rendering to support two-frame animation arrays.
- Ensure market and panels use portraits consistently through existing `GladiatorPortrait` component.
- Prepare combat sprite helpers for the combat screen.

## Requirements

- At least 12 generated variants available.
- Stable identity derivation from gladiator id when save lacks `visualIdentity`.
- No save schema migration required unless absolutely necessary.
- Map sprites support at least:
  - idle;
  - walking;
  - training;
  - eating;
  - resting;
  - celebrating;
  - healing.
- Combat sprites support at least:
  - idle;
  - attack.

## Constraints

- Do not hardcode individual gladiator names to assets.
- Do not break existing demo saves.
- Keep visible names and labels i18n-safe where applicable.
- Respect reduced motion.

## Acceptance Criteria

- Bottom roster cards show recognizable portraits.
- Map gladiators animate subtly.
- Generated visual identity remains deterministic.
- Build/lint/tests pass.

## Commands

```bash
npm run build
npm run lint
npm run test
```
