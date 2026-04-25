# Codex Prompt 08 — Documentation, Tests, and Cleanup

You are working in the `thomasglachant/ludus` repository.

Read all files under `docs/visual-migration/` and review the visual migration PRs already merged.

## Goal

Move durable visual direction into permanent documentation, update agent memory, ensure tests cover the new visuals at a high level, and remove obsolete migration-only clutter if appropriate.

## Scope

- Update `docs/03_product/ART_DIRECTION.md` with final durable visual direction.
- Update `docs/03_product/UI_UX.md` with final UI behaviors and combat/map/modal expectations.
- Update `docs/02_technical/ARCHITECTURE.md` if asset manifest/data boundaries changed.
- Update `agents.md` with concise guardrails for future agents.
- Add/update tests for:
  - main menu core actions;
  - map renders with time-of-day data attributes/assets;
  - modal upgrade/purchase flow still opens and confirms;
  - combat presentation can progress a visible turn if implemented.
- Decide whether `docs/visual-migration/prompts/` should remain, be archived, or be removed.

## Constraints

- Keep `agents.md` concise.
- Do not duplicate long asset manifests in multiple docs.
- Keep one source of truth for durable art direction.

## Acceptance Criteria

- Future Codex work can understand and preserve the new DA without reading the migration prompts.
- All tests pass.
- The repo no longer contains misleading old placeholder guidance.

## Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
