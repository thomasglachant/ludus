# Demo Mode

## Goal

Demo mode is a durable developer-only feature for loading predefined static saves. It exists to make UI testing, debugging, visual review and Playwright scenarios stable and repeatable.

Demo mode is useful for:

- testing the map-first player interface;
- testing building visuals at different progression levels;
- testing portrait-based gladiator lists;
- testing centered feature modals;
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

When demo mode is enabled, the load game flow may show demo templates separately
from normal local or cloud saves.

Demo templates:

- are read-only source states;
- load through the read-only demo provider as deep clones;
- never mutate the source template;
- do not upload to cloud saves;
- use the current save schema;
- include a `schemaVersion` field;
- remain deterministic.

Starting a demo creates a normal local save copy from the selected template. The
local copy:

- receives a new local `saveId`;
- keeps `metadata.demoSaveId` so the source template can be identified;
- can autosave to the active browser session;
- can be saved through the manual local save action;
- can be copied with "save as";
- never writes back to the demo provider or mutates the source template.

The HUD labels demo-derived saves and exposes a restart-from-template action.
Restarting reloads the original demo template into the same local save slot while
keeping the source template unchanged.

All player-facing demo UI text must use i18n keys and support French and English.

## Available Baseline Scenarios

The project maintains three baseline scenarios.

### Early Demo

ID: `demo-early-ludus`

Purpose: validate the first playable state after the player has recruited a small roster.

Expected state:

- Year 1, Week 1, Monday, planning phase;
- treasury 850 and low ludus reputation;
- all base buildings purchased, with Domus level 3 for the three-gladiator roster;
- Dormitory level 1 focused on recovery while Domus controls roster capacity;
- 3 owned beginner gladiators with stable portraits and combat visual identities;
- 5 predefined market candidates;
- no active Sunday combats;
- simple map state, dawn map theme and low UI density.

### Mid Demo

ID: `demo-mid-ludus`

Purpose: validate normal progression.

Expected state:

- Year 2, Week 4, Thursday, planning phase;
- 4 owned gladiators;
- all base buildings purchased, with levels around 3 or 4;
- Domus capacity large enough for the roster and market test purchases;
- 5 predefined market candidates;
- active weekly planning recommendations;
- day map theme;
- at least one contextual alert.

### Advanced Demo

ID: `demo-advanced-ludus`

Purpose: validate dense UI and late-progression visual states.

Expected state:

- Year 5, Week 7, Saturday, planning phase;
- 6 owned gladiators;
- all base buildings purchased at level 6 with full improvement coverage where available;
- Domus capacity at the maximum roster size;
- 5 predefined market candidates;
- multiple active alerts;
- dusk map theme and late-progression visual coverage.

The advanced demo must verify that the gladiator list panel remains readable with 6 gladiators and that Playwright can advance from Saturday planning into the Sunday arena state without relying on random setup.

## Visual Requirements

Demo saves must be useful for UI and visual testing.

Each demo gladiator must include a stable visual identity:

- portrait asset id;
- combat sprite asset id;
- optional palette or variation metadata.

```ts
export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
  clothingStyle?: string;
  clothingColor?: string;
  hairAndBeardStyle?: string;
  headwearStyle?: string;
  bodyBuildStyle?: string;
  skinTone?: string;
  markingStyle?: string;
}
```

Demo saves should help test:

- map layout;
- building visuals;
- gladiator portraits;
- combat sprite references;
- centered feature modals;
- time-of-day themes derived from saved day and macro phase;
- market and arena external locations;
- Playwright selectors.

Map layout and visual definitions must be data-driven. Demo saves may reference visual ids, but React components should not hardcode building positions, asset ids or player-facing text.

## Data Rules

Demo saves must not call random generation on load.

If a demo scenario needs market candidates or events, those entities must be predefined in the demo save or generated once ahead of time and committed as static data. Arena opponents are generated by the Sunday arena domain flow instead of being stored in demo saves.

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
- gladiator list panel;
- gladiator portrait cards;
- modal host;
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

The save service loads demo templates through the read-only demo provider, then
creates a normal local save copy from the template before it becomes the active
browser session. Manual saves and active-session writes target that local copy,
not the demo provider.

## Test Expectations

During rapid prototyping, automated coverage for demo mode is limited to durable provider and data-shape checks. Browser smoke coverage should return only when the demo flows become stable enough to justify the maintenance cost.

Unit tests should cover:

- demo provider metadata;
- demo save deep cloning;
- read-only provider operations;
- schema validation;
- absence of building budget fields.

Future browser smoke tests may cover:

- demo mode hidden when disabled;
- each demo route blocked when disabled;
- each demo route loads when enabled;
- early, mid and advanced map states render;
- portrait-based gladiator list renders;
- advanced demo gladiator list remains readable with 6 gladiators;
- feature modals can open from stable selectors.

## Acceptance Criteria

Demo mode is valid when:

- `VITE_ENABLE_DEMO_MODE=false` hides demo mode completely;
- `VITE_ENABLE_DEMO_MODE=true` shows demo templates in the load game flow;
- three demo templates are available: `demo-early-ludus`, `demo-mid-ludus` and `demo-advanced-ludus`;
- demo templates start local saves with stable game state;
- demo gladiators have portraits;
- demo gladiators have combat sprite references;
- demo buildings appear on the map;
- Playwright can open each demo directly;
- the advanced demo can test panel density with 6 gladiators;
- demo templates are static and deterministic;
- loading a demo template creates a normal local save copy;
- saving a demo-derived local save does not mutate the template;
- demo templates are not uploaded to cloud saves;
- demo templates do not include building budget fields;
- all player-facing demo UI strings use i18n.
