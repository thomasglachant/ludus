# Codex Prompt 03 — Homepage Visual Replacement

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/01-visual-target.md`, especially the Homepage section, and inspect `docs/visual-migration/references/homepage.jpeg`.

## Goal

Replace the current main menu visuals with a full-screen pixel-art game menu matching the reference feeling.

## Scope

- Update `src/ui/screens/MainMenuScreen.tsx` and related CSS.
- Use generated homepage assets from `public/assets/pixel-art/homepage/`.
- Keep existing load game and options modal flows.
- Keep demo indicator when demo mode is enabled.
- Add a last-save card if save metadata is readily available; otherwise create the visual slot with an empty/loading state without inventing persistence logic.
- Keep resource capsule top-right if the current save/resource data is accessible; otherwise use the main-menu safe/default presentation.

## Layout Requirements

- Full-viewport background illustration.
- Large `LUDUS` logo area with Roman/laurel treatment.
- Left vertical menu buttons:
  - New Game
  - Load
  - Options
  - Help placeholder if existing i18n supports it; otherwise do not hardcode it.
- Top-right resource capsule if data is available.
- Bottom-right last-save card if data is available.
- Lanista tip box bottom-left or under menu, using i18n.

## Constraints

- Preserve `data-testid="main-menu-new-game"`.
- Preserve `data-testid="main-menu-load-game"`.
- Do not expose language switcher directly on the main menu.
- Do not hardcode player-facing strings.

## Acceptance Criteria

- Menu clearly matches `references/homepage.jpeg` in composition and feeling.
- New Game and Load Game tests still pass.
- Load/Options modals remain accessible.

## Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
