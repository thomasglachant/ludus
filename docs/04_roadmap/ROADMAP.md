# Roadmap

This roadmap describes product phases, not one-off setup tasks. It should evolve with the game as systems mature.

## Current Baseline

The project already has the core React + TypeScript application structure, local persistence, domain modules, game data modules, i18n, demo mode foundations, map-first UI direction and initial tests.

The quality baseline is defined by a local and GitHub Actions CI gate covering `npm run build`, `npm run lint`, `npm run test` and `npm run test:e2e`. Playwright coverage is reserved for high-value player flows and stable demo states rather than exhaustive UI coverage, including the new-game-to-map-first-shell smoke flow.

The UI baseline includes shared primitives for contextual panels, section cards, tabs, empty states, notices, metric lists, effect lists, cost summaries, badges and global confirmation or lightweight form modals. Building and gladiator detail panels already use these primitives, and building panel display data is prepared through reusable view-model helpers.

New saves start with all base buildings purchased at level 1: `domus`, `canteen`, `dormitory`, `trainingGround`, `pleasureHall` and `infirmary`. Building initialization is data-driven from `startsPurchased` and `startsAtLevel`, the dormitory provides its level 1 free bed, additional beds can be purchased with treasury up to the current level cap, and purchase validation remains available for future optional buildings that start unpurchased.

The market respects Dormitory capacity before buying gladiators. Buying a gladiator requires an available bed, buying a Dormitory bed increases capacity, and sale contract completion is tied to gladiator sale flow rather than market purchase flow.

The next work should keep improving the playable loop while preserving the architectural split between `src/game-data`, `src/domain`, `src/state`, `src/persistence` and `src/ui`.

## Phase 1: MVP

Goal: prove the weekly preparation loop and Sunday arena loop.

Product outcomes:

- player can create and load a local save;
- player can change language between French and English;
- player sees a map-first ludus screen by default;
- player can upgrade and configure base buildings;
- future optional buildings can use the existing purchase flow when they start unpurchased;
- player can expand dormitory capacity and buy gladiators from the market when bed capacity allows;
- each gladiator can receive a weekly objective and training intensity;
- recommendations, manual overrides and readiness warnings make 8+ gladiators manageable;
- time advances through the week at supported speeds;
- building effects update gladiator gauges;
- Sunday triggers turn-based arena combats;
- combat logs, rewards and consequences are visible;
- demo saves support stable testing of early, mid and advanced states.
- new panels and focused dialogs reuse shared primitives, modal infrastructure and view-model helpers where the structure is shared.

Acceptance:

- the app runs locally;
- the quality gate passes locally and in CI;
- visible UI text uses i18n keys;
- no building budget slider exists;
- normal gameplay opens the map-first shell;
- debug dashboard remains development-only.

## Phase 2: Gameplay Improvements

Goal: make weekly decisions richer without adding repetitive micromanagement.

Focus areas:

- deeper weekly planning recommendations;
- clearer readiness explanations;
- stronger alert prioritization;
- more meaningful building policies;
- better improvement effects;
- contract acceptance and resolution;
- simple daily events with meaningful choices;
- combat strategy selection;
- early scouting and betting odds.

Important constraints:

- keep routine assignment automated by default;
- keep manual overrides available;
- keep formulas in domain modules and game data;
- avoid turning building management into spreadsheet-like budget sliders.

## Phase 3: Content

Goal: expand variety while keeping systems understandable.

Potential additions:

- more gladiator traits;
- more names and visual identities;
- more market candidates;
- more weekly contracts;
- more daily events;
- additional building improvements;
- additional policies;
- richer combat log text;
- more arena ranks or rank-specific flavor;
- more map decorations and visual states;
- more demo scenarios when needed for test coverage.

Content should use i18n keys and remain data-driven wherever possible.

## Phase 4: Advanced Systems

Goal: add strategic depth after the MVP loop is stable.

Candidate systems:

- advanced betting;
- opponent scouting depth;
- public perception manipulation;
- severe injury rules;
- gladiator death rules;
- staff or employee system;
- rival ludi;
- richer event chains;
- cloud save backend;
- authentication;
- optional "save demo as local copy" behavior;
- more advanced map movement or pathfinding.

Each advanced system should be introduced only when it reinforces the core weekly loop.

## Phase 5: Polish and Balancing

Goal: make the game readable, comfortable and emotionally sticky.

Focus areas:

- tune building upgrade costs and future optional purchase costs;
- tune Dormitory bed costs and capacity caps;
- tune readiness weights;
- tune market prices and sale values;
- tune combat hit chance, damage and consequences;
- tune betting odds and house edge;
- improve empty states and error states;
- improve accessibility and readability;
- improve performance on large rosters;
- improve Playwright visual confidence for map states;
- refine pixel-art placeholder assets into stronger final assets;
- add audio if it supports the atmosphere without hurting usability.

Acceptance:

- the weekly loop is understandable;
- managing 8 gladiators is comfortable;
- the player has meaningful decisions before Sunday;
- Sunday feels like a clear climax;
- the ludus feels alive on the map.

## Open Product Decisions

- Exact long-term building level count.
- Exact final building upgrade costs and future optional building purchase costs.
- Exact improvement costs.
- Exact food and entertainment formulas after removing budgets.
- Final combat probability formulas.
- Final betting rules.
- Exact contract reward formulas.
- Exact event frequency after MVP.
- Exact cloud save backend.
- Exact authentication system.
- Gladiator death and severe injury rules.
- Employee/staff system.
- Final asset production workflow.
- Whether the long-term map renderer remains DOM/CSS or moves to Canvas/PixiJS.
