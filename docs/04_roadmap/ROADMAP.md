# Roadmap

This roadmap describes product phases, not one-off setup tasks. It should evolve with the game as systems mature.

## Current Baseline

The project already has the core React + TypeScript application structure, local persistence, domain modules, game data modules, i18n, demo mode foundations, map-first UI direction and initial tests.

The save UX baseline is manual local save with clear store-owned UI state. The ludus HUD exposes manual save, dirty state, in-progress saving state, latest successful save time and save success or failure notices. New local saves and loaded saves start clean. Player-driven game-state changes mark the active save dirty, successful saves clear dirty state, and failed saves keep dirty state. Demo saves are predefined start templates exposed from the load flow; loading one creates a normal local save that can be played and saved like any other game while the template remains reusable.

The quality baseline is defined by a local and GitHub Actions CI gate covering `npm run build`, `npm run lint`, `npm run test` and `npm run test:e2e`. Playwright coverage is reserved for high-value player flows and stable demo states rather than exhaustive UI coverage, including the new-game-to-map-first-shell smoke flow.

The UI baseline includes shared primitives for contextual panels, section cards, tabs, empty states, notices, metric lists, effect lists, cost summaries, badges and global confirmation or lightweight form modals. Building and gladiator detail panels already use these primitives, and building panel display data is prepared through reusable view-model helpers.

Building management includes domain-validated level upgrades, improvement purchases and policy selection. Building panels expose Overview, Improvements, Policy and Gladiators tabs with costs, requirements, effects, purchased or selected status and disabled action reasons. Building effects are centralized through domain helpers, and only effects marked `perHour: true` are applied during hourly time advancement.

New saves start with all base buildings purchased at level 1: `domus`, `canteen`, `dormitory`, `trainingGround`, `pleasureHall` and `infirmary`. Building initialization is data-driven from `startsPurchased` and `startsAtLevel`, and the Domus level controls owned gladiator capacity up to a maximum of 6.

The market respects ludus capacity before buying gladiators. Buying a gladiator requires an available roster place, Domus upgrades increase capacity, and sale contract completion is tied to gladiator sale flow rather than market purchase flow.

The arena baseline resolves eligible Sunday combats once per week, protects rewards and consequences from repeated Sunday ticks, and exposes the Sunday results through the map-first arena panel. The panel shows the arena status, resolved combat list, selected combat details, turn log progression, victory or defeat badges, rewards, condition and reputation consequences, Sunday totals and empty states for days without eligible combatants. Before Sunday, the same panel still supports scouting odds when available.

The Phase 1 MVP playable loop is stable enough to serve as the baseline for Phase 2. New-game smoke coverage validates the map-first shell, owned level 1 base buildings, market recruitment with ludus capacity, manual save, local load and arena access. Demo coverage validates deterministic early, mid and advanced states, including an advanced Saturday evening path into Sunday arena resolution. A basic i18n audit guards against obvious hardcoded visible JSX strings in app and UI components.

The next work should move Phase 2 systems forward while preserving the architectural split between `src/game-data`, `src/domain`, `src/state`, `src/persistence` and `src/ui`.

## Phase 1: MVP Baseline Maintenance

Goal: keep the weekly preparation loop and Sunday arena loop stable while Phase 2 work begins.

Product outcomes:

- keep demo saves stable for early, mid and advanced Playwright coverage;
- keep visible player text i18n-backed;
- keep map-first UI, local save, building setup, market capacity, planning, time advancement, building effects and Sunday arena review working together;
- treat regressions in the MVP smoke path as release-blocking.

Acceptance:

- the app runs locally;
- the quality gate passes locally and in CI;
- visible UI text uses i18n keys;
- no building budget slider exists;
- normal gameplay opens the map-first shell;
- debug dashboard remains development-only.

Phase 1 should remain a baseline, not a source of new feature scope.

## Phase 2: Gameplay Improvements

Goal: make weekly decisions richer without adding repetitive micromanagement.

Focus areas:

- deeper weekly planning recommendations;
- clearer readiness explanations;
- stronger alert prioritization;
- deeper building policy and improvement balancing;
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
- tune Domus upgrade costs and capacity pacing;
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
- managing up to 6 gladiators is comfortable;
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
