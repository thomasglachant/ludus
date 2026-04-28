#!/usr/bin/env node

const brief = String.raw`You are Codex working in the ludus repository.

Goal: generate production-ready Roman pixel-art gladiator assets for the composable gladiator visual variant system.

Read these source-of-truth files first:
- src/game-data/gladiator-visual-variants.ts for the full variant matrix.
- src/game-data/gladiator-classes.ts for class names and class-aware accessory expectations.
- src/game-data/visual-assets.ts for the current manifest shape.
- scripts/generate-visual-migration-assets.mjs and scripts/build-pixi-production-manifest.mjs for current asset and manifest conventions.

Requirements:
- Preserve the existing Roman pixel-art direction: warm bronze, stone, parchment, theatrical arena silhouettes.
- Keep assets readable at small map-sprite size and distinct in portrait and combat views.
- Produce variants by composing clothing style, clothing color, hair/beard, headwear, accessory, body build, skin tone, and marking style.
- Accessories should stay class-compatible when class context is available: Murmillo and Secutor use gladius/scutum silhouettes, Retiarius uses trident/net, Thraex uses sica/parmula, Hoplomachus uses spear/round shield.
- Do not hardcode player-facing UI copy in React components.
- Do not remove or break existing fallback assets.
- Update production manifests so getGladiatorAssetSet can resolve every generated gladiator asset set.
- Keep map frames, combat frames, spritesheets and atlases consistent with the existing frame keys: map-idle, map-walk, map-train, map-eat, map-rest, map-celebrate, map-healing, combat-idle, combat-attack, combat-hit, combat-block, combat-defeat, combat-victory.

Expected output:
- Generated production assets under public/assets/pixel-art-production/gladiators/.
- Updated src/game-data/generated/asset-manifest.production.json entries, including the optional variant metadata fields declared in src/game-data/visual-assets.ts.
- Any required script updates to regenerate or validate those assets.

Verification:
- npm run lint
- npm run build
- npm run test
- If an asset validation script exists for production assets, run it too.
`;

console.log(brief);
