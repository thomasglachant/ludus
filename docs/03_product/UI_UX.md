# UI / UX

## 1. Interface Goal

The player interface must feel like a game, not a web dashboard.

The main screen should present a living Roman countryside ludus in readable cozy pixel art. The player should be able to observe gladiators, buildings, paths, routines and time-of-day changes without opening every system at once.

The interface should reveal information progressively. The normal player experience should not expose weekly planning details, contracts, events, market details, arena preparation, building configuration and debug data all at the same time.

All visible UI text must use i18n keys and support French and English. React components must not hardcode player-facing copy.

The accepted map-first interface decision is documented in `docs/03_product/decisions/0001-player-ui-map-first.md`.

## 2. Main Game Shell

Target structure:

```tsx
<GameShell>
  <TopHud />
  <LudusMap />
  <LeftNavigationRail />
  <BottomGladiatorRoster />
  <ContextualPanelHost />
  <ModalHost />
  <ToastAndAlertLayer />
</GameShell>
```

Elements:

- `TopHud`: time, day, week, year, speed controls, pause, treasury, alerts and menu access.
- `LudusMap`: the main interactive visual map and primary screen focus.
- `LeftNavigationRail`: access to planning, contracts, market, arena and menu.
- `BottomGladiatorRoster`: portrait-based roster for owned gladiators.
- `ContextualPanelHost`: building, gladiator, planning, contract, market and arena panels.
- `ModalHost`: focused confirmations and important interactions.
- `ToastAndAlertLayer`: warnings, recommendations and notifications.

The shell should occupy the full viewport. It should avoid the visual language of a web admin dashboard.

## 3. Always Visible

Always visible during normal gameplay:

- top HUD;
- main ludus map;
- bottom gladiator roster;
- important alerts;
- access to planning, market, arena and menu.

## 4. Hidden By Default

The following must not be permanently displayed on the main screen:

- weekly planning details;
- building configuration;
- full gladiator details;
- contracts;
- events;
- market details;
- arena preparation;
- debug data.

They should open through contextual panels, modals or dedicated screens.

## 5. Main Map

The map should occupy most of the viewport.

It should display:

- Domus;
- Canteen;
- Dormitory;
- Training Ground;
- Pleasure Hall;
- Infirmary;
- Market as an external location;
- Arena as an external location;
- paths;
- decorations;
- gladiator sprites;
- time-of-day effects.

The map should support:

- pan;
- zoom;
- clickable buildings;
- clickable special locations;
- hover states;
- selected states.

Building positions, paths, decorations and visual definitions must be data-driven through `src/game-data` or adjacent game-data modules. React map components should render definitions and interaction state, not own gameplay formulas or hardcoded layout rules.

## 6. Building Interaction

Buildings are clickable.

Clicking a building opens a contextual panel with:

- overview;
- level;
- effects;
- improvements;
- current policy;
- assigned gladiators.

Building details should not be permanently displayed below the map.

Suggested building panel tabs:

- Overview;
- Improvements;
- Policy;
- Gladiators.

Buildings should be represented by visual assets or styled placeholder art, not plain boxes or text-only cards. The removed building budget slider system must not return.

## 7. Gladiator Roster

The bottom roster should use portrait-based cards.

Each card displays:

- portrait;
- name;
- rank or reputation;
- health;
- energy;
- morale;
- satiety;
- readiness score;
- current objective or warning.

Clicking a gladiator should:

- select the gladiator;
- focus the map on the gladiator when possible;
- open the gladiator detail panel.

Gladiators should also have map sprites used by `LudusMap`. Demo saves must provide stable portrait and sprite references for visual testing.

## 8. Weekly Planning

Weekly planning should be a dedicated panel.

It should display:

- readiness summary;
- at-risk gladiators;
- weekly objectives;
- recommendations;
- apply recommendations action;
- expandable details.

It should not be permanently visible on the main screen.

The player should manage priorities, risks and exceptions. Routine assignments should be recommended or automated where possible.

## 9. Main Menu

The main menu should feel like a game menu, not a SaaS landing page.

It should use:

- full-screen illustrated or pixel-art-inspired background;
- Roman countryside, ludus or arena mood;
- stronger logo area;
- parchment, stone or bronze styled buttons;
- clean language switch;
- demo mode indicator only when enabled.

The main menu should not be dominated by a plain white card or dashboard styling.

## 10. Debug Dashboard

The previous long dashboard interface may be kept only as a debug tool.

It must be hidden from the normal player experience and available only through a development-only route such as `/dev/debug-dashboard` or a feature flag such as `VITE_ENABLE_DEBUG_UI=true`.

The debug dashboard is useful for inspecting state, testing mechanics and debugging systems. It is not the intended player experience.

## 11. Supporting Screens

Supporting screens should follow the game-like visual direction instead of a SaaS dashboard style.

New game:

- ask for owner name;
- ask for ludus name;
- create a save with the current schema version;
- start with Domus level 1 and initial game time.

Load game:

- support local saves;
- reserve space for cloud saves behind the save abstraction;
- show demo saves only when demo mode is enabled.

Options:

- support French and English;
- use i18n for every visible label;
- reserve space for future audio, animation and confirmation settings.

## 12. Acceptance Criteria

The UI is valid when:

- the main screen no longer looks like a long vertical dashboard;
- the map is the main visual focus;
- buildings are visually represented;
- gladiators have portraits;
- gladiators have map sprites;
- the bottom roster is portrait-based;
- panels open contextually;
- weekly planning is not permanently visible;
- market and arena appear as external locations;
- the debug dashboard is not the default game screen;
- all visible text uses i18n;
- Playwright can still target stable `data-testid` values.
