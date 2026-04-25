# Architecture

## Stack

The application is a browser game built with:

- Vite;
- React;
- TypeScript;
- ESLint;
- Prettier;
- Husky;
- lint-staged;
- commitlint;
- Vitest;
- React Testing Library;
- Playwright.

## Repository Structure

```text
ludus/
├── agents.md
├── README.md
├── docs/
│   ├── 00_overview/
│   ├── 01_game_design/
│   ├── 02_technical/
│   ├── 03_product/
│   └── 04_roadmap/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   ├── config/
│   ├── domain/
│   ├── game-data/
│   ├── i18n/
│   ├── persistence/
│   ├── state/
│   ├── test/
│   ├── ui/
│   └── utils/
└── tests/
    └── e2e/
```

## Layer Responsibilities

### `src/game-data`

Contains tunable game definitions, content and balance parameters.

Examples:

- building definitions;
- upgrade costs;
- improvement effects;
- policy definitions;
- combat constants;
- arena rewards;
- market generation settings;
- planning thresholds;
- contract definitions;
- event definitions;
- map layout and visual definitions;
- demo saves;
- initial game configuration.

### `src/domain`

Contains pure TypeScript business logic.

Examples:

- advance time;
- validate building purchase;
- apply building effects;
- generate market gladiators;
- calculate readiness;
- generate alerts;
- resolve combat;
- apply combat consequences;
- validate contracts;
- resolve events;
- serialize, validate and migrate saves.

Domain modules should be deterministic when provided the same input and random source.

### `src/state`

Contains app state and actions.

The store coordinates domain services and UI state. It should not contain complex formulas.

### `src/ui`

Contains React components. Components should display data, capture user intent and dispatch actions.

React components must not own gameplay formulas, hardcoded balancing values or player-facing strings.

### `src/persistence`

Contains save providers and save services.

Persistence modules handle:

- local browser saves;
- mocked cloud saves;
- demo save provider behavior;
- provider selection and save service orchestration.

### `src/i18n`

Contains translation setup and locale files.

All visible UI text should use i18n keys and support French and English.

### `src/config`

Contains feature flag parsing and other runtime configuration.

Current flags:

- `VITE_ENABLE_DEMO_MODE`;
- `VITE_ENABLE_DEBUG_UI`.

## Save Provider Abstraction

```ts
export interface SaveProvider {
  listSaves(): Promise<GameSaveMetadata[]>;
  loadSave(saveId: string): Promise<GameSave>;
  createSave(save: GameSave): Promise<void>;
  updateSave(save: GameSave): Promise<void>;
  deleteSave(saveId: string): Promise<void>;
}
```

Initial implementations:

- `LocalSaveProvider` using browser storage;
- `CloudSaveProvider` as a mock placeholder;
- `DemoSaveProvider` for read-only deterministic demo saves.

## Save Data

Save data is a JSON snapshot of the full game state and includes `schemaVersion`.

Local save is always available. Cloud save requires authentication in the long-term product direction, but the initial implementation can remain mocked behind the provider abstraction.

Demo saves are read-only templates and must not autosave or upload to cloud saves.

## Game Tick

The game advances through ticks.

```ts
export interface GameTickContext {
  elapsedRealMilliseconds: number;
  speed: GameSpeed;
  currentSave: GameSave;
  effectAccumulatorMinutes?: number;
  random?: () => number;
}
```

A tick can:

1. advance time;
2. apply weekly routine behavior;
3. apply building effects;
4. update gladiator gauges;
5. generate alerts;
6. trigger weekly events when needed;
7. trigger arena flow on Sunday.

Tick behavior should remain testable through explicit inputs.

## Determinism

The project uses deterministic data wherever stable testing matters.

Rules:

- demo saves do not generate random state on load;
- tests can provide a deterministic `random` function to domain logic;
- game data should be centralized for repeatable balancing;
- UI tests should use stable selectors rather than visual text when possible.

## i18n

No visible UI text should be hardcoded in React components.

Use keys such as:

```ts
t('mainMenu.newGame');
t('weeklyPlan.objectives.fightPreparation');
t('alerts.lowEnergy.title');
```

## Debug UI

The old dashboard-style game screen may be kept only as a developer/debug interface.

It must not be the default player interface and should be available only through:

- `VITE_ENABLE_DEBUG_UI=true`; or
- a development-only route such as `/dev/debug-dashboard`.

## Testing Strategy

Unit tests should focus on domain logic first.

Priority test areas:

- time advancement;
- week/year rollover;
- save validation;
- building purchase and upgrade rules;
- dormitory capacity;
- market generation;
- readiness score;
- automatic planning recommendations;
- combat hit chance and damage;
- combat consequences;
- reward distribution;
- contract resolution;
- event effects;
- corrupted save handling;
- demo provider read-only behavior.

Playwright tests should cover high-value player flows and demo-mode visual states.

## Feature Implementation Sequence

When adding a durable feature:

1. add or update game data;
2. implement domain logic;
3. add tests;
4. expose store actions or selectors;
5. create UI components;
6. add i18n keys;
7. update documentation when behavior, data or architecture changes.
