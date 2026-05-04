# Architecture

## Stack

The application is a browser game built with Vite, React, TypeScript and Vitest.

The UI migration target uses Tailwind CSS for styling, shadcn/ui-style
composition for reusable component APIs and Radix UI or React Aria for
accessibility primitives where appropriate.

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

The target UI hierarchy is:

- `src/ui/primitives`: accessible low-level primitives, Tailwind variants and
  adapters around shadcn/ui, Radix UI or React Aria APIs. This layer has no game
  concepts, store access or feature-specific copy.
- `src/ui/game`: reusable Ludus components that compose primitives into the
  Roman-themed game language. Core contracts include `RomanButton`,
  `ParchmentModal`, `StonePanel`, `ParchmentPanel`, `WaxTabletTabs`,
  `ResourceBadge`, `TreasuryBadge`, `ReputationBadge` and `GamePanel`.
- `src/ui/screens`: route, screen and modal surfaces that bind store state,
  selectors, actions and view models, then compose `src/ui/game` components.

Dependency direction is `src/ui/screens -> src/ui/game -> src/ui/primitives`.
Lower layers must not import screens, feature state or domain services.

Reuse is mandatory by default. Before adding feature-local UI, check whether a
screen can be built from the existing game components, modal/list frameworks,
shared panels, badges, tabs, buttons or primitives. A one-off component needs a
short contract describing the gap, owned props/state, reuse expectation and
shared building blocks.

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
