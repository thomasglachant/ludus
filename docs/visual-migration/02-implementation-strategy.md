# Implementation Strategy

## Migration Principle

Do not attempt to rebuild the entire app in one PR. Execute a sequence of small PRs where each one keeps the app buildable and testable.

The existing app already has correct architectural seams. The migration should strengthen those seams by moving visual decisions into data/asset definitions and styling primitives.

## Phase 0 — Preparation PR

This pack is Phase 0. It adds:

- migration docs;
- Codex prompts;
- reference images;
- deterministic asset-generation script;
- guardrails for future work.

No runtime code should change in this phase except optional docs index links.

## Phase 1 — Visual Foundation

Goal: introduce DA tokens and restyle shared UI chrome.

Tasks:

- add CSS variables for Roman pixel-art UI materials;
- restyle `AppLayout` to allow full-viewport screens;
- restyle shared primitives in `src/ui/components/shared.tsx` without changing their public API;
- restyle `TopHud`, `BottomGladiatorRoster`, `LeftNavigationRail`, and context panels;
- keep tests stable by preserving test ids.

Acceptance:

- main shell no longer looks like a web dashboard;
- shared primitives have parchment/bronze/dark-panel styling;
- no gameplay logic changed.

## Phase 2 — Asset Pipeline

Goal: create generated baseline assets and a manifest.

Tasks:

- run `node scripts/generate-visual-migration-assets.mjs`;
- review generated files under `public/assets/pixel-art/`;
- add a typed manifest loader or static game-data mapping;
- update `building-visuals.ts`, `gladiator-visuals.ts`, and map visual data to prefer the new pixel-art paths;
- keep old placeholder paths as fallback only if necessary.

Acceptance:

- generated assets exist for homepage, map, buildings, gladiators, UI, ambient effects, and combat;
- asset paths are centralized;
- build/lint/tests pass.

## Phase 3 — Homepage

Goal: replace the current main menu with the target reference layout.

Tasks:

- use the new generated homepage/background asset;
- implement left menu stack, top/right resource capsule, last-save card;
- keep load/options modal flow;
- keep language through options only;
- ensure demo indicator is visible when demo mode is enabled.

Acceptance:

- homepage matches the visual feeling of `references/homepage.jpeg`;
- `main-menu-new-game` and `main-menu-load-game` remain stable;
- local/demo save loading still works.

## Phase 4 — Living Map

Goal: make the central ludus map look alive.

Tasks:

- render background layers from generated map assets;
- implement ambient layers: clouds, grass, trees, banners, torch flicker, smoke/fire/crowd hints;
- map time-of-day phase to asset/tint/lighting data;
- improve building hit areas and hover/selected states;
- add optional labels styled as dark in-world plaques.

Acceptance:

- map resembles `references/map.jpeg` in composition and tone;
- dawn/day/dusk/night are visibly distinct;
- map has subtle continuous movement without moving gladiators yet;
- `prefers-reduced-motion` disables or reduces ambient animation.

## Phase 5 — Gladiator Visuals and Animation

Goal: make gladiators memorable and animated.

Tasks:

- expand gladiator visual definitions;
- wire portrait variants into roster, market, panels, and combat;
- wire map sprite frames into CSS animation;
- add minimum two-frame idle, walk, train, eat, rest, healing, and combat idle states;
- preserve save compatibility by deriving missing visual identity from gladiator id.

Acceptance:

- at least 12 distinct generated visual identities are available;
- current demo saves show stable portraits/sprites;
- fighters have two-frame motion in combat presentation.

## Phase 6 — Modal Styling

Goal: align modals with `references/modal.jpeg`.

Tasks:

- restyle global `AppModal` and contextual panels;
- create a richer building action modal content path for purchase/upgrade;
- show image, current/next level, improvement/effect rows, and cost bar;
- keep existing confirm modal as fallback for simple destructive actions.

Acceptance:

- building upgrade modal matches the reference feeling;
- shared modal infrastructure remains centralized;
- building actions still call existing domain/store actions.

## Phase 7 — Combat Screen

Goal: add a dedicated combat presentation.

Tasks:

- create `CombatScreen`/`CombatOverlay` using existing `CombatState`;
- implement arena background, fighter panels, central sprites, skill panel, fatigue bars, combat log;
- map existing combat turns to a replay/progression experience;
- add minimal CSS/SVG two-frame fighter animation;
- provide route/store wiring without breaking current arena panel.

Acceptance:

- combat resembles `references/fight.jpeg`;
- combat log and consequences still come from domain state;
- no gameplay formulas move into React.

## Phase 8 — Documentation and Cleanup

Goal: make the art direction durable.

Tasks:

- merge durable decisions from this folder into `docs/03_product/ART_DIRECTION.md` and `docs/03_product/UI_UX.md`;
- update `agents.md` with the new DA guardrails;
- document the asset-generation command and manifest in technical docs;
- remove obsolete placeholder generator only after new generator fully replaces it.

Acceptance:

- future Codex work can discover the visual direction without this migration pack;
- temporary prompts are either archived or clearly marked as migration-only;
- quality gate passes.
