# Renderer Asset Backlog

This backlog separates renderer migration from art production.

PixiJS solves the technical renderer path for living scenes. Final visual
quality still depends on authored pixel-art assets that enter through the
existing `src/game-data` and manifest boundaries.

## Map Assets

- replace weak generated SVG map placeholders with authored pixel-art tiles;
- normalize tile size and map scale;
- create terrain tile sets for countryside, paths, sand, stone and building
  foundations;
- create time-of-day background variants for dawn, day, dusk and night;
- create ambient sprite variants for flags/banners and crowd hints;
- create authored building and external-location detail inside the core scene
  assets instead of standalone map clutter.

## Building Assets

- create building sprites for Domus, Canteen, Dormitory, Training Ground,
  Pleasure Hall and Infirmary;
- create level variants for every building;
- define consistent anchor points, hit zones and label offsets;
- add optional activity stations for future visual feedback.

## Gladiator Sprites

- define a sprite charter for proportions, palette, shadow and outline;
- normalize directions and frame dimensions;
- create map spritesheets by class or visual identity;
- create frames for idle, walk, train, rest, eat, injured and healing states;
- keep deterministic visual identity resolution for saves that lack explicit
  identity metadata.

## Combat Assets

- create a complete arena background with crowd, sand, gates and lighting;
- create combat spritesheets for idle, attack, dodge, parry, impact, victory
  and defeat;
- create class or equipment variants that remain readable at combat scale;
- define animation timing and impact readability guidelines.

## Integration Rules

- asset paths belong in the visual manifest and `src/game-data`;
- React and Pixi components must not hardcode individual asset paths;
- renderer work must not duplicate combat, movement or building rules;
- any future fallback must be debug-only and use the same renderer view-models.
