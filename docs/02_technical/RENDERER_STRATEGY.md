# Renderer Strategy

`ludus` keeps React as the application shell and uses PixiJS as a focused scene
renderer. The player-facing map and combat presentation now mount through PixiJS;
React still owns the HUD, menus, panels, modals, i18n and app orchestration.

## Goals

- keep React, Vite and TypeScript for the app structure;
- keep the HUD, panels, modals, routing, i18n and app state in React;
- use PixiJS for living real-time scenes that benefit from a renderer;
- preserve existing domain, game-data and state boundaries;
- avoid duplicating business rules in rendering code.

## Responsibilities

### React

React owns:

- app providers;
- routing and route guards;
- HUD and navigation chrome;
- panels and modal flows;
- i18n and visible UI copy;
- mounting and unmounting Pixi scenes;
- passing prepared props and callbacks to scenes.

### PixiJS

PixiJS owns visual rendering for:

- the ludus map;
- sprites and sprite animations;
- ambient effects;
- scene hit zones;
- depth sorting;
- combat scene presentation.

PixiJS may interpolate visual state for smooth movement, but it does not decide
game state.

### Domain And State

`src/domain` and `src/state` remain the source of truth:

- domain modules decide legal actions, outcomes and calculations;
- state coordinates saves, domain services and UI actions;
- game-data provides renderer data such as map layout, asset ids, animation
  definitions and visual parameters.

## Scene ViewModels

Every Pixi scene receives a serializable view-model. Scenes must not receive the
complete store, store hooks, mutable save objects or domain service instances.

Allowed scene inputs:

- ids;
- numbers;
- strings;
- booleans;
- arrays and records of serializable values;
- asset paths resolved through game-data;
- callbacks for user intent.

Disallowed scene inputs:

- direct store access;
- domain decision functions;
- business rule helpers;
- save mutation functions;
- non-serializable application objects.

This keeps scenes testable, replaceable and limited to rendering.

## Map Movement

Gladiator movement is represented as game state, not as Pixi business logic.
When domain/state assigns a gladiator to a new building, the gladiator may carry
a `mapMovement` intent:

- `currentLocation`;
- `targetLocation`;
- `activity`;
- `movementStartedAt`;
- `movementDuration`.

The domain decides the target location. Game-data defines map points, activity
destinations and movement speed. Pixi interpolates between the prepared points
for presentation only.

When a save has no movement intent, the scene renders the gladiator at the
current assigned building. This keeps existing saves compatible and allows the
Pixi map to remain a visual layer.

## Map Ambience

Ambient map elements are renderer data. Definitions live in `src/game-data`
alongside map visuals and time-of-day themes. The Pixi scene receives prepared
ambient view-model entries with asset paths, opacity, animation duration and
layering.

Ambient animation runs inside Pixi tick callbacks. React must not update state
per frame for banners, crowd hints or future ambient variants.

`prefers-reduced-motion` is read by the React adapter and passed as a boolean to
the scene view-model. When reduced motion is active, non-essential ambient
animation and sprite frame cycling stop while the scene keeps static visual
state.

## Migration Path

1. Add documentation and dependencies.
2. Create shared Pixi host and scene viewport infrastructure.
3. Mount an empty dev scene behind debug routes.
4. Add a Pixi map with the same interaction callbacks as the previous map.
5. Move visual movement and ambience into Pixi without moving domain decisions.
6. Move combat presentation into Pixi while keeping combat resolution in domain.
7. Retire the previous DOM map and combat renderers.

## Renderer Availability

The player map and combat presentation are no longer controlled by a Pixi feature
flag. PixiJS is the scene renderer for both. React remains the app shell and owns
all surrounding UI.

Any future fallback or diagnostic scene should be debug-only and must not
duplicate business rules. It should consume the same serializable scene
view-models as Pixi, or be limited to development inspection.
