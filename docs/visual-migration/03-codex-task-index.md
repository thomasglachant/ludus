# Codex Task Index

Run these tasks as separate PRs after this preparation pack is merged.

## Recommended PR Sequence

| PR  | Prompt                                      | Main Goal                                   | Depends On                                |
| --- | ------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| 1   | `prompts/01-foundation-ui-tokens.md`        | Restyle app foundation and shared chrome.   | Preparation pack                          |
| 2   | `prompts/02-asset-pipeline.md`              | Run generator and wire manifest/data paths. | PR 1 optional, can be parallel if careful |
| 3   | `prompts/03-homepage.md`                    | Replace main menu visuals.                  | PR 1 + PR 2                               |
| 4   | `prompts/04-living-map.md`                  | Replace map visuals and add ambient life.   | PR 1 + PR 2                               |
| 5   | `prompts/05-gladiators.md`                  | Add portraits/sprites/animation variants.   | PR 2 + PR 4                               |
| 6   | `prompts/06-modals.md`                      | Restyle modals and building upgrade UX.     | PR 1 + PR 2                               |
| 7   | `prompts/07-combat-screen.md`               | Dedicated combat scene.                     | PR 1 + PR 2 + PR 5                        |
| 8   | `prompts/08-documentation-tests-cleanup.md` | Durable docs, tests, cleanup.               | PRs 1-7                                   |

## How to Ask Codex

Use one prompt at a time. Example:

```text
Please execute docs/visual-migration/prompts/01-foundation-ui-tokens.md.
Keep the repository buildable, preserve i18n and data-testid values, and run the quality gate listed in the prompt.
```

When a prompt says to run the quality gate, Codex should run at least:

```bash
npm run build
npm run lint
npm run test
```

Run Playwright when UI flows are changed:

```bash
npm run test:e2e
```

## PR Naming Convention

Suggested branches and PR titles:

1. `visual/foundation-ui-tokens` — `feat(ui): restyle visual foundation`
2. `visual/asset-pipeline` — `feat(assets): add pixel art asset pipeline`
3. `visual/main-menu` — `feat(ui): replace main menu visuals`
4. `visual/living-map` — `feat(map): add living pixel art map`
5. `visual/gladiator-animations` — `feat(gladiators): add visual variants and animations`
6. `visual/game-modals` — `feat(ui): restyle modals and upgrade flows`
7. `visual/combat-screen` — `feat(combat): add arena combat presentation`
8. `visual/docs-cleanup` — `docs: preserve visual direction guardrails`

## Review Checklist for Every PR

- Does the app still compile?
- Did any player-facing string bypass i18n?
- Did any gameplay formula move into React?
- Are asset paths and map definitions centralized?
- Are stable test ids preserved?
- Does reduced motion have a safe fallback for new animations?
- Does the PR visibly move the app closer to the references?
