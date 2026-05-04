# Architecture

## Stack

The application is a browser game built with Vite, React, TypeScript and Vitest.

## Layer Responsibilities

### `src/game-data`

Contains tunable balance and content definitions.

Current macro data includes:

- `balance.ts`: economy, progression, macro simulation, arena and building tuning;
- `buildings.ts`: building definitions and unlock data;
- `building-skills.ts`: generated four-tier skill trees;
- `economy.ts`: loan definitions;
- demo saves.

New tunable gameplay numbers should start in `GAME_BALANCE`.

### `src/domain`

Contains pure game logic.

Important macro modules:

- `weekly-simulation/weekly-simulation-actions.ts`: daily and weekly macro resolution, including finance projections from the weekly plan;
- `economy/economy-actions.ts`: ledger summaries, loans and buyouts;
- `staff/staff-actions.ts`: staff market actions, sales, assignments and type rules;
- `planning/planning-actions.ts`: shared daily plan updates, alerts and macro recommendations;
- `combat/combat-actions.ts`: Sunday combat resolution.

Domain modules should be deterministic when a random source is provided.

### `src/state`

Coordinates domain actions and persistence.

The store exposes macro actions such as:

- `advanceWeekStep`;
- `updateDailyPlan`;
- `takeLoan`;
- `buyoutLoan`;
- `assignStaffToBuilding`.

Gameplay progression runs through explicit macro actions, primarily daily and weekly resolution.

### `src/ui`

React renders the game shell, panels and modals. Components display state and call store/domain actions. They must not hardcode visible text or gameplay formulas.

Current macro UI surfaces include:

- building-first `GameShell`;
- macro `TopHud`;
- bottom navigation for Buildings, Gladiators, Planning, Finances and Events;
- `FinancePanel`;
- `BuildingsListPanel`;
- `GladiatorsListPanel`;
- `StaffListPanel`;
- enriched `BuildingPanel` tabs.

### `src/persistence`

Persistence handles local saves, demo templates and mocked cloud provider behavior.

The macro refactor introduced a current-schema-only gate. Saves with old schema versions are rejected instead of migrated.

### `src/i18n`

All visible UI copy uses i18n keys in French and English.

## Save Compatibility

`CURRENT_SCHEMA_VERSION` is the only supported schema. The save validator rejects older schemas cleanly. Demo saves are generated with the current schema and include economy, staff and weekly planning state.

## Testing

Current test focus:

- building validation and macro building state;
- combat rewards without participation payouts;
- arena reward ledger entries;
- building and gladiator market ledger entries;
- economy loans, projections and buyout;
- staff assignment rules;
- staff ledger entries for purchase and sale;
- event treasury ledger entries and debt defeat;
- weekly simulation daily/weekly resolution;
- save validation and persistence;
- i18n key alignment and hardcoded JSX copy detection.
