# Demo Mode

## Goal

Demo mode is a durable developer-only feature for loading predefined static saves. It exists to make UI testing, debugging, visual review and Playwright scenarios stable and repeatable.

Demo mode is useful for:

- testing the map-first player interface;
- testing building visuals at different progression levels;
- testing portrait-based gladiator rosters;
- testing contextual panels;
- testing time-of-day themes;
- testing market and arena external locations;
- reproducing gameplay states without manually recreating a save.

Demo mode must not be available by default to normal players.

## Feature Flag

Demo mode is controlled by:

```bash
VITE_ENABLE_DEMO_MODE=true
```

Default behavior:

```bash
VITE_ENABLE_DEMO_MODE=false
```

Rules:

- only the exact string `true` enables demo mode;
- the flag is not a secret because Vite exposes `VITE_` variables to the client;
- public production builds must disable demo mode;
- demo routes, demo buttons and demo saves must not be accessible when the flag is disabled.

Feature flag parsing is centralized in `src/config/features.ts`.

## Behavior

When demo mode is enabled, the load game flow may show demo saves separately from normal local or cloud saves.

Demo saves:

- are read-only templates;
- load as cloned playable snapshots;
- never mutate the source template;
- do not autosave;
- do not save through the manual save action;
- do not upload to cloud saves;
- do not overwrite local saves;
- use the current save schema;
- include a `schemaVersion` field;
- remain deterministic.

If the player changes a loaded demo snapshot, those changes exist only in memory for the current session. The save UI must clearly label the active demo as read-only and show a notice when a save attempt is ignored.

All player-facing demo UI text must use i18n keys and support French and English.

## Available Baseline Scenarios

The project maintains three baseline scenarios.

### Early Demo

ID: `demo-early-ludus`

Purpose: validate the first playable state after the player has recruited a small roster.

Expected state:

- Year 1, Week 1, Monday 08:00, paused;
- treasury 850 and low ludus reputation;
- all MVP base buildings purchased at level 1;
- Dormitory level 1 with purchased beds available for the three-gladiator roster;
- 3 owned beginner gladiators with stable portraits, sprites, objectives and building assignments;
- 5 predefined market candidates;
- no active Sunday combats;
- simple map state and low UI density.

### Mid Demo

ID: `demo-mid-ludus`

Purpose: validate normal progression.

Expected state:

- Year 2, Week 4, Thursday 16:00, paused;
- 4 owned gladiators;
- all MVP base buildings purchased, with levels around 3 or 4;
- Dormitory capacity large enough for the roster and market test purchases;
- 5 predefined market candidates;
- active weekly planning recommendations;
- at least one contextual alert.
- predefined betting odds for eligible gladiators because Thursday scouting is available.

### Advanced Demo

ID: `demo-advanced-ludus`

Purpose: validate dense UI and late-progression visual states.

Expected state:

- Year 5, Week 7, Saturday 18:30, paused;
- 8 owned gladiators;
- all MVP base buildings purchased at level 8 with full improvement coverage where available;
- Dormitory capacity large enough for the dense roster;
- 5 predefined market candidates;
- multiple active alerts;
- arena preparation state with predefined betting odds locked for the weekend;
- dusk or night visual coverage.

The advanced demo must verify that the bottom gladiator roster remains readable with 8 gladiators and that Playwright can advance from Saturday evening into the Sunday arena state without relying on random setup.

## Visual Requirements

Demo saves must be useful for UI and visual testing.

Each demo gladiator must include a stable visual identity:

- portrait asset id;
- sprite asset id;
- optional palette or variation metadata.

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

Demo saves should help test:

- map layout;
- building visuals;
- gladiator portraits;
- gladiator map sprites;
- contextual panels;
- time-of-day themes;
- market and arena external locations;
- Playwright selectors.

Map layout and visual definitions must be data-driven. Demo saves may reference visual ids, but React components should not hardcode building positions, asset ids or player-facing text.

## Data Rules

Demo saves must not call random generation on load.

If a demo scenario needs market candidates, opponents, events or contracts, those entities must be predefined in the demo save or generated once ahead of time and committed as static data.

Demo data should be stored in `src/game-data/demo-saves` or another dedicated game-data demo module. Gameplay rules stay in `src/domain` and `src/game-data`; React components render the loaded state and call actions.

## Removed Building Budget System

Demo saves must not include generic building budget fields.

Buildings are configured through:

- levels;
- purchased improvements;
- explicit policies;
- action stations;
- weekly objectives;
- strategic choices.

Old save examples mentioning building budgets are deprecated and must not be copied into demo saves.

## Direct Development Routes

Playwright tests should be able to open each demo directly when demo mode is enabled.

Expected routes:

- `/dev/demo/demo-early-ludus`;
- `/dev/demo/demo-mid-ludus`;
- `/dev/demo/demo-advanced-ludus`.

When demo mode is disabled, those routes must be blocked or redirected out of demo content.

## Stable Selectors

Stable `data-testid` values should exist for:

- demo save list;
- demo save load action;
- active demo indicator;
- top HUD;
- ludus map;
- building locations;
- gladiator roster;
- gladiator portrait cards;
- contextual panel host;
- market location;
- arena location.

The exact selector names may follow existing project conventions.

## Architecture

Current durable files:

- `src/config/features.ts`;
- `src/persistence/demo-save-provider.ts`;
- `src/game-data/demo-saves/index.ts`;
- `src/game-data/demo-saves/demo-early-ludus.ts`;
- `src/game-data/demo-saves/demo-mid-ludus.ts`;
- `src/game-data/demo-saves/demo-advanced-ludus.ts`.

The demo provider should:

- expose available demo save metadata;
- load a deep clone of the selected demo save;
- reject unknown demo save ids;
- reject create, update and delete operations with read-only errors.

The save service treats active demo saves as read-only templates. Autosave stays disabled for demo saves unless a future explicit "save as local copy" action is added.

## Test Expectations

Unit tests should cover:

- feature flag parsing;
- demo provider metadata;
- demo save deep cloning;
- read-only provider operations;
- schema validation;
- absence of building budget fields.

Playwright tests should cover:

- demo mode hidden when disabled;
- each demo route blocked when disabled;
- each demo route loads when enabled;
- early, mid and advanced map states render;
- portrait-based roster renders;
- advanced demo remains readable with 8 gladiators;
- contextual panels can open from stable selectors.

## Acceptance Criteria

Demo mode is valid when:

- `VITE_ENABLE_DEMO_MODE=false` hides demo mode completely;
- `VITE_ENABLE_DEMO_MODE=true` shows demo saves in the load game flow;
- three demo saves are available: `demo-early-ludus`, `demo-mid-ludus` and `demo-advanced-ludus`;
- demo saves load with stable game state;
- demo gladiators have portraits;
- demo gladiators have map sprite references;
- demo buildings appear on the map;
- Playwright can open each demo directly;
- the advanced demo can test UI density with 8 gladiators;
- demo saves are static and deterministic;
- loading a demo save does not mutate the template;
- demo saves are not autosaved;
- demo saves are not uploaded to cloud saves;
- demo saves do not include building budget fields;
- all player-facing demo UI strings use i18n.
