# Codex Prompt 06 — Modal and Upgrade Flow Restyle

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/01-visual-target.md`, especially the Modal section, and inspect `docs/visual-migration/references/modal.jpeg`.

## Goal

Restyle global modals and building upgrade/purchase confirmation so they look like in-game parchment/bronze panels.

## Scope

- Restyle `src/ui/modals/AppModal.tsx` through CSS and minor class hooks.
- Keep centralized modal infrastructure.
- Update confirm modal rendering in `ModalHost` if needed.
- Add a richer building action modal content for purchase/upgrade if the current generic confirm cannot support the target layout.
- Update `BuildingPanel` action flow to use the richer modal for building upgrade/purchase.

## Modal Content Requirements

For building upgrade/purchase:

- dark title strip with uppercase title;
- building illustration from visual assets;
- current level → next level comparison;
- list of effects/improvements with old/new values where available;
- cost bar with coin icon and visual room for future resources;
- green primary action;
- beige/parchment cancel action;
- dimmed map behind modal.

## Constraints

- Do not duplicate modal infrastructure across features.
- Do not hardcode copy; use i18n keys.
- Existing building actions must still call current store/domain actions.
- Keep existing test ids for building confirmation dialogs or add stable replacement test ids.

## Acceptance Criteria

- Building upgrade modal visually matches `references/modal.jpeg` in feeling and structure.
- Shared modals across Load/Options/Confirm inherit the new DA.
- Build/lint/tests pass.

## Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
