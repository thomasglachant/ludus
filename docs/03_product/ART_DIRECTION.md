# ludus — Art Direction Brief

## 1. Visual Vision

`ludus` should feel like a living Roman gladiator school built in the countryside.
The main game screen is not a static dashboard. It is a visual map of the player's ludus, almost like a small Roman village. The player should be able to watch gladiators walk between buildings, rest, eat, train, recover and prepare for the arena.
The art direction should be based on readable, warm, cozy pixel art with a top-down or slightly angled perspective. The target feeling is close to a handcrafted management game, not a realistic simulation.
Reference intention:

- cozy pixel-art management game;
- readable characters and buildings;
- warm countryside atmosphere;
- animated life inside the ludus;
- Roman antiquity visual identity;
- simple but expressive animations.
  Important note:
  The visual identity should be inspired by the readability and charm of cozy pixel-art games, but it must not directly copy any existing game's assets, shapes, palette or character style.

---

## 1.1 Current UI Problem

The current prototype UI is functionally useful but visually too austere.

It currently looks like:

- a web dashboard;
- a debug page;
- stacked white cards;
- a data inspection screen.

This is not the target player experience.

The target experience is:

- a living pixel-art Roman ludus;
- a warm and readable management game interface;
- a map-first layout;
- portrait-based gladiator identity;
- contextual panels instead of permanent information overload.

The previous long dashboard-style interface may remain only as a developer/debug interface. It must not be the default player UI.

---

## 2. Core Visual Pillars

The visual direction is based on five pillars.

### 2.1 Living Ludus

The ludus should feel alive.
Gladiators should not be represented only through cards or numbers. They should exist on the map as small animated characters.
They should:

- walk between buildings;
- follow visible paths;
- enter and exit buildings;
- perform simple contextual actions;
- idle when waiting;
- visibly follow their weekly routine.
  Examples:
- a gladiator assigned to the canteen walks to the canteen and sits at a table;
- a gladiator assigned to the dormitory walks to a bed and lies down;
- a gladiator assigned to training uses a dummy, wooden sword, weights or practice post;
- a gladiator assigned to the infirmary lies on a medical bed or receives treatment;
- a gladiator assigned to the pleasure hall sits, plays, listens to music or celebrates.
  The map should help the player understand what is happening without opening every menu.

---

### 2.2 Roman Countryside

The map should look like a ludus built in the Roman countryside.
Visual elements may include:

- dry grass;
- dirt paths;
- stone paths;
- olive trees;
- cypress trees;
- low stone walls;
- wooden fences;
- amphorae;
- carts;
- wells;
- torches;
- columns;
- training posts;
- banners;
- clay roofs;
- small gardens;
- storage areas;
- countryside hills in the background.
  The ludus should feel organized but not sterile. Decorations should make the terrain feel inhabited and avoid empty spaces between buildings.

---

### 2.3 Strategic Readability

The map should be beautiful, but it must remain readable.
The player should easily understand:

- which buildings are owned;
- which buildings are locked or not purchased;
- where each gladiator currently is;
- what each gladiator is doing;
- which buildings are active;
- which building can be clicked;
- where the market and arena are located;
- what time of day it is.
  Pixel art should serve gameplay clarity first.

---

### 2.4 Warm Progression

Buildings should visually evolve as they are upgraded.
Each building level should have a stronger visual presence.
Example progression:

- level 1: modest, simple, mostly wood and basic stone;
- level 2: larger footprint, more stone, better roof, more props;
- level 3: more decorated, columns, banners, torches, richer details;
- future levels: more prestige, statues, marble, mosaics, larger interiors.
  The player should feel that the ludus is growing visually, not only numerically.

---

### 2.5 Time Atmosphere

The visual mood of the map should change depending on the in-game time.
The game should support four named time-of-day phases:

- dawn;
- day;
- dusk;
- night.
  If asset production needs to be simplified, dawn and dusk may share a similar warm lighting theme, but they should still be distinct in game logic.
  At night and dusk, buildings may be illuminated by torches.
  Time-of-day should help the player quickly understand the current phase of the day without reading the clock.

---

## 3. Map Direction

## 3.1 Map Overview

The main ludus screen should be a large navigable map.
The player can:

- pan across the map;
- zoom in and out;
- click buildings;
- click gladiators;
- open building configuration modals;
- observe gladiator movement;
- see the market and arena as special distant locations.
  The ludus itself should be the central area.
  The market and arena should be visually separated from the main ludus, as external destinations. They should be accessible by moving the camera or clicking navigation shortcuts.
  The ludus should feel like a contained village, while the market and arena should feel like outside institutions.

---

## 3.2 Suggested Map Layout

The central ludus area should contain:

- Domus;
- Canteen;
- Dormitory;
- Training Ground;
- Pleasure Hall;
- Infirmary;
- paths between buildings;
- decorative elements;
- empty plots for non-purchased buildings.
  External locations:
- Market: outside the main ludus, possibly to the west or near a road;
- Arena: farther away, visually imposing, possibly to the east or north-east.
  The player should understand that the market and arena are not normal internal buildings.

---

## 3.3 Paths

Buildings should be connected by visible paths.
Gladiators should use these paths when moving between locations.
Path style:

- dirt road for early game;
- stone path after upgrades or future progression;
- small decorative borders;
- torches or posts near important buildings.
  Gladiators should not teleport visually when changing assignment unless the distance is too large or the current view does not include them.
  The path system can be simplified in the first version.
  MVP approach:
- define fixed path points between buildings;
- move sprites along simple straight or polyline paths;
- no advanced pathfinding required at first.
  Future approach:
- tile-based navigation;
- obstacle avoidance;
- dynamic pathfinding;
- crowd movement.

---

## 4. Camera and Zoom

## 4.1 Camera Controls

The player should be able to move around the map.
Recommended controls:

- mouse drag to pan;
- mouse wheel to zoom;
- optional keyboard movement;
- optional quick buttons for important places:
  - Ludus;
  - Market;
  - Arena.
    The camera should stay constrained to the map boundaries.

---

## 4.2 Zoom Levels

The game should support several visual zoom levels.

### Far Zoom

Purpose:

- overview of the whole ludus;
- strategic readability;
- buildings and paths are visible;
- gladiators may be simplified or hidden if too small.
  Display:
- building names or icons may be visible;
- current time, treasury and alerts remain visible in the UI;
- good for management overview.

### Medium Zoom

Purpose:

- default gameplay view;
- buildings are visible;
- gladiators are visible;
- movement and activity are readable.
  Display:
- building exteriors;
- moving gladiators;
- small activity indicators;
- clickable buildings.

### Close Zoom

Purpose:

- immersive view;
- show building interiors when possible;
- see gladiators performing actions.
  Display:
- roofs may fade out or disappear;
- interiors become visible;
- action stations are visible;
- characters can sit, sleep, train or interact with props.

---

## 4.3 Roof Visibility System

Buildings should be designed with separate visual layers:

- exterior base;
- roof layer;
- interior layer;
- prop layer;
- optional lighting layer.
  At medium or far zoom, the roof is visible.
  At close zoom, the roof can:
- disappear;
- fade out;
- become semi-transparent;
- disappear only for the selected building.
  MVP recommendation:
  Only hide the roof of the selected building when the player clicks it or zooms in close enough.
  Future version:
  Roofs automatically fade based on camera zoom and player focus.

---

## 5. Buildings

## 5.1 General Building Rules

Buildings should not be represented by simple rectangles or text-only blocks.

Each building should have:

- exterior sprite;
- optional interior sprite;
- optional roof layer;
- level-based visual variants;
- clickable area;
- hover state;
- selected state;
- empty plot version if not purchased;
- contextual props;
- action stations for gladiators.
  Buildings should visually communicate their function.
  The player should recognize a building even without reading its label.

---

## 5.2 Domus

The Domus is the symbolic heart of the ludus.
Visual identity:

- Roman villa;
- clay roof;
- columns;
- small courtyard;
- banners or decorative elements;
- prestige increases with level.
  Gameplay meaning:
- main building;
- owner residence;
- source of ludus reputation and progression;
- unlocks higher levels for other buildings.
  Interior ideas:
- office table;
- scrolls;
- accounting props;
- small shrine;
- owner area.
  Possible animations:
- servants or small ambient movement in future;
- administrative idle action.

---

## 5.3 Canteen

The Canteen is where gladiators eat.
Visual identity:

- open dining hall;
- cooking area;
- tables;
- benches;
- food storage;
- amphorae;
- smoke or small fire pit.
  Interior action stations:
- table seat;
- food counter;
- cooking pot;
- storage area.
  Gladiator animations:
- walking to table;
- sitting;
- eating;
- drinking;
- idle conversation.
  Strategic choices may include:
- simple meals;
- rich meals;
- protein-focused meals;
- morale meals;
- economical rations.
  There is no building budget slider. Food-related choices should be explicit upgrades, policies or weekly strategic choices.

---

## 5.4 Dormitory

The Dormitory is where gladiators sleep and recover energy.
Visual identity:

- simple sleeping quarters;
- beds;
- blankets;
- storage chests;
- dim light;
- calm atmosphere.
  Interior action stations:
- bed;
- chest;
- resting bench.
  Gladiator animations:
- lying down;
- sleeping;
- sitting on bed;
- waking up;
- idle resting.
  Progression:
- more beds become visible as the player buys them;
- upgraded beds can look more comfortable;
- higher levels may include better structure, cleaner floors and warmer lighting.
  Important gameplay rule:
  The number of purchased beds limits the maximum number of owned gladiators.

---

## 5.5 Training Ground

The Training Ground is the most active internal building.
Visual identity:

- open sand or dirt area;
- wooden dummies;
- weapon racks;
- shields;
- weights;
- obstacle props;
- practice posts.
  Action stations:
- dummy;
- weapon rack;
- weights;
- sparring area;
- agility course;
- shield wall.
  Gladiator animations:
- striking dummy;
- lifting weights;
- practicing with sword;
- shield block;
- dodging;
- stretching;
- sparring idle loop.
  Training should be visually satisfying, because it is one of the most important weekly activities.
  Strategic choices may include:
- strength training;
- agility training;
- defense training;
- balanced training;
- intensive training;
- light training;
- secret training;
- public demonstration.
  There is no building budget slider. Training depth should come from doctrines, upgrades, weekly objectives and intensity choices.

---

## 5.6 Pleasure Hall

The Pleasure Hall restores morale.
Visual identity:

- warm lights;
- music;
- board games;
- benches;
- curtains;
- performers;
- decorative Roman leisure atmosphere.
  Action stations:
- board game table;
- music area;
- resting bench;
- social table;
- celebration spot.
  Gladiator animations:
- sitting;
- clapping;
- playing board games;
- drinking;
- listening to music;
- cheering.
  Strategic choices may include:
- quiet evening;
- games;
- songs;
- celebration;
- morale feast;
- post-defeat consolation.
  There is no building budget slider. Entertainment should be handled through explicit activities, upgrades and weekly choices.

---

## 5.7 Infirmary

The Infirmary restores health and handles injuries.
Visual identity:

- medical room;
- treatment beds;
- herbs;
- tools;
- water basin;
- calm but serious atmosphere.
  Action stations:
- medical bed;
- herb table;
- treatment area;
- resting chair.
  Gladiator animations:
- lying on bed;
- being treated;
- sitting injured;
- slow walking;
- bandaged idle state.
  Strategic choices may include:
- light treatment;
- expensive treatment;
- preventive care;
- emergency recovery;
- protect injured gladiator.
  There is no building budget slider. Medical quality should come from upgrades, staff, treatments and strategic choices.

---

## 5.8 Market

The Market is an external location, not part of the main ludus village.
Visual identity:

- road-side market;
- tents;
- traders;
- chained or waiting gladiator candidates;
- banners;
- carts;
- crowds.
  The Market should feel more public and chaotic than the ludus.
  Interaction:
- clicking the market opens the market screen or modal;
- the player can buy available gladiators;
- the player can sell owned gladiators;
- market candidates should have portraits and stats.
  The market should be visible on the map but slightly separated from the private ludus.

---

## 5.9 Arena

The Arena is a special external location.
Visual identity:

- larger, more imposing structure;
- stone walls;
- arches;
- banners;
- crowd noise implied visually;
- torches for evening events;
- sand-colored entrance.
  The Arena should feel like the weekly climax.
  Interaction:
- clicking the arena opens the arena preparation screen or Sunday combat screen;
- during weekdays, it may show upcoming fights, contracts, scouting or betting information;
- on Sunday, it becomes the main combat location.
  The arena should be visually separated from the ludus to communicate that gladiators leave the school to fight.

---

## 6. Gladiator Visual Design

## 6.1 Two Representations per Gladiator

Each gladiator should have two visual representations.

### Portrait

Used for:

- combat screen;
- gladiator details;
- market;
- dialogue/events;
- weekly reports;
- victory/defeat summary.
  Portrait style:
- larger pixel-art portrait;
- expressive face;
- visible age, hair, skin tone, scars, armor or tunic;
- should make gladiators feel memorable.

### Map Sprite

Used for:

- walking on the ludus map;
- performing building actions;
- moving between buildings;
- idle animations.
  Map sprite style:
- small but readable;
- same identity as portrait when possible;
- recognizable colors and silhouette;
- supports basic animations.

---

## 6.2 Gladiator Variation System

The game should support visual variety between gladiators.
Variation dimensions:

- skin tone;
- hair style;
- hair color;
- beard style;
- body type;
- tunic color;
- armor details;
- scars;
- bandages;
- age signs;
- rank or reputation marker;
- weapon style in portraits or combat scenes.
  MVP approach:
  Use a limited set of pre-made variations.
  Future approach:
  Use modular layered sprites and portraits.

Suggested visual identity model:

```ts
export interface GladiatorVisualIdentity {
  portraitAssetId: string;
  spriteAssetId: string;
  paletteId?: string;
  bodyType?: string;
  hairStyle?: string;
  armorStyle?: string;
}
```

Example modular layers:

- base body;
- head;
- hair;
- beard;
- tunic;
- armor;
- scars;
- accessories;
- injury overlay.

---

## 6.3 Gladiator Animation Set

The first version should use a small number of generic animations that work across most gladiators.
Recommended MVP animations:

- idle;
- walk;
- sit;
- sleep;
- eat;
- train;
- rest injured;
- cheer;
- combat idle.
  Future animations:
- lift weights;
- strike dummy;
- block shield;
- dodge;
- play board game;
- receive treatment;
- celebrate victory;
- limp when injured;
- nervous before combat.
  Animations should be short loops.
  The goal is not to animate every action uniquely at first. The goal is to make the ludus feel alive with reusable animations.

---

## 7. Interior Action Stations

## 7.1 Concept

Buildings should contain action stations.
An action station is a predefined spot where a gladiator can perform an animation.
Examples:

- canteen table seat;
- dormitory bed;
- training dummy;
- infirmary medical bed;
- pleasure hall game table.
  A gladiator assigned to a building can walk to an available station and perform the matching animation.

---

## 7.2 Station Data

Action stations should be defined as data, not hardcoded directly in React components.

Example TypeScript model:

```ts
export type BuildingActionType = 'eat' | 'sleep' | 'train' | 'heal' | 'relax' | 'idle';
export interface BuildingActionStation {
  id: string;
  buildingId: BuildingId;
  actionType: BuildingActionType;
  x: number;
  y: number;
  capacity: number;
  requiredBuildingLevel?: number;
}
```

Each building visual definition can include stations.

Example:

```ts
export interface BuildingVisualDefinition {
  buildingId: BuildingId;
  level: number;
  exteriorAssetPath: string;
  roofAssetPath?: string;
  interiorAssetPath?: string;
  width: number;
  height: number;
  stations: BuildingActionStation[];
}
```

---

### 7.3 MVP Rule

For the MVP, each building only needs a few stations.

Suggested MVP station count:

- Canteen: 2 table seats;
- Dormitory: 1 to 3 beds depending on purchased beds;
- Training Ground: 2 training stations;
- Infirmary: 1 treatment bed;
- Pleasure Hall: 2 relaxation spots.

If there are more gladiators than stations, the extra gladiators may use idle standing animations inside or near the building.

⸻

## 8. Time-of-Day Themes

### 8.1 Time Phases

The visual map should support these phases:

```ts
export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';
```

Suggested mapping:

- dawn: 05:00 to 08:00;
- day: 08:00 to 18:00;
- dusk: 18:00 to 21:00;
- night: 21:00 to 05:00.

These values should be configurable in game data.

⸻

### 8.2 Visual Treatment

Dawn

Mood:

- soft warm light;
- low contrast;
- calm start of the day;
- slight orange or pink tone.

Usage:

- beginning of activity;
- gladiators wake up;
- planning atmosphere.

Day

Mood:

- clear lighting;
- highest readability;
- neutral colors;
- main management phase.

Usage:

- default gameplay view;
- training, eating, market activity.

Dusk

Mood:

- orange warm lighting;
- longer shadows;
- preparation for night;
- torches start to appear.

Usage:

- end-of-day feeling;
- tension before Sunday;
- evening activities.

Night

Mood:

- darker overlay;
- blue/purple tone;
- torch lights;
- quiet atmosphere.

Usage:

- rest phase;
- dormitory activity;
- illuminated buildings;
- reduced outside activity.

⸻

### 8.3 Lighting

At dusk and night, buildings can use additional lighting.

Examples:

- torches near building entrances;
- warm window light;
- fire pits;
- small glow around the Domus;
- market lanterns;
- arena torches.

MVP approach:

Use a global overlay and simple torch sprites.

Future approach:

Use layered light masks or shader-like effects if the renderer supports it.

⸻

## 9. User Interface Integration

### 9.1 Main Screen

The main screen should combine:

- map view;
- top status bar;
- bottom gladiator list;
- alerts;
- building interaction;
- camera movement.

The map is the main visual area.

The UI should not hide the map too much.

⸻

### 9.2 Top Bar

The top bar should display:

- day of week;
- week;
- year;
- time;
- speed controls;
- pause;
- treasury;
- market button;
- arena button;
- menu button.

The top bar should remain readable at all times.

⸻

### 9.3 Bottom Gladiator List

The bottom area should display owned gladiators.

Each card should show:

- portrait or small face icon;
- name;
- arena rank or reputation;
- health;
- energy;
- morale;
- satiety;
- readiness score;
- current objective;
- current location.

The card should allow quick selection.

Clicking a gladiator should:

- focus the camera on the gladiator if visible;
- open the gladiator detail panel or modal;
- show current routine and status.

⸻

### 9.4 Building Interaction

Buildings are clickable.

When the player clicks a building, a modal opens.

The modal should allow:

- viewing the building name and level;
- viewing current effects;
- buying the building if not purchased;
- upgrading the building;
- viewing improvement purchases;
- selecting building-specific policies;
- seeing assigned gladiators;
- seeing action stations if relevant.

The modal should not replace the whole game view unless necessary. The map should remain visible behind it.

⸻

### 9.5 Building Hover State

On hover, a building should show a small tooltip or highlight.

Tooltip examples:

Canteen — Level 1
2 gladiators eating
Click to configure
Dormitory — Level 2
Beds: 3 / 5
Click to configure
Training Ground — Not purchased
Cost: 250 🪙
Click to inspect

⸻

## 10. Strategic Gameplay Integration

### 10.1 No Building Budget Sliders

The previous building budget system has been removed.

Buildings should not use a generic budget value from 1 to 10.

Instead, buildings should become interesting through:

- level upgrades;
- improvement purchases;
- strategic policies;
- weekly choices;
- staff upgrades in future;
- action stations;
- building-specific mechanics.

This avoids turning the game into a spreadsheet and supports more meaningful choices.

⸻

### 10.2 Building Improvements

Each building may have purchasable improvements.

Examples:

Canteen

- better ovens;
- larger tables;
- protein storage;
- improved kitchen;
- better water supply.

Dormitory

- extra beds;
- better mattresses;
- cleaner sleeping area;
- guarded quarters;
- personal chests.

Training Ground

- better dummies;
- weapon racks;
- shield wall;
- agility obstacles;
- advanced training area.

Pleasure Hall

- board game tables;
- musicians;
- better seating;
- celebration area;
- decorated hall.

Infirmary

- additional treatment bed;
- herb storage;
- better tools;
- recovery room;
- emergency care table.

These improvements should have clear gameplay effects and visible map/interior effects when possible.

⸻

### 10.3 Weekly Policies

Buildings may support weekly policies.

Examples:

Canteen Policies

- economical meals;
- balanced meals;
- rich meals;
- protein-focused meals.

Training Policies

- balanced doctrine;
- strength doctrine;
- agility doctrine;
- defense doctrine;
- intensive training;
- light training.

Dormitory Policies

- normal rest;
- strict schedule;
- extended rest;
- recovery priority.

Pleasure Hall Policies

- quiet evening;
- games;
- songs;
- celebration.

Infirmary Policies

- standard care;
- preventive care;
- urgent treatment;
- protect injured gladiators.

Policies should be explicit decisions, not hidden numeric multipliers.

⸻

## 11. Visual Feedback for Gameplay State

The map should visually reflect gameplay state.

Examples:

Gladiator State

- tired gladiator walks slower or uses tired idle animation;
- injured gladiator may have bandage overlay;
- happy gladiator may cheer or move energetically;
- hungry gladiator may prioritize canteen;
- champion may have a special visual marker.

Building State

- active building shows movement or props in use;
- unpurchased building appears as an empty plot;
- upgraded building looks larger or richer;
- building with alert shows small warning icon;
- building used at night may show torches.

Weekly Tension

As Sunday approaches, subtle visual cues may increase:

- arena icon becomes more prominent;
- gladiator readiness alerts become more visible;
- Saturday may show preparation prompts;
- Sunday transitions to arena-focused presentation.

⸻

## 12. Asset Organization

Recommended asset structure:

```text
public/
└── assets/
    ├── pixel-art/
    │   ├── map/
    │   │   ├── tiles/
    │   │   ├── decorations/
    │   │   ├── paths/
    │   │   └── lighting/
    │   ├── buildings/
    │   │   ├── domus/
    │   │   ├── canteen/
    │   │   ├── dormitory/
    │   │   ├── training-ground/
    │   │   ├── pleasure-hall/
    │   │   ├── infirmary/
    │   │   ├── market/
    │   │   └── arena/
    │   ├── characters/
    │   │   ├── gladiators/
    │   │   │   ├── portraits/
    │   │   │   └── sprites/
    │   │   └── npc/
    │   ├── ui/
    │   ├── icons/
    │   └── effects/
    └── audio/
```

Building assets should support level variants.

Example:

```text
public/assets/pixel-art/buildings/canteen/
├── level-1/
│   ├── exterior.png
│   ├── roof.png
│   ├── interior.png
│   └── props.png
├── level-2/
│   ├── exterior.png
│   ├── roof.png
│   ├── interior.png
│   └── props.png
└── level-3/
    ├── exterior.png
    ├── roof.png
    ├── interior.png
    └── props.png
```

Gladiator sprite assets should support animations.

Example:

```text
public/assets/pixel-art/characters/gladiators/sprites/
├── base-01/
│   ├── idle.png
│   ├── walk.png
│   ├── sit.png
│   ├── sleep.png
│   ├── eat.png
│   ├── train.png
│   └── injured.png
```

⸻

## 13. Data-Driven Visual Definitions

Visual map data should be centralized and configurable.

React components should not hardcode building positions, paths or asset paths directly.

Suggested folder:

```text
src/game-data/map.ts
src/game-data/building-visuals.ts
src/game-data/time-of-day.ts
```

Example:

```ts
export interface MapPoint {
  x: number;
  y: number;
}
export interface MapLocationDefinition {
  id: string;
  type: 'building' | 'specialLocation' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}
export interface BuildingMapDefinition extends MapLocationDefinition {
  type: 'building';
  buildingId: BuildingId;
}
export interface SpecialLocationMapDefinition extends MapLocationDefinition {
  type: 'specialLocation';
  specialLocationId: 'market' | 'arena';
}
```

Path data:

```ts
export interface MapPathDefinition {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  points: MapPoint[];
}
```

Time-of-day data:

```ts
export interface TimeOfDayVisualTheme {
  phase: TimeOfDayPhase;
  startsAtHour: number;
  overlayOpacity: number;
  assetSuffix?: string;
  enableTorches: boolean;
}
```

⸻

## 14. Rendering Approach

### 14.1 MVP Rendering

For the first playable version, the map can be rendered with React using positioned elements.

Recommended MVP approach:

- a large relative-positioned map container;
- buildings as absolutely positioned elements;
- gladiators as absolutely positioned sprites;
- CSS transforms for pan and zoom;
- CSS transitions for simple movement;
- contextual panels and modals for interactions.

This is enough to validate gameplay and visual direction.

⸻

### 14.2 Future Rendering

If the map becomes more complex, the renderer may later move to:

- Canvas;
- PixiJS;
- a custom 2D renderer.

The architecture should avoid coupling domain logic to the renderer.

The game state should describe what happens.

The renderer should only display it.

⸻

## 15. MVP Visual Scope

The first version should not attempt to build the complete visual dream immediately.

MVP visual goals:

1. Main map container with pan and zoom.
2. Static Roman countryside background.
3. Domus visible at start.
4. Empty plots for other buildings.
5. Purchased buildings appear on the map.
6. Clickable buildings open modals.
7. Market and arena visible as distant external locations.
8. A few decorative props.
9. Basic gladiator map sprites.
10. Gladiators can visually move between buildings.
11. At least one generic idle animation.
12. At least one generic walking animation.
13. Time-of-day overlay for dawn, day, dusk and night.
14. Torches visible at dusk/night.
15. Basic portraits for gladiators.

Interior roof hiding can be added after the first map version is stable.

⸻

## 16. Post-MVP Visual Scope

After the first version, add:

1. Roof fade/hide system.
2. Building interiors.
3. Action stations.
4. Eating, sleeping, training, healing and relaxing animations.
5. More gladiator portrait variations.
6. Visual injuries.
7. Building level visual upgrades.
8. Better path movement.
9. More decorations.
10. Arena crowd atmosphere.
11. Market ambient characters.
12. Weather variants.
13. Seasonal or yearly visual changes.

⸻

## 17. UI Style

The UI should feel consistent with the Roman pixel-art world.

Suggested UI direction:

- parchment-like panels;
- stone or bronze borders;
- simple readable pixel-style icons;
- warm neutral colors;
- clear typography;
- minimal visual clutter.

UI should remain modern enough to be usable.

Avoid making the UI too decorative if it harms readability.

⸻

## 18. Player Experience Goals

The player should feel:

- “My ludus is alive.”
- “My gladiators have routines.”
- “I can see my decisions play out.”
- “The week is visually active, not just menus.”
- “The ludus grows over time.”
- “Sunday feels like a major event.”
- “The arena and market are connected to my ludus but feel external.”
- “The map is pleasant to watch even when I am not clicking constantly.”

⸻

## 19. Important Constraints

- Do not hardcode gameplay rules inside visual components.
- Do not hardcode building positions directly in React components.
- Do not hardcode visible UI text.
- Use the i18n system for player-facing text.
- Keep source code, comments and technical documentation in English.
- Visible UI must support French and English.
- Keep gameplay rules centralized in `src/domain` and `src/game-data`.
- Keep art-related data centralized where possible.
- Keep the first implementation simple and extensible.
- Do not reintroduce the removed building budget slider system.
- Prefer explicit upgrades, policies and choices over abstract budget values.
- The visual map should support gameplay, not replace it.

⸻

## 20. Open Decisions

The following decisions remain open:

- exact pixel tile size;
- exact camera zoom limits;
- exact map dimensions;
- exact number of building levels with unique visual variants;
- whether the first renderer is DOM-based, Canvas-based or PixiJS-based;
- whether portraits are hand-authored or generated from modular layers;
- whether gladiator sprites are modular or pre-made variants;
- exact asset production workflow;
- exact animation frame counts;
- exact lighting implementation.

Recommended temporary decisions for MVP:

- use DOM/CSS rendering first;
- use static placeholder pixel-art assets;
- use 3 zoom levels;
- use 4 time-of-day phases;
- use simple path movement;
- use one generic gladiator sprite sheet;
- use placeholder portraits;
- add modular visual variety later.

---
