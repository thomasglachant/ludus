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

All base buildings should be visible and available on the map from the start of a new game. Future optional buildings may use locked or unpurchased visual states when their data marks them that way.

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

For base buildings, the primary call to action should be upgrade or configure rather than purchase, because they start owned at level 1. Purchase actions should still exist for future optional buildings that start unpurchased.

Building details should not be permanently displayed below the map.

The Dormitory panel must clearly show:

- used beds / total capacity;
- purchased beds;
- maximum purchasable beds at the current Dormitory level;
- next bed cost;
- a purchase-bed action using the shared confirmation modal;
- a disabled state with a clear reason when the Dormitory is not owned, the maximum purchasable beds are reached or treasury is insufficient.

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

## 9. Shared UI Primitives

The player interface should reuse a small set of shared primitives instead of rebuilding the same panel, list and modal structures inside each feature.

Expected shared primitives:

- panel shells for contextual panels, including title, subtitle, close action and primary content layout;
- section cards for repeated panel sections;
- tabs for panel subviews such as overview, improvements, policies and assigned gladiators;
- empty states for unavailable content, empty rosters, empty event queues and future feature placeholders;
- notice boxes for warnings, recommendations, save errors and temporary informational states;
- effect lists for building effects, policies, improvements, contract consequences and event choices;
- cost summaries for purchases, upgrades, market buys and paid actions;
- badges or status pills for level, ownership, readiness, risk, availability and demo state;
- metric rows or stat lines for compact values such as health, energy, morale, satiety, beds and treasury;
- confirmation dialogs for irreversible, expensive or blocking choices;
- lightweight form modal layouts for focused interactions that do not need a full screen.

Contextual panels should compose these primitives instead of recoding their own headers, section wrappers, empty-state markup, repeated effect rows or confirmation UI. New primitives should stay small and practical; a feature-specific component is acceptable when the structure is genuinely unique.

## 10. Main Menu

The main menu should feel like a game menu, not a SaaS landing page.

It should use:

- full-screen illustrated or pixel-art-inspired background;
- Roman countryside, ludus or arena mood;
- stronger logo area;
- parchment, stone or bronze styled buttons;
- options and load game actions that open as modal overlays;
- demo mode indicator only when enabled.

The main menu should not be dominated by a plain white card or dashboard styling.
Language selection should not be visible directly on the main menu. The interface should use the browser language by default when no stored preference exists, and language changes should happen through Options.

## 11. Debug Dashboard

The previous long dashboard interface may be kept only as a debug tool.

It must be hidden from the normal player experience and available only through a development-only route such as `/dev/debug-dashboard` or a feature flag such as `VITE_ENABLE_DEBUG_UI=true`.

The debug dashboard is useful for inspecting state, testing mechanics and debugging systems. It is not the intended player experience.

## 12. Market

Market should follow the same shared UI primitive direction as contextual panels where practical.

The market must:

- show Dormitory capacity as used beds / total capacity;
- show available beds before the player buys a gladiator;
- block buy actions when no bed is available;
- display a clear shared empty or warning state when capacity is full;
- keep all buy validation in domain logic rather than React.

## 13. Supporting Flows

Supporting flows should follow the game-like visual direction instead of a SaaS dashboard style.

New game:

- ask for owner name;
- ask for ludus name;
- create a save with the current schema version;
- start with all base buildings purchased at level 1 and initial game time.

Load game modal:

- support local saves;
- reserve space for cloud saves behind the save abstraction;
- show demo saves only when demo mode is enabled.

Options modal:

- support French and English;
- use i18n for every visible label;
- reserve space for future audio, animation and confirmation settings.

## 14. Acceptance Criteria

The UI is valid when:

- the main screen no longer looks like a long vertical dashboard;
- the map is the main visual focus;
- buildings are visually represented;
- base buildings are visible and available from the start;
- gladiators have portraits;
- gladiators have map sprites;
- the bottom roster is portrait-based;
- panels open contextually;
- weekly planning is not permanently visible;
- market and arena appear as external locations;
- the debug dashboard is not the default game screen;
- repeated panel, modal, empty-state, effect-list, cost and tab structures use shared UI primitives;
- all visible text uses i18n;
- Playwright can still target stable `data-testid` values.
