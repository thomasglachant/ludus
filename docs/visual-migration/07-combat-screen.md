# Combat Screen Brief

> Historical note: this brief informed the migration. Current durable combat UI
> guidance lives in `docs/03_product/ART_DIRECTION.md` and
> `docs/03_product/UI_UX.md`.

## Goal

Add a dedicated combat presentation inspired by `references/fight.jpeg` while keeping existing combat domain logic intact.

The combat screen should feel like the weekly climax. It should not look like a normal right-side panel.

## Current Source of Truth

Use current domain types:

- `ArenaState`;
- `CombatState`;
- `CombatTurn`;
- `CombatStrategy`;
- `CombatReward`;
- `CombatConsequence`.

Do not reimplement hit chance, damage, rewards, or consequences in React.

## First Playable Combat Presentation

The first version can be a replay/progression UI over already resolved combat turns.

Suggested flow:

1. Player opens Arena on Sunday or selects an available combat.
2. Combat presentation opens as full-screen route or overlay.
3. Both fighters appear in arena.
4. Log starts with combat intro.
5. Player advances one turn at a time.
6. Health bars update using existing turn data.
7. When all turns are shown, result/reward/consequence panel appears.
8. Player returns to Arena summary/map.

This avoids inventing new combat mechanics during the visual migration.

## Layout

Top:

- same dark Roman HUD language as main map;
- date/time;
- round/manche indicator;
- resources;
- pause/speed/menu controls.

Left fighter panel:

- portrait;
- name;
- class/archetype if available;
- health, energy/fatigue, morale;
- active effects;
- skills available.

Right fighter panel:

- same as left, opponent-focused;
- can show scouting/unknown status if future logic supports it.

Center:

- arena background;
- two combatant sprites;
- health bars above combatants;
- subtle combat idle animation;
- optional attack lunge when a turn is advanced.

Bottom center:

- skill/strategy selection panel;
- for MVP replay, show selected strategy and disabled skill buttons or contextual action buttons.

Bottom:

- combat log with rows and icons;
- newest turn highlighted;
- scroll area.

Bottom corners:

- fatigue/energy bars for each fighter.

## Components

Suggested files:

```text
src/ui/combat/CombatScreen.tsx
src/ui/combat/CombatArenaStage.tsx
src/ui/combat/CombatantPanel.tsx
src/ui/combat/CombatSkillBar.tsx
src/ui/combat/CombatLog.tsx
src/ui/combat/combat-screen-view-model.ts
```

View-model responsibilities:

- select current/pending combat;
- compute visible turns;
- compute current health after visible turn count;
- prepare display labels/i18n keys;
- resolve portrait/sprite asset paths.

React responsibilities:

- render state;
- advance visible turn count;
- close/return to map/arena;
- dispatch existing store actions only when domain state should change.

## Route Strategy

Option A: add `ScreenName = 'combat'`.

Pros:

- full-screen simple layout;
- matches reference best.

Cons:

- requires navigation/store updates.

Option B: full-screen overlay inside `GameShell`.

Pros:

- fewer route changes;
- easier to keep map context.

Cons:

- can become messy if not isolated.

Recommended: start with Option B if there is no current combat route, then promote to a route later if needed.

## Acceptance Criteria

- Looks and feels close to `references/fight.jpeg`.
- Uses existing combat domain state and i18n log keys.
- Fighters have at least two-frame combat idle motion.
- Log progresses one turn at a time.
- Build/lint/tests pass.
- The existing Arena panel still works as a summary/entry point.
