# Codex Prompt 01 — Visual Foundation and UI Tokens

You are working in the `thomasglachant/ludus` repository.

Execute the first visual migration PR. Read `docs/visual-migration/README.md`, `01-visual-target.md`, and `02-implementation-strategy.md` first.

## Goal

Replace the current dashboard-like base styling with a Roman pixel-art game UI foundation while preserving current architecture, i18n, and tests.

## Scope

- Update global CSS tokens in `src/index.css`.
- Make `AppLayout` and normal game screens true full-viewport game surfaces.
- Restyle shared primitives in `src/ui/components/shared.tsx` through CSS only where possible.
- Restyle `TopHud`, `LeftNavigationRail`, `ContextualPanelHost`, `BottomGladiatorRoster`, toasts/alerts, and generic buttons to match the reference style.
- Keep component APIs stable unless a small change is clearly necessary.

## Visual Direction

Use:

- dark obsidian/charcoal HUD surfaces;
- bronze/gold borders;
- parchment modal/card surfaces;
- red primary menu/action accents;
- green confirmation buttons;
- Roman insignia/laurel motifs through CSS/SVG where lightweight;
- subtle pixel-art texture using CSS gradients and existing/generated SVGs only.

Avoid:

- plain white cards;
- generic SaaS shadows;
- excessive border-radius;
- dashboard spacing and wide white panels.

## Constraints

- No player-facing hardcoded text.
- Keep existing `data-testid` attributes.
- Do not move gameplay rules into React.
- Do not introduce external font files.
- Respect `prefers-reduced-motion` for any new animation.

## Suggested Files

- `src/index.css`
- `src/ui/layout/AppLayout.tsx` if layout class changes are needed
- `src/ui/hud/TopHud.tsx` only if class structure needs minor improvement
- `src/ui/game-shell/GameShell.tsx` only if structural class hooks are needed
- `src/ui/game-shell/LeftNavigationRail.tsx`
- `src/ui/roster/BottomGladiatorRoster.tsx`
- `src/ui/components/shared.tsx` only for class names or wrapper hooks, not logic

## Acceptance Criteria

- The game shell visually resembles the dark-framed map UI reference.
- The app no longer looks like a light admin dashboard.
- All current gameplay still works.
- Build, lint, and unit tests pass.

## Commands

Run:

```bash
npm run build
npm run lint
npm run test
```

Run Playwright if route/layout selectors changed:

```bash
npm run test:e2e
```
