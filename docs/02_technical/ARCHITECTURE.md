# Architecture

## Stack

The application is a browser game built with Vite, React, TypeScript and Vitest.

The UI uses plain CSS colocated with the React component or feature that owns
the selectors. Radix UI or React Aria may be used for accessibility primitives
where appropriate.

## Layer Responsibilities

### `src/game-data`

Contains tunable game rules, catalogs and content definitions.

Current macro data includes:

- `buildings/`: building definitions, visual assets, levels, improvements, policies, activities and skills;
- `gladiators/`: names, skills, progression, combat gauge, traits and visual identity data;
- `ludus/`: ludus-specific reference data such as name generation pools;
- `economy/`: treasury defaults and loan definitions;
- `market/`: market generation and pricing rules;
- `arena/` and `combat/`: arena scheduling, rewards, odds and combat tuning;
- `events/`: event definitions and event generation rules;
- `visual-assets.ts`: cross-system visual asset manifest access for locations, UI and generated assets;
- `weekly-simulation.ts`, `planning.ts` and `time.ts`: cross-system macro rules;
- demo saves.

New tunable gameplay values should live with the catalog or subsystem they describe. Domain-specific files should be placed inside the owning `game-data` folder rather than using a root-level prefix. Add a separate config file only for rules that are genuinely shared across several definitions.

### `src/domain`

Contains pure game logic.

Important macro modules:

- `weekly-simulation/weekly-simulation-actions.ts`: daily and weekly macro resolution, including training XP and finance projections from the weekly plan;
- `alerts/alert-actions.ts`: central derived alert engine for ludus, building and gladiator alerts;
- `notifications/notification-actions.ts`: persisted ludus-life notification history and archive actions;
- `gladiators/skills.ts`: integer 1..10 skill helpers;
- `gladiators/traits.ts`: derived permanent and temporary gladiator trait definitions from the `src/game-data/gladiators/traits.ts` catalog;
- `gladiators/progression.ts`: XP-derived level selectors and skill point allocation rules;
- `gladiators/trait-actions.ts`: active trait lookup, duration pruning and trait modifier selectors;
- `economy/economy-actions.ts`: ledger summaries, loans and buyouts;
- `planning/planning-actions.ts`: shared daily plan updates, validation and macro recommendations;
- `ludus/capacity.ts`: Dormitory-driven gladiator roster capacity selectors;
- `market/market-actions.ts`: market generation, purchase, sale and experience-based price calculation;
- `combat/combat-actions.ts`: Sunday combat resolution and combat XP awards.

Domain modules should be deterministic when a random source is provided.

## Type Sources

Catalog IDs and shared finite state values must have one source of truth. Define the runtime list or object first with `as const`, then derive the TypeScript type from that value with indexed access, `keyof typeof`, or a typed projection from the canonical definition. Do not hand-maintain parallel literal unions for buildings, traits, loans, arena ranks, weekdays, planning activities, event statuses or similar data-backed identifiers.

Local component-only variants may stay as narrow prop types when they are not reused as runtime lists. If a variant list is reused, exported, validated, persisted or shared across modules, promote it to a named constant and derive the type from that constant.

Game data modules are the source of truth for both reference data and the tunable values attached to that data. Avoid central balance mirrors and parallel metadata maps. For example, `src/game-data/gladiators/traits.ts` is the single declaration point for trait i18n keys, visuals, alert visibility, market metadata, gameplay modifiers and trait-specific durations. Domain code may derive typed definitions and selectors from game-data catalogs, but must not maintain duplicate trait metadata maps.

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

The UI hierarchy is:

- `src/ui/shared/primitives`: accessible low-level primitives and adapters
  around Radix UI or React Aria APIs. This layer has no game concepts, store
  access or feature-specific copy.
- `src/ui/shared/ludus`: reusable Ludus components that compose primitives into
  the Roman-themed game language. Core contracts include `Button`,
  `PrimaryActionButton`, `IconButton`, `ListActionButton`, `SegmentedControl`,
  `ActionBar`, `AppDialogShell`, `DarkPanel`, `LightPanel`,
  `WaxTabletTabs`, `GameFact`, `GameMeter`, `GameList`, `GameSection`,
  `GameFeedback` and `GamePanel`.
- `src/ui/shared/components`: cross-feature Ludus helpers such as entity lists,
  tooltips, impact indicators, alerts, ledgers and menu cards.
- `src/ui/app-shell`: global application layout and modal infrastructure.
- `src/ui/features`: player-facing feature folders. Each feature owns its
  screens, surfaces, panels, local components and view models.

Dependency direction is `src/ui/features -> src/ui/shared/ludus ->
src/ui/shared/primitives`. Shared layers must not import feature state or domain
services.

Styling follows the same ownership rule. `src/index.css` imports only durable
global files from `src/styles`: `ludus-theme.css` and `foundation.css`.
Component, shell and feature CSS lives beside its owner, such as
`src/ui/features/ludus/shell/ludus-shell.css` or
`src/ui/shared/ludus/ludus-controls.css`. Use plain CSS by default; do not add
`styled-components`, CSS Modules or another styling dependency without a
separate architectural decision.

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
