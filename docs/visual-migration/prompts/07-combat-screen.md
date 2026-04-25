# Codex Prompt 07 — Dedicated Combat Screen

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/07-combat-screen.md` and inspect `docs/visual-migration/references/fight.jpeg`.

## Goal

Add a full-screen or overlay combat presentation that uses existing combat domain state and visually resembles the combat reference.

## Scope

- Add a dedicated combat UI under `src/ui/combat/`.
- Use existing `CombatState`, `CombatTurn`, `ArenaState`, and i18n log keys.
- Add route/store wiring or an overlay entry from the Arena panel.
- Keep the existing Arena panel as summary/entry point.
- Use generated arena combat background and gladiator combat frames.

## Layout Requirements

- Full arena background with crowd and sand floor.
- Top game HUD in the same dark Roman style.
- Left and right combatant status panels.
- Central combatant sprites with health bars.
- Bottom skill/strategy panel.
- Bottom combat log.
- Fatigue/energy bars bottom left/right.
- At least two-frame combat idle animation.

## Gameplay Constraint

For this PR, do not invent new combat resolution logic.

Acceptable MVP:

- selected combat is already resolved by domain logic;
- UI reveals turns one by one;
- health bars update from `CombatTurn` data;
- final result uses existing `CombatConsequence`.

## Acceptance Criteria

- Combat looks close to `references/fight.jpeg`.
- Combat log can progress turn-by-turn.
- Existing Arena panel still works.
- No domain formulas moved into React.
- Build/lint/tests pass.

## Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
