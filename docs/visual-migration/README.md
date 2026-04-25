# Visual Migration Execution Pack

This folder is a Codex-ready execution pack for replacing the current prototype visuals with the target pixel-art Roman management-game direction.

It is intentionally stored separately from the long-term product docs so migration tasks can be executed step by step without losing the durable design constraints. Once the migration is complete, keep the guardrails from `08-future-feature-guardrails.md` and archive or delete one-off task prompts if they become obsolete.

## Target Outcome

The default player experience should match the attached references in feeling and structure:

- a full-screen game menu with a large pixel-art ludus illustration;
- a map-first game shell where the ludus feels like a living Roman school, not a web dashboard;
- parchment/bronze/stone UI chrome, dark framed HUDs, and warm pixel-art surfaces;
- modal overlays that sit on top of the map and feel like in-game panels;
- a dedicated combat scene with arena background, crowd ambience, combatant panels, skill selection, and combat log;
- ambient motion: moving clouds, torch flicker, banner flutter, grass sway, subtle crowd and building life;
- multiple gladiator identities, portraits, map sprites, and at least two-frame idle/combat motion.

## How to Use This Pack

Run the migration as multiple small PRs. The recommended sequence is documented in `03-codex-task-index.md`, and each step has a copy-paste prompt in `prompts/`.

The asset generator script is intentionally included in `scripts/generate-visual-migration-assets.mjs`. It creates deterministic SVG pixel-art scaffolding and an asset manifest. Codex should run it early, then wire generated assets into the React/game-data layers. The generated assets are not meant to be final hand-authored art; they are a production-shaped asset baseline that makes the game immediately look much closer to the target references.

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

| File                              | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `00-current-repo-audit.md`        | Current implementation audit and migration impact.     |
| `01-visual-target.md`             | Target art direction distilled from the references.    |
| `02-implementation-strategy.md`   | Phased technical strategy.                             |
| `03-codex-task-index.md`          | PR-by-PR task order and dependency graph.              |
| `04-asset-generation-workflow.md` | How Codex should generate and wire assets.             |
| `05-asset-contract.md`            | File paths, manifest schema, and visual data contract. |
| `06-animation-and-life.md`        | Ambient and character animation brief.                 |
| `07-combat-screen.md`             | Dedicated combat screen brief.                         |
| `08-future-feature-guardrails.md` | Durable guardrails for future feature work.            |
| `prompts/`                        | Copy-paste prompts for Codex execution PRs.            |
