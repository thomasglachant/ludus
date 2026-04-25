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

### Application Flow

- Main menu.
- New game flow.
- Load local save flow.
- Options modal with language selection.
- Main map-first ludus screen.
- Market access.
- Arena access.
- Development-only debug dashboard access.

### Save System

- Local save using browser storage.
- Save schema version.
- Save creation.
- Save loading.
- Basic corrupted save handling.
- Cloud save provider abstraction with an initial mock implementation.
- Demo saves kept separate from normal local and cloud saves.

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

- Domus starts purchased at level 1.
- Other buildings must be purchased.
- Building levels are gated by Domus level.
- Buildings can have purchase costs, upgrade costs, improvements, policies and simple effects.
- The removed building budget slider system is excluded.

### Dormitory Capacity

- Dormitory controls gladiator capacity.
- Level 1 gives one free bed.
- Additional beds can be purchased.
- Buying a gladiator requires an available bed.

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
- 1 in-game hour equals 30 real seconds at x1.
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
- Player can advance through the combat log.
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

## Acceptance Criteria

The MVP is valid if:

- the app starts with `npm run dev`;
- linting and tests can run;
- a new game can be created;
- language can be changed;
- the ludus screen shows time, treasury, buildings and gladiators;
- local save can be created and loaded;
- Domus starts at level 1;
- other buildings can be purchased;
- buildings can be upgraded;
- no building has a numeric budget slider;
- the market offers 5 gladiators;
- the player can buy a gladiator if a bed is available;
- gladiators can receive weekly objectives;
- readiness score is visible;
- basic alerts are generated;
- time advances;
- building effects update gladiator gauges;
- Sunday combats trigger;
- combat logs can be viewed;
- rewards are distributed;
- the default player screen is map-first rather than dashboard-first.
