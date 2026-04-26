# ludus Agent Memory

## Project Summary

`ludus` is a browser-based management game where the player manages a Roman gladiator school.

The player is a lanista. The core loop is weekly preparation followed by Sunday arena combats. The player manages priorities, risk, upgrades, gladiator condition, contracts, scouting, betting preparation and arena consequences.

## Stack

- Vite
- React
- TypeScript
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- Husky
- lint-staged
- commitlint

## Core Conventions

- Source code, file names, variables, functions, classes, types, constants and code comments must be in English.
- Technical documentation for development should be in English.
- The assistant should speak French with the user.
- Use Conventional Commits.
- Visible UI text must support French and English through i18n keys.
- React components must not hardcode player-facing copy.
- Game rules and balance data belong in `src/game-data`.
- Business logic belongs in pure TypeScript modules under `src/domain`.
- React components should render state and call store actions, selectors or domain services.
- Reuse shared UI primitives and modal infrastructure before creating feature-specific components.
- Save data must include `schemaVersion`.
- Local save is always available.
- Cloud save exists behind an abstraction and can remain mocked until a backend is chosen.

## Gameplay Concepts

- Weekly objectives drive routine behavior.
- Automatic recommendations keep large rosters manageable.
- Manual overrides remain possible.
- Readiness scores and alerts help the player handle exceptions.
- Buildings are purchased, upgraded and configured through improvements and policies.
- The removed 1-to-10 building budget system must not return.
- Dormitory beds limit owned gladiator capacity.
- Sunday arena combats are turn-based and logged.
- Betting and scouting should become important weekend preparation systems.

## Player Interface Direction

- The default player interface is a full-screen, map-first game shell.
- The main screen centers on a large interactive ludus map.
- Top HUD, bottom portrait roster, contextual panels, modals and alert/toast layer support the map.
- The player should not see every system at once.
- Weekly planning, contracts, events, building details, gladiator details, market, arena preparation and debug data open contextually.
- The old dashboard-style screen may exist only as a development/debug interface behind `VITE_ENABLE_DEBUG_UI=true` or `/dev/debug-dashboard`.
- Map layout, building positions, paths, decorations and visual definitions should be data-driven.

## Visual Migration Guardrails

- Durable visual direction lives in `docs/03_product/ART_DIRECTION.md` and `docs/03_product/UI_UX.md`.
- The target DA is a Roman pixel-art management game: dark bronze/stone HUDs, parchment panels, warm countryside map, visible buildings, portraits, animated sprites and a theatrical arena combat screen.
- Future player-facing UI must preserve the map-first, game-like direction and avoid reverting to plain white dashboard cards.
- Asset paths, map visuals, animation definitions and time-of-day themes must remain data-driven through `src/game-data` or adjacent visual data modules.
- Generated pixel-art assets live under `public/assets/pixel-art/` and are wired through `src/game-data/visual-assets.ts`.
- The historical migration archive in `docs/visual-migration/` is context only, not the primary source for future decisions.

## Current Documentation Map

- `docs/00_overview/PROJECT_VISION.md`: product vision and structural constraints.
- `docs/00_overview/MVP_SCOPE.md`: MVP scope, exclusions and acceptance criteria.
- `docs/01_game_design/GAMEPLAY.md`: gameplay loop and design rules.
- `docs/01_game_design/GAME_DATA.md`: gameplay data and balance reference.
- `docs/01_game_design/DEMO_MODE.md`: deterministic demo mode.
- `docs/02_technical/ARCHITECTURE.md`: technical architecture.
- `docs/02_technical/DOMAIN_MODELS.md`: TypeScript domain and save models.
- `docs/03_product/UI_UX.md`: player interface requirements.
- `docs/03_product/ART_DIRECTION.md`: visual direction.
- `docs/03_product/decisions/0001-player-ui-map-first.md`: accepted map-first UI decision.
- `docs/04_roadmap/ROADMAP.md`: durable product roadmap.

## Current State

- The codebase has the React/Vite/TypeScript baseline.
- Domain modules, game-data modules, persistence providers, i18n, state and UI folders exist.
- Local save, mock cloud save and demo save provider concepts are represented.
- Browser play sessions are auto-persisted separately from manual local saves so refresh on `/play` can resume the current session; `/` remains the homepage; manual saves remain player snapshots.
- Demo mode is controlled by `VITE_ENABLE_DEMO_MODE=true`.
- Debug UI is controlled by `VITE_ENABLE_DEBUG_UI=true`.
- Current demo saves are `demo-early-ludus`, `demo-mid-ludus` and `demo-advanced-ludus`.

## Next Priorities

- Keep the map-first UI as the default player experience.
- Preserve deterministic demo saves for visual and Playwright testing.
- Improve weekly planning, readiness, alerts, contracts, events and betting without adding repetitive micromanagement.
- Keep game data, domain logic, persistence and React UI separated.
- Update documentation whenever gameplay rules, save schema, architecture or product direction changes.

## Documentation Rules

- Keep durable product, gameplay and technical information in `docs/`.
- Avoid temporary task plans, prompt transcripts and one-off initialization instructions.
- Avoid duplicating detailed data across multiple files; link to the source document instead.
- Keep `agents.md` concise as short-term orientation for AI agents.
- Do not store one-off AI-agent prompts or task breakdowns in the repository.
