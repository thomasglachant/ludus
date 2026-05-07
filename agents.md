# ludus Agent Memory

Keep this file short: OpenCode loads it into every session. Load the referenced docs only when the current task needs that context.

## Project

`ludus` is a Vite + React + TypeScript browser management game about running a Roman gladiator school.

Useful commands: `npm run build`, `npm run lint`, `npm run test`.

## Required Conventions

- Speak French with the user; write code, identifiers, comments and technical docs in English.
- Player-facing UI copy must use i18n keys for French and English; React components must not hardcode visible copy.
- Game rules, catalogs and tunable data belong in `src/game-data`; place values with the object or subsystem they describe instead of creating a central balance file; pure business logic belongs in `src/domain`.
- Domain-specific game data belongs in its owner folder, such as `src/game-data/gladiators` or `src/game-data/ludus`; keep the root of `src/game-data` for cross-system rules, generated manifests and demo-save entry points.
- Do not hand-maintain literal union types for catalog IDs or shared state values; define a canonical `as const` list/object and derive the type with `typeof ...[number]`, `keyof typeof ...`, or indexed access.
- Keep gladiator trait catalog data in `src/game-data/gladiators/traits.ts`: i18n keys, visuals, alert visibility, market metadata, modifiers and trait-specific durations must not be duplicated in domain or UI maps.
- React components should render state and call store actions, selectors or domain services.
- Reuse shared UI primitives and modal infrastructure before adding feature-specific UI; one-off components need an explicit component contract before implementation.
- UI dependency direction is `src/ui/features` -> `src/ui/shared/ludus` -> `src/ui/shared/primitives`; shared layers must not import feature state or domain services.
- Use the shared `GameCard` component for reusable card frames; prefer `surface="dark"` over scenic backgrounds and `surface="light"` for warm content panels.
- Primary CTAs use the shared green `PrimaryActionButton` by default unless the user explicitly asks for another treatment.
- `src/index.css` imports only durable global files from `src/styles`; component, shell and feature CSS lives beside its owner in `src/ui/app-shell`, `src/ui/features` or `src/ui/shared`.
- Generated production images must be WebP before being referenced by the app.
- Save data must include `schemaVersion`; local save is always available; cloud save remains behind an abstraction.

## Product Guardrails

- Default UI is a full-screen, building-first game shell, not a dashboard.
- Preserve the Roman American comic / BD-inspired art direction: bold readable silhouettes, simple colors, quality illustrative details, dark bronze/stone HUDs, warm ivory panels, visible buildings, portraits and theatrical arena combat.
- Debug/dashboard UI may exist only behind `VITE_ENABLE_DEBUG_UI=true` or `/dev/debug-dashboard`.
- Do not reintroduce the removed 1-to-10 building budget system.
- Weekly objectives, recommendations and alerts should reduce micromanagement while keeping manual overrides possible.

## Context Map

- Project overview: `docs/00_overview/PROJECT_OVERVIEW.md`.
- Gameplay and balance: `docs/01_game_design/GAMEPLAY.md`, `docs/01_game_design/GAME_DATA.md`, `docs/01_game_design/DEMO_MODE.md`.
- Architecture and save/domain models: `docs/02_technical/ARCHITECTURE.md`, `docs/02_technical/DOMAIN_MODELS.md`.
- UI and art direction: `docs/03_product/UI_UX.md`, `docs/03_product/ART_DIRECTION.md`.

## Documentation Rules

- Keep durable product, gameplay and technical information in `docs/`.
- Do not add or maintain roadmap/backlog documents in the repository; roadmap planning lives outside the application.
- Keep documentation focused on functionality that exists in the current code.
- Avoid temporary task plans, prompt transcripts and one-off agent prompts in the repository.
- Do not duplicate detailed data across files; link to the source document instead.
