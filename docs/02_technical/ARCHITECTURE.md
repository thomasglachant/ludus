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

- `balance.ts`: economy, progression, gladiator XP, macro simulation, arena and building tuning;
- `buildings.ts`: building definitions and unlock data;
- `building-skills.ts`: generated four-tier skill trees;
- `gladiator-traits.ts`: permanent and temporary gladiator trait definitions;
- `economy.ts`: loan definitions;
- `market.ts`: market generation and experience-based price tuning;
- demo saves.

New tunable gameplay numbers should start in `GAME_BALANCE`.

### `src/domain`

Contains pure game logic.

Important macro modules:

- `weekly-simulation/weekly-simulation-actions.ts`: daily and weekly macro resolution, including training XP and finance projections from the weekly plan;
- `alerts/alert-actions.ts`: central derived alert engine for ludus, building and gladiator alerts;
- `notifications/notification-actions.ts`: persisted ludus-life notification history and archive actions;
- `gladiators/skills.ts`: integer 1..10 skill helpers;
- `gladiators/progression.ts`: XP-derived level selectors and skill point allocation rules;
- `gladiator-traits/gladiator-trait-actions.ts`: active trait lookup, duration pruning and trait modifier selectors;
- `economy/economy-actions.ts`: ledger summaries, loans and buyouts;
- `planning/planning-actions.ts`: shared daily plan updates, validation and macro recommendations;
- `ludus/capacity.ts`: Dormitory-driven gladiator roster capacity selectors;
- `market/market-actions.ts`: market generation, purchase, sale and experience-based price calculation;
- `combat/combat-actions.ts`: Sunday combat resolution and combat XP awards.

Domain modules should be deterministic when a random source is provided.

Alerts are derived from the current save. `planning.alerts` remains the persisted storage location for compatibility, but `src/domain/alerts` owns alert generation rules. Rules are stateless and return at most one active alert for the evaluated target. New alerts should be added as ludus, building or gladiator rules in that module, plus i18n keys and tests.

Notifications are persisted and authored by the domain action that caused the fact. They should be used for autonomous ludus-life events such as injuries or gladiator departures, not for direct player actions. Projection paths must not create notifications.

### `src/state`

Coordinates domain actions and persistence.

The store exposes macro actions such as:

- `advanceWeekStep`;
- `updateDailyPlan`;
- `takeLoan`;
- `buyoutLoan`;

Gameplay progression runs through explicit macro actions, primarily daily and weekly resolution.

After each real player mutation, the store runs the derived-state pipeline: planning synchronization, economy projection synchronization, then `refreshGameAlerts`. A defensive alert refresh also runs every 5 seconds; alert-only refreshes do not mark the save dirty, update `updatedAt` or trigger autosave by themselves.

### `src/ui`

React renders the game shell, panels and modals. Components display state and call store/domain actions. They must not hardcode visible text or gameplay formulas.

Gladiator UI should consume derived view models for level, XP toward the next level, available skill points and integer skills. React components should not infer levels from raw XP or calculate skill allocation rules.

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
- bottom navigation for Buildings, Gladiators, Market, Planning and Finances;
- `FinancePanel`;
- `BuildingsListPanel`;
- `GladiatorsListPanel`;
- enriched `BuildingPanel` tabs.

### `src/persistence`

Persistence handles local saves, demo templates and mocked cloud provider behavior.

The save validator supports only the current schema version. Older schema versions are rejected cleanly.

### `src/i18n`

All visible UI copy uses i18n keys in French and English.

## Save Compatibility

`CURRENT_SCHEMA_VERSION` is the only supported save schema. New, updated and demo saves are emitted with it; older schema versions are rejected cleanly. Demo saves are generated with the current schema and include economy and weekly planning state.

## Testing

Current test focus:

- building validation and macro building state;
- integer gladiator skills and XP-derived levels;
- training and combat XP awards;
- central alerts for ludus planning, Dormitory roster capacity, gladiator skill points and visible gladiator traits;
- skill point spending rules;
- market prices based exclusively on experience;
- combat rewards without participation payouts;
- arena reward ledger entries;
- building and gladiator market ledger entries;
- economy loans, projections and buyout;
- event treasury ledger entries and debt defeat;
- weekly simulation daily/weekly resolution;
- save validation and persistence;
- i18n key alignment and hardcoded JSX copy detection.
