# Visual Migration Archive

This folder preserves the visual migration background that led to the current
Roman pixel-art direction.

It is historical context, not the primary source for future implementation
decisions. Durable visual direction now lives in:

- `docs/03_product/ART_DIRECTION.md`;
- `docs/03_product/UI_UX.md`;
- `docs/02_technical/ARCHITECTURE.md` for visual asset/data boundaries.

The one-off Codex prompts and task index used to execute the migration were
removed after the durable decisions were moved into permanent documentation.

## Target Outcome

The default player experience should match the attached references in feeling and structure:

- a full-screen game menu with a large pixel-art ludus illustration;
- a map-first game shell where the ludus feels like a living Roman school, not a web dashboard;
- parchment/bronze/stone UI chrome, dark framed HUDs, and warm pixel-art surfaces;
- modal overlays that sit on top of the map and feel like in-game panels;
- a dedicated combat scene with arena background, crowd ambience, combatant panels, skill selection, and combat log;
- ambient motion: moving clouds, torch flicker, banner flutter, grass sway, subtle crowd and building life;
- multiple gladiator identities, portraits, map sprites, and at least two-frame idle/combat motion.

## Asset Generator

The asset generator script remains active:

```bash
node scripts/generate-visual-migration-assets.mjs
```

It creates deterministic SVG pixel-art scaffolding and a manifest under
`public/assets/pixel-art/`. The generated assets are not final hand-authored
art; they are a production-shaped baseline wired through `src/game-data`.

## Reference Images

The user-provided references are stored in `references/`:

- `homepage.jpeg`: target main menu mood and layout;
- `map.jpeg`: target management map and shell layout;
- `modal.jpeg`: target modal style;
- `fight.jpeg`: target combat screen style.

Do not copy the reference images pixel-for-pixel. Use them as art-direction references for composition, materials, spacing, color temperature, and game feel.

## Non-Negotiables

- Keep code, filenames, variables, and technical docs in English.
- All player-facing UI text must keep using i18n keys.
- React components must not own gameplay formulas.
- Map layout, visual definitions, asset paths, animation definitions, and time-of-day values must remain data-driven.
- Preserve stable `data-testid` values used by Vitest/Playwright.
- Keep the debug dashboard hidden behind debug routing/feature flag.
- Use `npm run build`, `npm run lint`, `npm run test`, and `npm run test:e2e` as the final quality gate.

## Files in This Folder

| File                              | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `00-current-repo-audit.md`        | Pre-migration implementation audit.                |
| `01-visual-target.md`             | Historical target brief distilled from references. |
| `02-implementation-strategy.md`   | Historical phased migration strategy.              |
| `04-asset-generation-workflow.md` | Historical generated asset workflow.               |
| `05-asset-contract.md`            | Historical manifest/data contract notes.           |
| `06-animation-and-life.md`        | Historical ambient and character animation brief.  |
| `07-combat-screen.md`             | Historical dedicated combat screen brief.          |
| `08-future-feature-guardrails.md` | Historical guardrails merged into permanent docs.  |
