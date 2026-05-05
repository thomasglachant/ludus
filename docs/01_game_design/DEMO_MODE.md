# Demo Mode

## Goal

Demo mode is a durable developer-only feature for loading predefined static saves. It exists to make UI testing, debugging, visual review and Playwright scenarios stable and repeatable.

Demo mode is useful for:

- testing the building-first player interface;
- testing building visuals at different progression levels;
- testing portrait-based gladiator lists;
- testing centered feature modals;
- testing visual density and building states;
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
- all base buildings purchased, with Dormitory level 2 and two bought capacity improvements for the three-gladiator roster;
- Domus level 3 for administrative progression and loan coverage;
- 3 owned beginner gladiators with stable portraits, combat visual identities, low XP-derived levels and integer skills from 1 to 10;
- 5 predefined market candidates with deterministic XP-derived levels and experience-based prices;
- no active Sunday combats;
- simple building overview state and low UI density.

### Mid Demo

ID: `demo-mid-ludus`

Purpose: validate normal progression.

Expected state:

- Year 2, Week 4, Thursday, planning phase;
- 4 owned gladiators;
- all base buildings purchased, with levels around 3 or 4;
- Dormitory capacity improvements large enough for the roster and market test purchases;
- 5 predefined market candidates with deterministic XP-derived levels and experience-based prices;
- active weekly planning recommendations;
- at least one contextual alert, including a skill allocation alert when a gladiator has available skill points.

### Advanced Demo

ID: `demo-advanced-ludus`

Purpose: validate dense UI and late-progression visual states.

Expected state:

- Year 5, Week 7, Saturday, planning phase;
- 6 owned gladiators;
- all base buildings purchased at level 6 with full improvement coverage where available;
- Dormitory capacity improvements at the maximum roster size;
- 5 predefined market candidates with deterministic XP-derived levels and experience-based prices;
- multiple active alerts, including at least one skill allocation alert;
- late-progression visual coverage.

The advanced demo must verify that the gladiator list panel remains readable with 6 gladiators and that Playwright can advance from Saturday planning into the Sunday arena state without relying on random setup.

## Visual Requirements

Demo saves must be useful for UI and visual testing.

Each demo gladiator must include a stable visual identity:

- portrait asset id;
- stable visual asset id for combat portrait presentation;
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

- building visuals;
- gladiator portraits;
- combat visual identity references;
- centered feature modals;
- market and arena external locations;
- Playwright selectors.

Visual definitions must be data-driven. Demo saves may reference visual ids, but React components should not hardcode asset ids or player-facing text.

Demo visual references should resolve through the production visual manifest.
Generated demo-facing images must follow the project art direction and use WebP
when referenced by the application.

## Data Rules

Demo saves must not call random generation on load.

If a demo scenario needs market candidates or events, those entities must be predefined in the demo save or generated once ahead of time and committed as static data. Arena opponents are generated by the Sunday arena domain flow instead of being stored in demo saves.

Owned gladiators and market candidates must store integer skills from 1 to 10 and accumulated XP. Available skill points remain derived from XP and allocated skills when needed for UI coverage.

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
- buildings overview;
- building cards;
- gladiator list panel;
- gladiator portrait cards;
- modal host;
- market action;
- arena action.

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
- integer gladiator skills and XP-derived levels;
- deterministic experience-based market prices;
- skill allocation alert coverage where the scenario expects available skill points.

Future browser smoke tests may cover:

- demo mode hidden when disabled;
- each demo route blocked when disabled;
- each demo route loads when enabled;
- early, mid and advanced building overview states render;
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
- demo gladiators have stable combat visual identity references;
- demo buildings appear in the buildings overview;
- demo gladiators use integer skills and XP-derived levels;
- demo market prices are deterministic and based on experience;
- at least one baseline scenario covers skill allocation alerts;
- Playwright can open each demo directly;
- the advanced demo can test panel density with 6 gladiators;
- demo templates are static and deterministic;
- loading a demo template creates a normal local save copy;
- saving a demo-derived local save does not mutate the template;
- demo templates are not uploaded to cloud saves;
- demo templates do not include building budget fields;
- all player-facing demo UI strings use i18n.
