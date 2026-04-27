# ludus - Art Direction

This document is the durable source of truth for the player-facing visual direction of
`ludus`.

The visual migration archive in `docs/visual-migration/` explains how the current
direction was reached, but future product work should use this document and
`docs/03_product/UI_UX.md` as the primary references.

## Visual Vision

`ludus` should feel like a handcrafted Roman pixel-art management game where the
player manages a living gladiator school in the countryside.

The default experience must not look like a SaaS dashboard, a debug panel, or a
stack of generic web cards. The player should understand at first glance:

- the ludus is a physical place;
- buildings, paths, gladiators, market and arena exist in the same world;
- weekly preparation happens on the map;
- Sunday combat is a theatrical climax, not just a log table.

The tone is warm, readable and game-like: dark Roman HUDs, bronze and stone
frames, parchment panels, red banners, gold accents, countryside terrain,
visible building art, memorable gladiator portraits and animated sprites.

## Core Pillars

### Map-First World

The map is the player's main mental model. It should occupy most of the normal
game screen and remain visible behind focused modals when possible.

Future features should answer where they live in the world:

- a building or external location should open the feature;
- the map should show relevant feedback;
- new systems should not become disconnected full-page tables unless they are
  explicitly debug-only.

### Roman Pixel-Art Material Language

The interface and assets should use:

- warm Roman countryside colors;
- dark bronze, charcoal and stone HUD frames;
- parchment surfaces for panels, modals and repeated cards;
- bronze, gold and ochre borders/highlights;
- red banners, laurels, shields and Roman motifs where useful;
- readable pixel-art buildings, portraits, sprites and icons.

Avoid:

- plain white dashboard cards;
- generic SaaS buttons and shadows;
- large full-page forms in the normal player UI;
- decorative complexity that harms readability.

### Strategic Readability

The visuals should support management decisions. The player should quickly read:

- which buildings are owned, locked or upgraded;
- where gladiators are and what they are doing;
- current time-of-day mood;
- alerts, readiness risks and blocked actions;
- where the Market and Arena are located;
- which action is currently being asked of the player.

Pixel art should favor strong silhouettes and stable interaction targets over
ornamental detail.

### Pixel-Perfect Scene Rules

Player-facing Pixi scenes must render pixel art crisply:

- authored pixel-art textures use nearest-neighbor sampling only;
- sprites, particles and debug hit shapes should use rounded pixel positions
  where this does not hide meaningful motion;
- small character, prop and ambient sprites should keep integer display scales
  whenever their intended size is close to the native asset size;
- camera zoom should step through readable presets rather than arbitrary smooth
  scale values;
- blur, interpolation, anisotropic filtering and mipmapped smoothing are not
  acceptable for pixel-art assets;
- debug overlays may expose native size, scale, anchor and hitbox, but only in
  debug UI mode.

### Warm Progression

Buildings should visibly improve as they level up. Level progression may add:

- larger or richer structures;
- stone, columns, banners, roof detail and props;
- more light, status and activity;
- visible action stations or interior detail over time.

Progression must remain data-driven. React components should render visual
definitions and gameplay state, not hardcode building upgrade art.

### Living Motion

The ludus should feel active even when the player is not clicking constantly.

Required motion language:

- subtle clouds, grass, banners, smoke, torch flicker and arena crowd hints;
- two-frame or short-loop gladiator map animations;
- two-frame or short-loop combat idle/attack motion;
- real gladiator movement between buildings and activity locations;
- idle animations and walking animations for visible characters;
- depth sorting based on vertical scene position;
- PixiJS animation loops for living map and combat scenes;
- static equivalent states under `prefers-reduced-motion`.

React must not run per-frame ambient animation state.

## Main Menu

The main menu is a full-screen game menu, not a landing page.

It should show:

- a large illustrated or generated pixel-art ludus scene;
- a strong `LUDUS` brand area;
- left-side primary actions for New Game, Load and Options;
- a visible demo indicator only when demo mode is enabled;
- a last-save presentation when local save metadata exists;
- parchment/bronze buttons and Roman frame details.

Load and Options open as modal overlays. Language selection belongs in Options,
not as a permanent main-menu switcher.

## Main Map

The map should depict the ludus as a small Roman school complex:

- Domus;
- Canteen;
- Dormitory;
- Training Ground;
- Pleasure Hall;
- Infirmary;
- Market as an external location;
- Arena as an external location;
- paths, walls, fences, trees, torches, banners and props;
- gladiator map sprites with activity animation states.

Map layout, buildings, paths, decorations, hit areas, external locations, time
themes and asset paths belong in `src/game-data` or adjacent visual data
modules.

The map target is a living PixiJS-rendered scene: a rich 2D or isometric
pixel-art ludus with visible buildings, readable terrain, moving gladiators,
ambient effects and stable interaction zones.

Required map scene behavior:

- gladiators move through the map instead of teleporting between static slots;
- idle, walking, training, resting, eating and injured states are visually
  distinct where assets exist;
- movement is simple and readable: the simulation decides where a gladiator is
  going, while the renderer interpolates how the sprite gets there;
- scene layers use depth sorting so lower objects and characters appear in
  front of higher ones;
- torches, smoke, banners, shadows, crowd hints and time-of-day ambience make
  the ludus feel inhabited;
- `prefers-reduced-motion` disables non-essential animation while preserving
  readable state.

PixiJS is the preferred renderer for player-facing game scenes, including the
living map and combat presentation, while React keeps the surrounding HUD,
panels, modals and routing. The previous DOM/CSS map renderer is no longer part
of the normal player experience.

The visual target matches the provided pixel-art references: a dense Roman
map-first scene with a dark bronze HUD, parchment panels, visible characters,
clear building silhouettes and theatrical arena presentation. Generated SVG
scaffolding is placeholder-only and must not be accepted as final
player-facing art. Final quality comes from authored pixel-art spritesheets,
backgrounds and building assets.

## Visual Acceptance Checklist

Before accepting player-facing visual work, verify:

- [ ] no flat vector placeholder background is used as a final background;
- [ ] no debug grid is visible in the normal player experience;
- [ ] no geometric placeholder gladiators are visible in the normal player
      experience;
- [ ] final building art is not made mainly from SVG primitives;
- [ ] the map, combat screen and homepage resemble the reference images in
      composition, mood, materials, density and game feel, without copying them
      pixel-for-pixel.

## Time Of Day

The game supports four visual phases:

- dawn;
- day;
- dusk;
- night.

Each phase should define:

- map background asset;
- terrain, sky, overlay and lighting values;
- torch visibility;
- cloud opacity;
- sprite brightness;
- ambient animation speed.

Dawn and dusk should feel warm. Day should maximize readability. Night should be
darker with torch and window-light emphasis.

## Building Visuals

Every gameplay building should have visual definitions for its relevant levels.
Definitions can include:

- exterior asset;
- roof asset;
- interior asset;
- props asset;
- dimensions;
- label and hit-area offsets;
- ambient slots;
- future action stations.

Buildings must not be represented as plain text-only rectangles in the normal
player UI.

The removed 1-to-10 building budget system must not return. Building depth
comes from upgrades, improvements, policies, staffing and explicit choices.

## Gladiator Identity

Gladiators should be memorable people, not rows of stats.

Each gladiator should resolve to:

- a portrait asset for roster, details, market and combat;
- map sprite frames for routine animation states;
- combat sprite frames for arena presentation;
- stable visual identity metadata such as palette, body type, hair style and
  armor style.

When a save lacks explicit visual identity, the game should derive one
deterministically from the gladiator id rather than requiring a save migration.

## Modal And Panel Style

Focused choices and detailed feature views use the shared centered modal infrastructure.

The target modal style is:

- dimmed map behind the modal;
- dark title strip;
- parchment body;
- bronze/stone frame;
- building or feature artwork when useful;
- optional back button for nested modal flows;
- clear current/next comparison;
- effect rows with old and new values;
- resource cost bar;
- strong primary and secondary actions.

New feature modals should reuse `AppModal`, `ModalHost` and shared UI primitives
before introducing custom chrome. The normal player UI should not add new local
modal backdrops, feature-specific title bars or side-panel chrome for gameplay
systems.

## Combat Presentation

Arena combat should feel like the weekly climax.

The combat presentation should include:

- a full arena background with crowd and sand;
- left and right combatant panels;
- central fighter sprites with health bars;
- selected strategy or skill area;
- visible fatigue/energy feedback;
- combat log progression;
- result, reward and consequence summary.

The first playable presentation can replay resolved combat turns one by one.
Combat formulas, rewards and consequences remain in domain modules.

## Asset Source Of Truth

Generated pixel-art baseline assets live under:

```text
public/assets/pixel-art/
```

The generated manifest is:

```text
public/assets/pixel-art/asset-manifest.visual-migration.json
```

The TypeScript import mirror is:

```text
src/game-data/generated/asset-manifest.visual-migration.json
```

Typed access to the manifest belongs in `src/game-data/visual-assets.ts` and
adjacent visual modules such as:

- `src/game-data/building-visuals.ts`;
- `src/game-data/gladiator-visuals.ts`;
- `src/game-data/gladiator-animations.ts`;
- `src/game-data/map-visuals.ts`;
- `src/game-data/time-of-day.ts`.

Do not duplicate the full manifest in documentation. Document concepts and
boundaries here; keep asset paths in data.

## Constraints

- Source code, comments, file names and technical docs stay in English.
- Visible UI text uses i18n keys and supports French and English.
- React components render state and dispatch actions; they do not own gameplay
  formulas.
- Game rules and balance stay in `src/domain` and `src/game-data`.
- Map layout, visual definitions, animation definitions and asset paths stay
  data-driven.
- The debug dashboard can exist only behind debug routing or flags.
- Future UI must preserve the game-first, map-first direction.

## Still Open

The following remain product or production decisions, not migration blockers:

- exact long-term renderer if DOM/CSS becomes insufficient;
- final hand-authored art pipeline beyond generated SVG scaffolding;
- exact tile size and final map dimensions;
- depth of building interiors and roof hiding;
- modular portrait/sprite generation versus curated variants;
- future weather, season and crowd systems.
