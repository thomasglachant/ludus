# Ludus Review Rules

Use these rules after inspecting the local diff and loading the relevant repository docs. Flag only concrete risks, regressions, or convention violations.

## Severity Order

Prioritize findings in this order:

1. Security and data safety
2. Correctness and functional regressions
3. Architecture boundary violations
4. Save/data integrity
5. Performance, memory, and CPU
6. UI/product consistency
7. Test coverage
8. Maintainability and style

Every finding should explain:

- The broken rule or contract
- Why it matters in the exact scenario
- The relevant doc or convention
- A concrete fix, guard, test, migration, or smaller-scope alternative

## Evidence Standard

Flag only issues with a concrete risk. Each finding should include:

- Priority, file, and tight line reference when available
- The changed contract or invariant
- A reproducible user, save, simulation, renderer, or build scenario
- The expected behavior before the change and the risky behavior after the change
- The relevant Ludus rule, doc, or source contract
- A concrete mitigation: code fix, guard clause, migration, test, asset step, or smaller scope

Do not flag pure preference differences. If a concern depends on missing context, label it as an assumption or residual risk rather than presenting it as a defect.

## Documentation Selection

Always read the root agent instructions first (`AGENTS.md` if present, otherwise `agents.md`), then choose docs from this map:

- Project overview: `docs/00_overview/PROJECT_OVERVIEW.md`
- Gameplay and balance: `docs/01_game_design/GAMEPLAY.md`, `docs/01_game_design/GAME_DATA.md`, `docs/01_game_design/DEMO_MODE.md`
- Architecture and save/domain models: `docs/02_technical/ARCHITECTURE.md`, `docs/02_technical/DOMAIN_MODELS.md`
- UI and art direction: `docs/03_product/UI_UX.md`, `docs/03_product/ART_DIRECTION.md`

Read gameplay docs for domain, state, game-data, economy, events, arena, policies, objectives, or simulation changes.
Read architecture docs for store, renderer, persistence, config, data flow, or module boundary changes.
Read UI/art docs for React screens, styles, renderer visuals, assets, map, combat, modals, and player-facing copy.
Read demo docs when demo templates, demo saves, or restart-from-template behavior changes.
When root instructions, docs, and code disagree, cite the conflicting sources and flag the mismatch as a review risk instead of treating any source as automatically authoritative.

## Architecture

- Game rules and balance data belong in `src/game-data`; new tunable balance variables start in `src/game-data/balance.ts`.
- Pure business logic belongs in `src/domain` and should be deterministic given the same input and random source.
- `src/state` coordinates domain services, save state, and UI state; it should not grow complex gameplay formulas.
- React components render state, capture user intent, and call store actions, selectors, view-models, or domain services.
- React components must not own gameplay formulas, balance values, save mutations, or player-facing strings.
- `src/ui/view-models` may prepare display-ready data and i18n keys, but must not duplicate gameplay rules or balance formulas.
- `src/renderer` must remain a renderer. It should not contain combat outcomes, balance formulas, save mutations, or business decisions.
- Persistence belongs in `src/persistence`; local save remains available and cloud save stays behind an abstraction.
- Runtime flags belong in `src/config`; debug/dashboard UI belongs behind `VITE_ENABLE_DEBUG_UI=true` or `/dev/debug-dashboard`.
- After every real player mutation, the store should preserve the derived-state pipeline: synchronize planning, synchronize economy projection, then refresh game alerts without turning alert-only refreshes into dirty saves.
- Alert rules should stay centralized in `src/domain/alerts`; UI should route alerts through stable fields such as `actionKind`, `buildingId`, and `gladiatorId` rather than feature-specific trigger code.

## Gameplay And Balance

- Do not reintroduce the removed 1-to-10 building budget system or generic building `budget` field.
- Building state should preserve `id`, `isPurchased`, `level`, optional `configuration`, `purchasedImprovementIds`, and optional `selectedPolicyId`.
- Base buildings start purchased at level 1 unless game design, initialization, migrations, tests, and docs change together.
- Ludus roster capacity is driven by the Dormitory base place and purchased Dormitory capacity improvements, then capped by balance; Domus level must not become owned-gladiator capacity.
- Paid policies spend treasury when selected; selecting the active policy should be a no-op.
- Effects with `perHour: true` are applied by hourly ticks. Effects without `perHour` must not be applied every tick.
- Weekly objectives, alerts, recommendations, policies, events, and automation should reduce micromanagement while preserving manual override.
- Sunday arena flow blocks from Sunday 06:00 until completion. Combat rewards and consequences must not be applied more than once.
- Daily events are blocking, pause simulation until resolved, and do not appear on Sunday.
- Random behavior should use existing deterministic domain patterns so tests can control outcomes.
- Sunday arena, event resolution, purchase, upgrade, policy selection, loan, buyout, and skill allocation actions should be idempotent where repeated UI events or reloads could otherwise double-apply treasury, XP, traits, ledger entries, or combat consequences.

## Save And Persistence

- Save data must include `schemaVersion`.
- Persisted shape changes require validation, migration logic, tests, and docs.
- Save validator changes, schema version changes, current schema creation, demo save builders, local/cloud save providers, and tests must stay aligned.
- Dirty-state UI fields such as unsaved changes, last saved time, saving status, and save notice keys should remain transient store/UI state unless the domain model intentionally changes.
- Language preference intentionally stays outside `GameSave`.
- Local save must remain available even if cloud behavior changes.
- Demo templates should load into normal local saves while preserving restart-from-template behavior.
- Imported or old save data is untrusted. Validation and migration must guard shape and version assumptions.
- Never silently discard, corrupt, or reinterpret existing save data without a migration and fallback strategy.

## UI, UX, And Art Direction

- The normal player UI remains a full-screen, map-first game shell, not a dashboard.
- Weekly planning details, building configuration, full gladiator details, events, market details, arena results, and debug data should not be permanently displayed on the main game screen.
- Focused flows should use centered modals or dedicated theatrical full-screen presentation when appropriate.
- Player-facing UI copy must use i18n keys with French and English translations.
- Reuse shared UI primitives and modal infrastructure before adding feature-specific markup.
- Use `CardBlured` for translucent blurred cards or panels over scenic backgrounds.
- Primary CTAs use shared green `CTAButton` or `.cta-button` styling unless the feature needs another treatment.
- Grouped numeric impacts should use `ImpactList` instead of manually arranging multiple `ImpactIndicator` instances.
- Disabled actions should show i18n-backed reasons rather than silently disabling controls.
- Icon-only buttons, interactive building targets, modal controls, and contextual actions need accessible names and keyboard-reachable behavior.
- Modal, sheet, and drill-down changes should preserve focus handling, back behavior, Escape/close semantics, and non-overlapping responsive layouts.
- Map layout, building positions, paths, hit areas, ambient elements, time-of-day themes, and asset references should remain data-driven through `src/game-data` or adjacent visual data modules.
- Preserve the Roman American comic / BD-inspired art direction: dark bronze/stone HUDs, parchment panels, warm countryside map, visible buildings, portraits, sprites, and theatrical arena combat.
- Pixel-art assets should render crisply: avoid smoothing, arbitrary blur, interpolation, anisotropic filtering, or mipmapped smoothing for authored pixel-art textures.
- Renderer-side ambient motion should respect `prefers-reduced-motion`; React should not run per-frame ambient animation state.

## Assets

- Generated production images must be WebP before player-facing UI references them.
- React components should reference production assets through manifests and visual game-data modules, not hardcoded image paths.
- Asset changes should update the committed generated manifest and pass `npm run check:assets`.
- Building, map, gladiator, market, arena, and combat visuals should preserve stable hit areas, readable silhouettes, and intended display sizes.

## CSS And Styling

- CSS lives in `src/styles` by functional area.
- `src/index.css` is an import manifest only.
- Add styles to the narrowest existing stylesheet matching the feature area.
- Split large or mixed stylesheet files as routine maintenance when necessary.
- Check for stale selectors when CSS cleanup touches retired UI surfaces, old DOM scene renderers, or deleted components.
- Preserve established visual language for existing screens instead of introducing generic dashboard patterns.

## i18n

- All visible player-facing strings go through the i18n layer.
- French and English translations are both required for new UI copy.
- Save notices, disabled reasons, empty states, alerts, modal titles, CTA labels, validation messages, and tooltips are player-facing text.
- Prefer passing i18n keys or view-model fields rather than composing visible prose inside React components.

## React And State

- Components should render derived state from selectors/view-models and dispatch store actions instead of duplicating decision logic.
- Avoid state that can be derived from props, store state, domain helpers, or view-models.
- Check effects for cleanup, stale closures, repeated subscriptions, timer leaks, and unintended simulation loops.
- Do not add `useMemo` or `useCallback` by default; follow existing project patterns and React Compiler expectations.
- Verify mobile and desktop usability when player-facing UI changes.
- Verify changed store actions preserve dirty-save semantics, autosave triggers, transient UI state, error keys, and async race handling.

## Renderer

- Pixi scenes should receive prepared serializable view-model props and emit user intent through callbacks.
- Rendering loops must clean up tickers, event listeners, timers, textures, containers, and references on unmount.
- Scene interaction hit zones should remain stable and data-driven.
- Preserve depth sorting, pixel rounding, integer scales near native asset size, and readable zoom presets where relevant.
- Respect `prefers-reduced-motion` for non-essential animation.
- Avoid storing domain decisions, simulation outcomes, combat results, or mutable save state in Pixi containers or renderer-only objects.

## Testing

- New domain logic, save migrations, bug fixes, and deterministic gameplay behavior should include Vitest coverage.
- Tests should cover regression scenarios, not only happy paths.
- Prefer tests close to the logic under `src/domain`, `src/persistence`, or existing tested areas.
- If UI changes affect critical flows, inspect existing component or e2e patterns before asking for broader coverage.
- Useful verification commands are `npm run test`, `npm run lint`, and `npm run build`.
- Do not claim tests pass unless they were run or CI/check output was inspected.

## Security And Data Safety

- Flag hardcoded secrets, API keys, credentials, tokens, private endpoints, or production-only identifiers.
- Browser storage changes should not expose unnecessary sensitive data.
- Imported save data must be validated and migrated defensively.
- Avoid unsafe HTML injection. Require strong justification and sanitization for `dangerouslySetInnerHTML`.
- Avoid leaking debug UI or debug data into normal player flows.

## Functional Regression Detection

Analyze behavior changes, not only style:

- Return values, formulas, filtering, ordering, timing, defaults, validations, side effects, and persistence semantics
- Callers, selectors, renderer props, save providers, domain services, and tests depending on previous behavior
- Contract changes in state shape, save shape, i18n keys, component props, domain helper semantics, routes, feature flags, and asset manifests
- Simulation ticks, Sunday arena gating, event blocking, save dirty-state updates, and purchase/upgrade/payment flows
- Scope creep where a refactor or small fix silently changes unrelated gameplay or UI behavior

For each regression risk, describe the exact scenario and propose a mitigation such as a guard clause, migration, focused test, feature flag, or smaller change.

## Performance, Memory, And CPU

Evaluate performance for every change:

- Unbounded arrays, maps, sets, caches, combat logs, event data, or map data
- Event listeners, intervals, timeouts, animation frames, Pixi ticker callbacks, subscriptions, and resources without cleanup
- Large object retention in singletons, module scope, closures, renderer containers, or store state
- Synchronous heavy computation in React render, state updates, animation loops, or main interaction paths
- O(n^2) or worse patterns over gladiators, events, tiles, paths, assets, combat logs, or save data
- Repeated serialization/deserialization or repeated DTO/view-model transformations on the same large save state
- Unnecessary sequential `await` for independent operations when parallelization is safe and readable

Suggest concrete fixes: memoized selector/view-model, batching, lookup map, bounded list, cleanup, asset reuse, moving work out of render/ticker paths, or parallelizing independent work.

When flagging performance, quantify the likely impact with size, frequency, and path: for example every render, every Pixi tick, every save parse, every weekly simulation step, every large roster, or every combat log update.

## Completeness Checklist

Before concluding, verify applicable items:

- Affected docs were read and cited for findings.
- Game rules remain in `src/domain` and `src/game-data`.
- New tunable balance values start in `src/game-data/balance.ts`.
- React components do not hardcode gameplay formulas, balance values, or visible player copy.
- French and English i18n entries are present for new visible text.
- Shared UI primitives were reused where applicable.
- CSS changes are in the right `src/styles` functional file, not direct rules in `src/index.css`.
- Layout and visual definitions remain data-driven.
- Save shape changes include `schemaVersion`, validation, migrations, tests, and docs.
- Local save remains available and cloud save remains abstracted.
- Player-facing asset changes are WebP, manifest-backed, and covered by `npm run check:assets`.
- Accessibility-sensitive UI changes preserve focus, keyboard access, accessible names, disabled reasons, and responsive layout.
- Tests or explicit testing gaps are noted.
- `npm run lint`, `npm run test`, `npm run build`, and `npm run check:assets` status is known or explicitly not run.
