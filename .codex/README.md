# Codex Workspace Notes

This directory contains versioned Codex helper configuration for the Ludus repository.

## Buttons

Codex app actions are defined in `.codex/environments/environment.toml`.

- `Run web app`: start Vite for local gameplay work.
- `Run quality gate`: run the same checks as CI.

## Daily Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server.
- `npm run check:assets`: verify the production asset manifest.
- `npm run build`: type-check and build the app.
- `npm run lint`: run ESLint.
- `npm run test`: run the focused Vitest suite.
- `npm run test:watch`: run tests in watch mode.

## Browser Ports

- Vite dev defaults to `http://localhost:5175/`.

## Environment Files

- `.env.example` documents public development variables.
- `.env.development.local` is local-only and must not be committed.
- Never commit real secrets, tokens, private endpoints, or local save/debug files.

## Project Skills

- Repository skills live in `.agents/skills/`.
- The Ludus review skill is `.agents/skills/ludus-review/SKILL.md`.
- The Ludus commit and push skill is `.agents/skills/ludus-commit-push/SKILL.md`.
- Invoke `$ludus-review` when reviewing local or PR code changes.
- Invoke `$ludus-commit-push` when committing and pushing local changes.
- Ludus skills should answer the user in French while keeping code, commands, commit messages, and technical file contents in English.

## Reading Path

- Start with `AGENTS.md` or `agents.md` at the repository root.
- Project overview: `docs/00_overview/PROJECT_OVERVIEW.md`.
- Gameplay and balance: `docs/01_game_design/GAMEPLAY.md`, `docs/01_game_design/GAME_DATA.md`, `docs/01_game_design/DEMO_MODE.md`.
- Architecture and save/domain models: `docs/02_technical/ARCHITECTURE.md`, `docs/02_technical/DOMAIN_MODELS.md`.
- UI and art direction: `docs/03_product/UI_UX.md`, `docs/03_product/ART_DIRECTION.md`.
