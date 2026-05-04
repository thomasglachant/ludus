# ludus - Art Direction

This document is the durable source of truth for the player-facing visual direction of
`ludus`.

## Visual Vision

`ludus` should feel like a handcrafted Roman pixel-art management game where the
player manages a living gladiator school in the countryside.

The player should understand at first glance:

- the ludus is a physical place;
- buildings, paths, market and arena exist in the same world;
- weekly management happens through the city and planning surfaces;
- Sunday combat is a theatrical climax, not just a log table.

The tone is warm, readable and game-like: dark Roman HUDs, bronze and stone
frames, parchment panels, red banners, gold accents, countryside terrain,
visible building art, memorable gladiator portraits and theatrical arena sprites.

## Core Pillars

### Building-First World

The building overview is the player's main mental model. It should occupy most
of the normal game screen and remain visible behind focused modals when
possible.

Future features should answer where they live in the world:

- a building or external location should open the feature;
- the building overview should show relevant feedback;
- new systems should not become disconnected full-page tables in the
  player-facing experience.

### Roman Pixel-Art Material Language

The interface and assets should use:

- warm Roman countryside colors;
- dark bronze, charcoal and stone HUD frames;
- parchment surfaces for panels, modals and repeated cards;
- bronze, gold and ochre borders/highlights;
- red banners, laurels and Roman motifs where useful;
- readable pixel-art buildings, portraits, sprites and icons.

### Strategic Readability

The visuals should support management decisions. The player should quickly read:

- which buildings are owned, locked or upgraded;
- roster condition, planning risks and blocked macro actions;
- current time-of-day mood;
- alerts, condition risks and blocked actions;
- where the Market and Arena are located;
- which action is currently being asked of the player.

Pixel art should favor strong silhouettes and stable interaction targets over
ornamental detail.

Time-of-day mood is gameplay-readable rather than clock-driven: week state and
macro phase choose dawn, day, dusk or night through the domain time visuals.

### Pixel-Perfect Asset Rules

Player-facing pixel art must render crisply:

- authored pixel-art textures use nearest-neighbor sampling only;
- sprites and UI images should use rounded pixel positions where this does not
  hide meaningful motion;
- small prop, combatant and ambient sprites should keep integer display scales
  whenever their intended size is close to the native asset size;
- blur, interpolation, anisotropic filtering and mipmapped smoothing are not
  acceptable for pixel-art assets;

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

- subtle banner flutter, time-of-day ambience and arena crowd hints;
- small CSS transitions for interactive building and combat states;
- static equivalent states under `prefers-reduced-motion`.

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

## Main Buildings View

The building overview should depict the ludus as a small Roman school complex:

- Domus;
- Canteen;
- Dormitory;
- Training Ground;
- Pleasure Hall;
- Infirmary;
- Market and Arena as external destinations;
- readable alerts, staffing status and activity areas.

Buildings, destinations, time themes and asset paths belong in `src/game-data`
or adjacent visual data modules.

The current ludus target is a building-first React interface with visible
pixel-art buildings, readable alerts, staffing state and stable interaction
zones.

Required main scene behavior:

- the overview shows the ludus as a managed school, not a generic dashboard;
- building ownership, level, efficiency, staffing and alerts are visually
  readable;
- building cards keep a strong sense of place through assets and Roman material
  styling;
- `prefers-reduced-motion` disables non-essential animation while preserving
  readable state.

The visual target is a dense Roman building-first scene with a dark bronze HUD,
parchment panels, clear building silhouettes and theatrical arena presentation.
Final quality comes from the current production backgrounds and building assets.

## Visual Acceptance Checklist

Before accepting player-facing visual work, verify:

- [ ] no debug grid is visible in the normal player experience;
- [ ] final building art is not made mainly from SVG primitives;
- [ ] the buildings overview, combat screen and homepage preserve the intended composition,
      mood, materials, density and game feel.

## Time Of Day

The game supports four visual phases:

- dawn;
- day;
- dusk;
- night.

Each phase should define:

- background and lighting values;
- sprite brightness;
- readable building contrast.

Dawn and dusk should feel warm. Day should maximize readability. Night should be
darker while preserving readable building silhouettes and interaction targets.

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

- a portrait asset for gladiator lists, details, market and combat;
- stable visual identity metadata such as palette, body type, hair style and
  armor style.

When a save lacks explicit visual identity within the supported schema, the game
should derive one deterministically from the gladiator id rather than requiring a
field-level migration.

## Combat Presentation

Arena combat should feel like the weekly climax.

The combat presentation should include:

- a full arena background with crowd and sand;
- left and right combatant panels;
- central combatant portraits for the current React arena presentation;
- combat skills, condition, odds and core fighter attributes;
- visible fatigue/energy feedback during combat only;
- combat log progression;
- result, reward and consequence summary.

The first playable presentation can replay resolved combat turns one by one.
Future arena work may revisit dedicated animated combatants, but that is outside
the current implementation.
Combat formulas, rewards and consequences remain in domain modules.

## Asset Source Of Truth

Production pixel-art assets live under:

```text
public/assets/
```

The production asset manifest is committed in TypeScript form at:

```text
src/game-data/generated/asset-manifest.production.ts
```

Run `npm run generate:assets` after asset changes. CI and the pre-commit hook run
`npm run check:assets` to verify that the committed manifest matches the generated
output.

Typed access to manifests belongs in `src/game-data/visual-assets.ts` and
adjacent visual modules such as:

- `src/game-data/gladiator-visuals.ts`;
- `src/game-data/time-of-day.ts`.

Do not duplicate the full manifest in documentation. Document concepts and
boundaries here; keep asset paths in data.

## Production Asset Priorities

Final visual quality depends on authored pixel-art assets that enter through the
manifest and game-data boundaries.

Building asset priorities:

- create building sprites for Domus, Canteen, Dormitory, Training Ground,
  Pleasure Hall and Infirmary;
- create level variants for every building;
- define consistent anchor points, hit zones and label offsets;
- add optional activity stations for future visual feedback.

Combat asset priorities:

- create a complete arena background with crowd, sand, gates and lighting;
- keep combatant portraits readable at arena scale;
- keep deterministic visual identity resolution for saves that lack explicit
  identity metadata;
- defer any future animated combatant charter and timing guidelines to a
  dedicated arena rebuild.

Integration rules:

- asset paths belong in the visual manifests and `src/game-data`;
- React components must not hardcode individual asset paths;
- presentation work must not duplicate combat, simulation or building rules.

## Constraints

- Source code, comments, file names and technical docs stay in English.
- Visible UI text uses i18n keys and supports French and English.
- React components render state and dispatch actions; they do not own gameplay
  formulas.
- Game rules and balance stay in `src/domain` and `src/game-data`.
- Visual definitions, animation definitions and asset paths stay data-driven.
- Future UI must preserve the game-first, building-first direction.

## Still Open

The following remain product or production decisions:

- final hand-authored art pipeline beyond current generated fallback scaffolding;
- depth of building interiors and roof hiding;
- modular portrait/sprite generation versus curated variants;
- exact scope for future debug-only renderer inspection tools;
- future weather, season and crowd systems.
