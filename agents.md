# ludus Agent Memory

Keep this file short: OpenCode loads it into every session. Load the referenced docs only when the current task needs that context.

## Project

`ludus` is a Vite + React + TypeScript browser management game about running a Roman gladiator school.

Useful commands: `npm run build`, `npm run lint`, `npm run test`.

## Required Conventions

- Speak French with the user; write code, identifiers, comments and technical docs in English.
- Use Conventional Commits when committing.
- Player-facing UI copy must use i18n keys for French and English; React components must not hardcode visible copy.
- Game rules and balance data belong in `src/game-data`; new tunable balance variables must start in `src/game-data/balance.ts`; pure business logic belongs in `src/domain`.
- React components should render state and call store actions, selectors or domain services.
- Reuse shared UI primitives and modal infrastructure before adding feature-specific UI.
- Use the shared `CardBlured` component for translucent blurred cards or panels over scenic backgrounds.
- Primary CTAs use the shared green `CTAButton` / `.cta-button` style by default unless the user explicitly asks for another treatment.
- CSS lives in `src/styles` by functional area; keep `src/index.css` as an import manifest and split large or mixed stylesheet files as routine maintenance.
- Save data must include `schemaVersion`; local save is always available; cloud save remains behind an abstraction.

## Product Guardrails

- Default UI is a full-screen, building-first game shell, not a dashboard.
- Preserve the Roman pixel-art direction: dark bronze/stone HUDs, parchment panels, visible buildings, portraits and theatrical arena combat.
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
