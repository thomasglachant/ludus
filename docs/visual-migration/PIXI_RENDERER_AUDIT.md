# PixiJS Renderer Audit

Audited on 2026-04-27.

## Scope

This audit covers the current PixiJS renderer implementation for the player-facing
ludus map and combat scene. It is documentation-only and does not prescribe any
runtime changes in this PR.

Primary files inspected:

- `package.json` and `package-lock.json`;
- `src/renderer/pixi/PixiApplicationHost.tsx`;
- `src/renderer/pixi/PixiSceneViewport.tsx`;
- `src/renderer/scenes/ludus-map/*`;
- `src/renderer/scenes/combat/*`;
- `src/ui/map/PixiLudusMap.tsx`;
- `src/ui/combat/PixiCombatArenaStage.tsx`;
- `src/game-data/visual-assets.ts`;
- `src/game-data/building-visuals.ts`;
- `src/game-data/gladiator-visuals.ts`;
- `src/game-data/map-visuals.ts`;
- `src/game-data/time-of-day.ts`;
- `src/game-data/map-layout.ts`;
- `src/game-data/gladiator-animations.ts`;
- `docs/02_technical/RENDERER_STRATEGY.md`;
- `docs/03_product/ART_DIRECTION.md`;
- `docs/03_product/UI_UX.md`.

## Status Legend

- **Implemented**: present and broadly aligned with the renderer strategy.
- **Partial**: present, but limited or incomplete against the product/technical
  target.
- **Missing**: no current implementation found.
- **Risky**: present but likely to create maintenance, performance, asset-quality
  or product-direction risk.

## Summary

The PixiJS renderer is now the active player-facing renderer for both the main
map and combat stage. React remains the shell for routing, HUD, panels, modals,
i18n and store orchestration, while Pixi receives serializable view-models.

The main implementation risks are asset quality and lifecycle hygiene:

- current scene assets are SVG-based generated scaffolding, not final
  player-facing art;
- legacy SVG placeholder fallbacks still exist for buildings, portraits and map
  sprites;
- texture loading uses the Pixi global asset cache without explicit unload or
  failure handling;
- old DOM/CSS map and combat styling still exists in `src/index.css`, which can
  confuse future ownership even though the normal player scene is Pixi-mounted.

## Area Classification

| Area                                   | Status      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PixiJS dependencies and version        | Implemented | `package.json` declares `pixi.js` `^8.18.1`; the previous `@pixi/react` dependency has been removed in favor of a small manual scene host.                                                                                                                                                                                                                                                                                                                                                         |
| Pixi application lifecycle             | Implemented | `PixiApplicationHost` owns `Application` creation, transparent WebGL setup, `resizeTo`, a capped ticker (`maxFPS = 20`), scene mounting, scene updates and explicit app teardown. Test mode returns a DOM host instead of mounting Pixi.                                                                                                                                                                                                                                                           |
| Map renderer                           | Partial     | `LudusMapScene` renders a Pixi map with terrain graphics, optional time-of-day background asset, paths, procedural decorations, location hit zones, building/external sprites, labels, ambient sprites, gladiators and a tint overlay. It is the active map inside `GameShell` through `PixiLudusMap`. Hover/selected states from the older DOM target are not represented in the Pixi scene, and some visual details are still procedural `Graphics` rather than authored assets.                 |
| Combat renderer                        | Partial     | `CombatScene` renders the active combat stage through Pixi with a background, arena fallback graphics, fighter sprites, health bars, labels, idle animation and attack lunge motion. It is mounted by `PixiCombatArenaStage`. The scene uses fixed 960x480 coordinates and does not currently include camera/layout adaptation inside Pixi, crowd layers as independent scene elements, hit reactions, defeat states or richer turn choreography.                                                  |
| Asset loading                          | Partial     | Map and combat scenes collect asset paths from their view-models and call `Assets.load<Texture>()` in React effects. The effects guard against setting state after unmount. There is no loading/error state inside the Pixi scenes, no retry or missing-asset diagnostics, and no preloading strategy for scene bundles.                                                                                                                                                                           |
| Texture management                     | Risky       | Loaded textures are stored in React state per scene and rely on Pixi's global `Assets` cache. The code does not unload unused textures, destroy texture references, or define ownership of generated versus authored asset lifetime. This is probably acceptable for the current small asset set but risky as authored sprite sheets and larger backgrounds arrive.                                                                                                                                |
| Cleanup/destroy logic                  | Partial     | Window resize and canvas pointer/wheel listeners are removed on cleanup, async asset loads ignore stale results, scenes explicitly destroy their containers, and textures remain owned by Pixi's global asset cache. Pointer capture is released on normal pointer end, but interrupted drags and long-term asset-cache policy still need more coverage.                                                                                                                                           |
| Camera/pan/zoom                        | Partial     | The map has wheel zoom, pointer drag panning, camera clamping, overscroll tolerance and resize clamping. The default camera comes from `src/game-data/map-layout.ts`. Missing pieces include touch pinch zoom, keyboard controls, reset/recenter controls, selected-location focus, persisted camera state and combat-scene camera behavior.                                                                                                                                                       |
| Input handling                         | Risky       | Map locations use Pixi `eventMode="static"` and `onPointerTap` to report location ids back to React. Drag suppression avoids accidental taps after panning. Canvas-level wheel and pointer listeners handle camera interactions. There is no hover/selected visual feedback in Pixi, no explicit accessibility alternative beyond the scene label/test-only hit buttons, and direct canvas listeners plus Pixi pointer events need care to avoid future conflicts.                                 |
| Time-of-day rendering                  | Partial     | `createLudusMapSceneViewModel` maps save time to `TIME_OF_DAY_DEFINITIONS`, including background asset path, terrain colors, overlay color/opacity, torch opacity, cloud opacity and ambient speed. The Pixi scene renders the background and overlay. `spriteBrightness`, `skyColor`, `lightColor` and `shadowColor` are defined but not applied in the Pixi scene, and `docs/03_product/UI_UX.md` still mentions a `data-time-of-day` map attribute that the current Pixi wrapper does not emit. |
| Ambient animations                     | Partial     | Clouds, smoke, torches, crowd hints, banners and grass animate inside Pixi `useTick`, and reduced motion disables those tick-driven changes. The definitions are data-driven in `src/game-data/map-visuals.ts`. The current implementation is simple and procedural: no sprite sheets, no per-element culling, and no lifecycle controls beyond the scene tick.                                                                                                                                    |
| Gladiator animations                   | Partial     | Map gladiators interpolate between prepared `from` and `to` points using game-time movement intent, cycle two-frame sprite assets by animation state, update depth by `y`, and respect reduced motion. Combat gladiators cycle idle/attack frames and lunge for the current attacker. Missing pieces include hit/defeat frame usage, richer state transitions, per-animation timing from `GLADIATOR_ANIMATION_DEFINITIONS.durationSeconds`, and sprite brightness/tint from time-of-day themes.    |
| Fallback to old SVG placeholder assets | Risky       | New manifest-driven assets live under `public/assets/pixel-art/`, but generated assets are still SVG scaffolding. `building-visuals.ts` falls back to `/assets/buildings/{buildingId}-level-{level}.svg`; `gladiator-visuals.ts` falls back to `/assets/portraits/*.svg` and `/assets/sprites/*.svg`. These fallbacks are useful for compatibility, but risky if accepted as final art or if missing manifest entries silently degrade to old placeholder visuals.                                 |
| React/Pixi boundaries                  | Partial     | React builds view-models, handles i18n, reads reduced-motion preferences, owns routing/shell UI and receives scene intent callbacks. Pixi receives serializable view-models and does not call stores or domain mutation helpers. This matches `docs/02_technical/RENDERER_STRATEGY.md`. The boundary is less clean around asset loading and camera state, which currently live in React effects inside scene components, and old DOM/CSS renderer classes remain in the stylesheet.                |

## Detailed Findings

### Active Renderers

The normal player map is mounted by `GameShell` through a lazy `PixiLudusMap`.
`PixiLudusMap` creates a `LudusMapSceneViewModel`, mounts `PixiSceneViewport`,
and passes only `viewModel` plus an `onLocationSelect` callback to
`LudusMapScene`.

The combat screen mounts `PixiCombatArenaStage` through `Suspense`.
`PixiCombatArenaStage` creates a `CombatSceneViewModel`, then renders
`CombatScene` inside the shared Pixi viewport.

This is aligned with the current renderer strategy: React owns application
orchestration and Pixi owns the live scene drawing.

### Application Host

`PixiApplicationHost` is a useful single owner for Pixi application defaults:

- `autoStart`;
- `autoDensity`;
- `antialias={false}`;
- `backgroundAlpha={0}`;
- `powerPreference="low-power"`;
- `preference="webgl"`;
- `resolution={1}`;
- `resizeTo={resizeTo}`;
- ticker `maxFPS` defaulting to `20`.

The test-mode DOM fallback is pragmatic for the current Vitest setup, but it
also means renderer behavior is not exercised by the existing test command.
Dedicated renderer smoke tests or browser-level checks remain absent.

### Map Scene

The map is functionally present and data-driven:

- map size, camera defaults, zoom limits, locations, paths and decorations come
  from `src/game-data/map-layout.ts`;
- building visual asset paths come from `src/game-data/building-visuals.ts`;
- external locations and background assets come from the visual manifest;
- ambient elements come from `src/game-data/map-visuals.ts`;
- time-of-day theme values come from `src/game-data/time-of-day.ts`;
- gladiator positions use `src/game-data/gladiator-map-movement.ts`;
- gladiator animation states come from `src/game-data/gladiator-animations.ts`.

Remaining gaps are mostly product polish and renderer ownership:

- Pixi does not render hover or selected states for map locations/gladiators;
- several decorations and path styles are procedural `Graphics` drawings rather
  than authored visual assets;
- old CSS map rules remain in `src/index.css`, including DOM classes that no
  longer describe the active Pixi renderer;
- the current map wrapper does not expose the `data-time-of-day` attribute
  described by `docs/03_product/UI_UX.md`.

### Combat Scene

The combat renderer is enough to replace a static placeholder, but it is still
closer to a first playable presentation than a final combat scene:

- background asset rendering exists;
- fallback arena graphics exist;
- two fighters render from generated combat frame paths;
- current attacker is represented by frame timing and lunge motion;
- health bars and labels are rendered in Pixi.

Missing or partial pieces:

- no hit, block, defeat or victory animation states;
- no turn timeline interpolation beyond "latest attacker lunges";
- no authored crowd/foreground layers separate from the background;
- no Pixi-side responsive camera for the fixed 960x480 coordinate system;
- old CSS combat-stage animation rules remain even though the active fighters
  are Pixi sprites.

### Asset Pipeline

The asset contract is manifest-driven and correctly centralized through
`src/game-data/visual-assets.ts`. That is the right shape for production.

However, the current files under `public/assets/pixel-art/` are SVG-generated
scaffolding. They are useful for renderer integration, deterministic paths and
layout iteration, but they should not be treated as final player-facing art.

The old placeholder hierarchy remains present:

- `public/assets/buildings/*.svg`;
- `public/assets/portraits/*.svg`;
- `public/assets/sprites/*.svg`;
- `public/assets/locations/*.svg`;
- `public/assets/backgrounds/main-menu-ludus.svg`.

The code can still fall back to the old building, portrait and sprite SVGs. This
compatibility path should remain clearly labeled as fallback-only until removed.

### Lifecycle And Cleanup

Scene-level listener cleanup is present for:

- window resize;
- canvas wheel;
- canvas pointerdown/pointermove/pointerup/pointercancel.

Async texture loading uses an `isMounted` guard before updating React state.

The main lifecycle risk is texture ownership. Neither map nor combat unloads
assets from `Assets`, destroys textures, or records which scene owns which
resource. With the current small SVG scaffold this is low-impact. With final
bitmap backgrounds and sprite sheets, this should become an explicit renderer
policy.

### Reduced Motion

Reduced motion is passed from React adapters into scene view-models:

- map `gameMinutesPerRealMillisecond` becomes `0`;
- ambient animations stop;
- combat frame cycling and lunge/idle lift stop.

This is aligned with the product target. The static state remains readable.

## Recommended Follow-Up Backlog

These are not required for this documentation-only PR:

1. Define a texture ownership policy for `Assets.load`, cache reuse and unload.
2. Add missing asset-load error handling and renderer diagnostics.
3. Decide whether old DOM/CSS map and combat renderer classes should be deleted
   or moved to an archive comment once no longer used.
4. Add Pixi hover/selected states for map hit zones.
5. Apply time-of-day sprite brightness/tint values or remove unused theme fields.
6. Replace generated SVG scaffolding with authored pixel-art assets or sprite
   sheets before calling the art final.
7. Add browser-level renderer smoke coverage for map mount, combat mount,
   nonblank canvas and primary interactions.
8. Reconcile `docs/03_product/UI_UX.md` with the Pixi implementation for
   `data-time-of-day` and CSS ambient animation language.
