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
- Vitest.

## Repository Structure

```text
ludus/
├── AGENTS.md
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
│   ├── renderer/
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

`src/game-data/balance.ts` is the canonical home for gameplay balance values. New variables that tune economy, progression, training, combat, market, arena, planning, contracts, events, gauges, skills or building behavior must be added to `GAME_BALANCE` before being consumed elsewhere.

Dedicated game-data modules may re-export compatibility constants from `GAME_BALANCE` or combine those constants with larger content definitions. Domain, state, UI, persistence and renderer modules must not introduce new hardcoded balance constants.

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
- pixel-art asset manifest helpers;
- time-of-day visual themes;
- ambient map element definitions;
- gladiator portrait and sprite frame resolution;
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

Shared UI primitives live under `src/ui/components` and should be reused before adding feature-specific panel, modal, badge, empty-state, effect-list, cost-summary or tab markup.

### `src/renderer`

Contains real-time scene renderers that are mounted from React.

PixiJS is the current scene renderer through a small scene host in
`src/renderer/pixi`. It is used for living scenes that need continuous
rendering, layered sprites, animation and scene hit zones.

Examples:

- ludus map scene;
- gladiator sprites and map movement;
- ambient map effects;
- arena combat presentation.

PixiJS is a renderer only. It must not contain game rules, balance formulas,
combat resolution, save mutations or business decisions. Scene components
receive prepared, serializable view-model props from React/state selectors and
emit user intent through callbacks.

### `src/ui/view-models`

Contains UI view-model and selector helpers.

View-models prepare display-ready data for React components, especially when the same concept appears in more than one panel or screen. They may format labels as i18n keys, select relevant game-data definitions and combine domain helper outputs, but they must not duplicate gameplay rules or balancing formulas.

Examples:

- `createBuildingPanelViewModel(save, buildingId)`;
- `createDormitoryCapacityViewModel(save)`;
- `createGladiatorCardViewModel(save, gladiator)`.

React components should consume prepared view-model fields and call store actions. Rules such as upgrade validation, ludus capacity, readiness scoring, market prices and combat resolution remain in `src/domain` and `src/game-data`.

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
- `VITE_ENABLE_DEBUG_UI`;
- `VITE_USE_PLACEHOLDER_ART`.

## Scene Renderer

React remains the application shell. It owns routing, HUDs, panels, menus,
modals, i18n, app providers and state orchestration.

PixiJS renders real-time game scenes inside that shell. It is the renderer for
the player map and combat presentation, and it is responsible for visual scene
composition such as sprites, animation loops, hit zones, depth sorting and
ambience.

The scene renderer boundary is:

- `src/domain` decides game outcomes and legal actions;
- `src/game-data` defines visual data, layout, asset references and tunable
  renderer parameters;
- `src/state` coordinates saves, domain actions and UI state;
- `src/ui` mounts React screens and passes prepared props;
- `src/renderer` draws scenes from serializable view-models and reports
  interaction intent through callbacks.

PixiJS must never become a second game engine for business logic. If a scene
needs to know what to draw, React/state prepares a view-model. If the player
clicks a scene element, Pixi calls back with an id or intent and React/state
performs the action.

### Scene View-Model Contract

Every Pixi scene receives a serializable view-model. Scenes must not receive the
complete store, store hooks, mutable save objects, domain service instances or
business rule helpers.

Allowed scene inputs:

- ids;
- numbers;
- strings;
- booleans;
- arrays and records of serializable values;
- asset paths resolved through game-data;
- callbacks for user intent.

Disallowed scene inputs:

- direct store access;
- domain decision functions;
- business rule helpers;
- save mutation functions;
- non-serializable application objects.

This keeps scenes testable, replaceable and limited to rendering.

### Map Movement And Ambience

Gladiator movement is represented as game state, not as Pixi business logic.
Domain/state decides the target location and may store a movement intent such as
current location, target location, activity, start time and duration.
Game-data defines map points, activity destinations and movement speed. Pixi
interpolates between prepared points for presentation only.

When a save has no movement intent, the scene renders the gladiator at the
current assigned building or location. This keeps existing saves compatible and
allows the Pixi map to remain a visual layer.

Ambient map elements are renderer data. Definitions live in `src/game-data`
alongside map visuals and time-of-day themes. The Pixi scene receives prepared
ambient view-model entries with asset paths, opacity, animation duration and
layering.

Ambient animation runs inside Pixi tick callbacks. React must not update state
per frame for banners, crowd hints or future ambient variants.
`prefers-reduced-motion` is read by the React adapter and passed as a boolean to
the scene view-model. When reduced motion is active, non-essential ambient
animation and sprite frame cycling stop while the scene keeps static visual
state.

### Pixi Pixel-Perfect Rendering

Pixi scenes must preserve authored pixel-art edges:

- load pixel-art textures with the Pixi v8 texture source API:
  `texture.source.scaleMode = 'nearest'`;
- when using `Assets.load`, pass `data` with `scaleMode: 'nearest'` and
  `autoGenerateMipmaps: false` for single textures, or pass the same options
  through `textureOptions` for spritesheets;
- do not use deprecated `SCALE_MODES` constants for new code;
- initialize the Pixi renderer with `roundPixels: true` and use `roundPixels`
  on sprites, graphics and particle containers that represent pixel-art scene
  elements;
- do not attach blur filters, linear interpolation, anisotropic filtering or
  generated mipmaps to pixel-art assets;
- prefer integer sprite scales for small sprites when the requested visual size
  is close enough to the native asset size; large backgrounds and buildings may
  scale to layout dimensions, but their texture sampling still stays nearest;
- map camera zoom must use readable presets from `src/game-data/map-layout.ts`
  instead of arbitrary wheel zoom values;
- visual debug inspection is enabled only through debug UI mode. When
  `VITE_ENABLE_DEBUG_UI=true`, Pixi scenes may draw overlay metrics for native
  size, rendered scale, anchor and hitbox.

## Visual Asset Pipeline

The player UI uses generated or authored pixel-art assets from:

```text
public/assets/pixel-art-production/
public/assets/pixel-art/
```

The production manifest is:

```text
public/assets/pixel-art-production/asset-manifest.production.json
```

The generated fallback manifest is:

```text
public/assets/pixel-art/asset-manifest.visual-migration.json
```

TypeScript import mirrors are generated at:

```text
src/game-data/generated/asset-manifest.production.json
src/game-data/generated/asset-manifest.visual-migration.json
```

The fallback scaffold generator command is:

```bash
node scripts/generate-visual-migration-assets.mjs
```

Use `--clean` when intentionally regenerating the complete scaffold:

```bash
node scripts/generate-visual-migration-assets.mjs --clean
```

The Pixi production manifest can be rebuilt from production assets and fallback
metadata with:

```bash
node scripts/build-pixi-production-manifest.mjs
```

Validate production manifest coverage with:

```bash
node scripts/validate-pixi-production-assets.mjs
```

The public manifests are useful for inspection, while the generated
`src/game-data/generated` mirrors are exposed to TypeScript through
`src/game-data/visual-assets.ts` and `src/rendering/pixi/assets`.
React components and Pixi scenes should not import the JSON manifests directly
or hardcode individual asset paths.

Current visual data boundaries:

- `src/game-data/visual-assets.ts` owns manifest types and low-level asset set
  helpers;
- `src/game-data/building-visuals.ts` maps building ids and levels to rendered
  building assets;
- `src/game-data/gladiator-visuals.ts` resolves deterministic gladiator
  identities, portraits, map frames and combat frames;
- `src/game-data/gladiator-animations.ts` maps gladiator state to animation
  states;
- `src/game-data/map-visuals.ts` defines ambient map elements and their asset
  paths;
- `src/game-data/time-of-day.ts` defines phase timing, background assets,
  lighting variables and ambient multipliers.

Generated SVG scaffolding is a durable fallback baseline, not a license to place
visual paths directly in React. Production art should enter the same
manifest/data boundary.

## Modal Management

Focused player interactions use the centralized modal framework instead of local modal state, side-panel chrome or standalone feature screens.

Conventions:

- `src/state/ui-store.tsx` owns a modal stack and exposes `openModal`, `pushModal`, `replaceModal`, `backModal`, `closeModal` and `closeAllModals`;
- `src/ui/modals/ModalHost.tsx` is the single rendering host for globally managed dialogs and game feature modals;
- `src/ui/modals/AppModal.tsx` owns shared modal chrome: centered backdrop, dark title strip, optional back button, close button, scrollable body, footer actions and `sm`, `md`, `lg`, `xl` sizes;
- feature components open typed modal requests instead of rendering their own backdrop, header or footer;
- `pushModal` is used for sub-flows such as Game menu -> Options; the back button returns to the previous modal and `X` closes the whole stack;
- modal copy uses i18n keys, not hardcoded player-facing text;
- local component state is acceptable only for state inside modal content, such as selected tabs, local filters or progressive combat-log display.

Size guidance:

- `sm`: menu, simple confirmation;
- `md`: options, lightweight forms, focused gladiator details;
- `lg`: building details, building action previews, load game, contracts and events;
- `xl`: dense systems such as market, weekly planning and arena preparation/results.

Confirmation modals should be used for irreversible, expensive or blocking actions. Lightweight form modals should be used when a focused form does not need its own screen. New gameplay panels should be implemented as modal content rendered by `ModalHost`, not as independently positioned contextual panels.

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
- `ActiveSessionProvider` using browser storage for the current browser session;
- `CloudSaveProvider` as a mock placeholder;
- `DemoSaveProvider` for read-only deterministic demo saves.

Provider responsibilities:

- providers perform storage reads and writes only;
- providers do not own UI state such as dirty status, saving status or toast keys;
- providers may reject invalid operations, such as write attempts against the demo provider.

`ActiveSessionProvider` responsibilities:

- store the current in-browser session separately from the manual local save list;
- persist the latest `GameSave`, the current screen and the manual dirty state;
- restore only resumable player screens such as `ludus` or `market`, falling back to `ludus` for non-game screens;
- validate stored session data with the normal save parser before restore;
- clear corrupted active-session data instead of exposing invalid state to the store.

`SaveService` responsibilities:

- create new local saves from domain initial-save helpers;
- update `updatedAt` for successful local or cloud writes;
- orchestrate local, mock cloud and demo providers;
- load demo templates through the read-only demo provider;
- create normal local saves from demo templates while preserving
  `metadata.demoSaveId` for restart-from-template behavior;
- avoid introducing a real backend until a future cloud-save decision is made.

Store responsibilities:

- keep the active `currentSave`;
- track save UI state: `hasUnsavedChanges`, `lastSavedAt`, `isSaving` and `saveNoticeKey`;
- restore a valid active browser session on startup only when the browser path is `/play`, then navigate back to its stored game screen;
- write the active browser session continuously while gameplay state changes;
- flush the active browser session during `pagehide` to survive browser refresh or tab close;
- mark player-driven save mutations dirty unless the action writes immediately by design;
- clear dirty state and set `lastSavedAt` after a successful save;
- keep dirty state after a failed save and expose a save error key;
- reset an active demo-derived local save from its original demo template when
  requested.

## Save Data

Save data is a JSON snapshot of the full game state and includes `schemaVersion`.

Local save is always available. Cloud save requires authentication in the long-term product direction, but the initial implementation can remain mocked behind the provider abstraction.

Demo templates are read-only and must not upload to cloud saves. Starting a demo
creates a normal local save copy before it becomes the active browser session.
The copy can be saved like any other local save, while
`metadata.demoSaveId` keeps the original template available for a reset action.

The MVP save model has two layers:

- the active browser session is auto-persisted under a dedicated browser-storage key so refresh, tab close or accidental reload can resume the current play session;
- manual local saves remain explicit player snapshots listed by the normal save provider.

The active browser session is resumed only from the dedicated play URL, `/play`. Loading the normal root URL, `/`, always shows the homepage/main menu even when an active session exists. Internal navigation to game screens writes `/play`; navigation back to homepage-oriented screens writes `/`.

`hasUnsavedChanges`, `isSaving`, `saveNoticeKey` and other transient UI save state are not persisted in `GameSave`. The active browser session may store the current manual dirty flag beside the save payload, but it does not add fields to the save schema.

`lastSavedAt` is session UI state derived from the last successful write timestamp. It may mirror `GameSave.updatedAt` after loading or saving, but it is still tracked by the store for display rather than added as a separate save-schema field.

Language is an app preference owned by the browser and `ui-store`, not game data. The UI uses the browser language by default when no stored preference exists, and manual language changes are stored outside `GameSave`.

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

Blocking game flows are derived from the save, not from transient component state. `getActiveGameInterruption(save)` returns a daily event interruption when an event is pending, or a Sunday arena interruption when `arena.arenaDay` exists. The game store uses this derived state to stop the real-time tick loop and auto-open the relevant UI.

Sunday arena resolution is checkpointed at Sunday 08:00. If a tick would pass beyond that time, `tickGame` clamps the time advancement to 08:00, starts the arena day and leaves further progression blocked until the arena day is completed. Completing the arena day resolves weekly arena contracts before moving the clock to Sunday 20:00. `arena.isArenaDayActive` stays true until the natural Monday rollover so Sunday evening ticks do not restart the arena flow.

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

During MVP prototyping, tests are intentionally narrow. The default suite should protect durable game rules, save behavior and i18n hygiene. It should not try to lock down volatile UI flows, component structure, visual layout or end-to-end player paths while the product shape is still changing quickly.

Add or update tests only when a change affects durable behavior, fixes a recurring bug, protects save compatibility, or covers a rule that would be expensive to verify manually. Prefer build and lint checks for routine UI iteration.

Priority test areas:

- time advancement;
- week/year rollover;
- save validation;
- building purchase and upgrade rules;
- ludus capacity;
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

Component, renderer and Playwright tests are paused until the MVP interaction model stabilizes. Reintroduce them selectively for high-value smoke flows and stable demo states once those flows become release-blocking.

## Quality Gate

Every pull request should be able to prove that the baseline remains healthy before gameplay work continues.

The local quality gate is:

```bash
npm run build
npm run lint
npm run test
```

Command responsibilities:

- `npm run build` checks TypeScript project references and produces the Vite production build;
- `npm run lint` checks source, tests and configuration files with ESLint;
- `npm run test` runs the lean Vitest core suite for `src/domain`, `src/persistence` and i18n key hygiene.

Low-level rules should remain covered by Vitest domain tests whenever practical. UI and E2E coverage should return only when the protected flow is stable enough that the maintenance cost is clearly worth it.

The CI quality gate should mirror the local commands.

## Feature Implementation Sequence

When adding a durable feature:

1. add or update game data;
2. implement domain logic;
3. add tests only for durable rules, save behavior or recurring bugs;
4. expose store actions or selectors;
5. create UI components;
6. add i18n keys;
7. update documentation when behavior, data or architecture changes.
