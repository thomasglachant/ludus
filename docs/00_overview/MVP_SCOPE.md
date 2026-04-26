# MVP Scope

## MVP Goal

The MVP should prove that the weekly preparation loop and Sunday arena loop are fun, readable and technically stable.

The MVP is not expected to implement every future system. It should deliver a playable loop with local persistence, bilingual UI, meaningful gladiator preparation, building progression and arena resolution.

## Included

### Technical Baseline

- Vite + React + TypeScript.
- ESLint, Prettier, Husky, lint-staged and commitlint.
- Vitest and React Testing Library.
- Playwright coverage for critical flows where useful.
- i18n infrastructure with French and English locale files.
- A local and CI quality gate covering build, lint, unit tests and critical Playwright smoke tests.

### Application Flow

- Main menu.
- New game flow.
- Load local save flow.
- Options modal with language selection.
- Main map-first ludus screen.
- Market access from the map-first shell and the market external location.
- Arena access from the map-first shell and the arena external location.
- Development-only debug dashboard access.

### Save System

- Local save using browser storage.
- Active browser session auto-persisted separately from the manual local save list.
- Browser refresh, tab close or accidental reload can resume the current active session from the dedicated play URL.
- The normal root URL remains the homepage/main menu even when an active session exists.
- Manual local save from the player HUD as an explicit snapshot.
- Clear unsaved-changes indicator when the active session has local changes that have not been written as a manual snapshot.
- Clear saved status with the last successful save time during a play session.
- Clear save success and failure feedback.
- Save schema version.
- Save creation.
- Save loading.
- Active-session restore on app startup when valid session data exists and the browser path is the dedicated play URL.
- Basic corrupted save handling.
- Cloud save provider abstraction with an initial mock implementation.
- Demo saves kept separate from normal local and cloud saves.
- Demo saves are read-only during the MVP and cannot be overwritten by the manual save action.

### Internationalization

- French and English are supported.
- No visible UI text is hardcoded directly in React components.
- Player-facing text uses i18n keys.

### Buildings

Initial MVP buildings:

- Domus;
- Canteen;
- Dormitory;
- Training Ground;
- Pleasure Hall;
- Infirmary.

Building rules:

- All base buildings start purchased at level 1.
- Future optional buildings may start locked or unpurchased and be bought later.
- Building levels are gated by Domus level.
- Buildings can have purchase costs, upgrade costs, improvements, policies and simple effects.
- Building purchase remains a domain/UI capability for future optional buildings, but it is not used by the current base building set because every MVP base building is owned from a new game.
- The removed building budget slider system is excluded.

### Dormitory Capacity

- Dormitory controls gladiator capacity.
- New saves start with the Dormitory purchased at level 1.
- Dormitory level 1 gives one free bed.
- Additional roster capacity comes from Domus upgrades.
- Buying a gladiator requires an available bed and is blocked when capacity is full.

### Gladiators

- Market generates 5 gladiators.
- Gladiators can be bought and sold.
- Owned gladiators are displayed.
- Gladiators have stats, gauges, wins, losses, traits, reputation and visual identity.
- Gladiators can receive weekly objectives.

### Weekly Planning

- Each gladiator can receive a weekly objective.
- Automatic assignment recommends relevant buildings or activities.
- Manual override is possible.
- Readiness score is displayed.
- Alerts identify the most important problems.

### Time

- Time advances through ticks.
- Speeds: pause, x1, x2, x4, x8 and x16.
- 1 in-game day equals 2 real minutes at x1.
- 8 weeks per in-game year.
- Sunday triggers arena combats.

### Building Effects

Simple MVP effects:

- Canteen increases satiety.
- Dormitory increases energy.
- Training Ground increases stats but consumes energy and can reduce morale through harsher choices.
- Pleasure Hall increases morale.
- Infirmary increases health.

### Arena

- Every eligible owned gladiator fights on Sunday.
- Opponent is generated dynamically.
- Combat is turn-based.
- Combat turns are logged.
- Sunday arena combat logs, rewards and consequences are visible in the player interface.
- Player can advance through or review combat logs without resolving the same consequences twice.
- Winner and loser are determined.
- Rewards are distributed.
- Health, energy, morale, wins, losses and reputation are updated.

### Map-First Player Interface

- The default ludus screen is a full-screen game shell.
- The map is the main visual element.
- Buildings are visually represented.
- Gladiators have portrait cards and map sprites.
- Weekly planning, contracts, events, market, arena preparation and building details open contextually.
- The old dashboard-style screen is allowed only as a debug interface.
- Empty states, warnings and save errors are visible through shared UI primitives where practical.

## Explicitly Excluded From MVP

- Real cloud save backend.
- Authentication.
- Staff system.
- Rival ludi.
- Severe injuries and death.
- Rich event chains.
- Advanced betting economy.
- Complex scouting/information warfare.
- Full animation set.
- Full asset production pipeline.
- Audio.
- Modular portrait or sprite generation.
- Advanced renderer migration to Canvas or PixiJS.

## Should-Have MVP Extensions

- Weekly contracts.
- Simple events.
- Simple scouting.
- Basic betting odds.
- Combat strategy selection.

## Known Limits

- Exact building upgrade costs and improvement costs may need balancing.
- Food, entertainment and treatment formulas are still simple.
- Combat formulas are functional but not final.
- Betting rules are intentionally light.
- Demo mode is developer-only and must remain disabled by default.
- Placeholder art may be used while preserving the map-first direction.
- Contracts and events are MVP-light systems: they can be accepted, displayed or resolved where available, but deeper chains and balancing remain Phase 2 work.

## Acceptance Criteria

The MVP is valid if:

- the app starts with `npm run dev`;
- linting and tests can run;
- the local quality gate passes with `npm run build`, `npm run lint`, `npm run test` and `npm run test:e2e`;
- a new game can be created;
- language can be changed;
- the ludus screen shows the day-night cycle, treasury, buildings and gladiators;
- local save can be created and loaded;
- refreshing the browser on the dedicated play URL resumes the current game state;
- opening the root URL shows the homepage/main menu instead of auto-resuming the active session;
- the ludus screen exposes manual snapshot save, unsaved-changes status and latest successful manual save time;
- attempting to save a demo save leaves the demo template untouched and explains that demo saves are read-only;
- a new game starts with all base buildings purchased at level 1;
- base buildings can be upgraded and configured through improvements or policies where their data provides them;
- building purchase remains valid for future optional buildings that start unpurchased, but no current MVP base building requires purchase;
- no building has a numeric budget slider;
- the market offers 5 gladiators;
- the player can buy a gladiator if a bed is available;
- market buying is blocked with a clear warning when ludus capacity is full;
- gladiators can receive weekly objectives;
- readiness score is visible;
- basic alerts are generated;
- time advances;
- building effects update gladiator gauges;
- Sunday combats trigger;
- combat logs can be viewed;
- combat rewards and consequences are visible;
- rewards are distributed;
- roster, market, contracts, events and arena states have clear empty states;
- the default player screen is map-first rather than dashboard-first;
- the debug dashboard is not reachable as the normal player experience when its feature flag is disabled;
- demo saves are deterministic, read-only and aligned with the base-building level 1 starting rule.
