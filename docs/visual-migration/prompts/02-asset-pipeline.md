# Codex Prompt 02 — Pixel-Art Asset Pipeline

You are working in the `thomasglachant/ludus` repository.

Read `docs/visual-migration/04-asset-generation-workflow.md` and `05-asset-contract.md` first.

## Goal

Generate and wire a deterministic pixel-art asset baseline so the application can use proper visual assets instead of placeholder SVGs/CSS blocks.

## Scope

1. Run the generator:

```bash
node scripts/generate-visual-migration-assets.mjs --clean
```

2. Commit generated assets under:

```text
public/assets/pixel-art/
```

3. Add or update a typed visual asset mapping module, for example:

```text
src/game-data/visual-assets.ts
```

4. Update visual data modules to prefer new assets:

- `src/game-data/building-visuals.ts`
- `src/game-data/gladiator-visuals.ts`
- `src/game-data/gladiator-animations.ts` if frame arrays are introduced
- `src/game-data/time-of-day.ts` if map background asset paths are added

5. Keep fallback paths to existing assets only if needed for a safe transition.

## Requirements

- Use the generated manifest as the source of asset path truth or convert it into typed data.
- Do not hardcode individual asset paths inside React components.
- Generate dawn/day/dusk/night map backgrounds.
- Generate at least 12 gladiator variants with portraits and two-frame animation assets.
- Generate building level variants for all base buildings.
- Generate arena and market assets.
- Generate UI texture/frame assets.

## Validation

- Add a simple Vitest test for manifest/mapping shape if practical.
- Ensure all referenced asset paths exist.
- Ensure the app still builds.

## Commands

```bash
node scripts/generate-visual-migration-assets.mjs --clean
npm run build
npm run lint
npm run test
```
