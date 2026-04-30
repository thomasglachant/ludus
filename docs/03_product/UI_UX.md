# UI / UX

## 1. Interface Goal

The player interface must support the core management loop without exposing every system at once.

The main screen should present the ludus as the primary interaction space. The player should be able to observe gladiators, buildings, paths, routines and time-of-day changes without opening every system at once.

The interface should reveal information progressively. The normal player experience should not expose weekly planning details, events, market details, arena results, building configuration and debug data all at the same time.

All visible UI text must use i18n keys and support French and English. React components must not hardcode player-facing copy.

UI work should prioritize layout and interaction hierarchy before adding more gameplay features. A feature is not ready for the normal player interface if it requires permanently exposing every detail on the main screen.

Primary calls to action should use the shared green `CTAButton` / `.cta-button`
style by default. Use lower-emphasis action buttons only for secondary,
navigation or utility actions, unless a feature explicitly requires another
treatment.

Translucent cards and panels placed over scenic backgrounds should use the
shared `CardBlured` component. It provides the main-menu-inspired translucent
background and backdrop blur while allowing feature CSS to keep its own border,
size and padding.

Grouped numeric impacts should use the shared `ImpactList` component instead
of manually arranging several `ImpactIndicator` instances. `ImpactList` keeps
positive or neutral impacts before negative impacts while preserving the
original order inside each tone.

## 2. Main Game Shell

Target structure:

```tsx
<GameShell>
  <TopHud />
  <LudusMap />
  <LeftNavigationRail />
  <BottomGladiatorRoster />
  <ModalHost />
  <ToastAndAlertLayer />
</GameShell>
```

Elements:

- `TopHud`: day, week, year, day-night cycle gauge, speed controls, pause, treasury, save status, alerts and menu access.
- `LudusMap`: the main interactive visual map and primary screen focus.
- `LeftNavigationRail`: access to planning, market, arena and menu.
- `BottomGladiatorRoster`: portrait-based roster for owned gladiators.
- `ModalHost`: focused confirmations, menu/options flows and centered feature modals for building, gladiator, planning, market, events and arena.
- `ToastAndAlertLayer`: warnings, recommendations and notifications.

The shell should occupy the full viewport.

The main game screen prioritizes:

- a large living ludus map;
- focused feature modals;
- a portrait-based gladiator roster;
- visual building representation;
- time-of-day state and feedback.

## 3. Always Visible

Always visible during normal gameplay:

- top HUD;
- main ludus map;
- bottom gladiator roster;
- important alerts;
- access to planning, market, arena and menu.

The top HUD must expose save state without forcing the player into a modal:

- a manual save button for normal local saves;
- an unsaved-changes status when the active save is dirty;
- a saved status with the latest successful save time when available;
- an in-progress saving state while the save provider write is pending;
- save success and save failure feedback through the shared toast or notice layer.

Demo templates are exposed from the load flow. Loading one creates a normal local save that keeps a restart-from-template action visible while allowing the player to save and continue normally.

## 4. Hidden By Default

The following must not be permanently displayed on the main screen:

- weekly planning details;
- building configuration;
- full gladiator details;
- events;
- market details;
- arena results;
- debug data.

They should open through centered modals or dedicated full-screen presentations when a system needs a theatrical scene, such as combat.

Blocking flows may temporarily override the hidden-by-default rule. A pending daily event auto-opens a non-dismissible event modal. Sunday at 06:00 opens the dedicated arena route, and the player cannot return to the map until the combat presentations and final summary are complete.

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
- flags/banners;
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

Building positions, paths, flag/banner elements and visual definitions must be data-driven through `src/game-data` or adjacent game-data modules. React map components should render definitions and interaction state, not own gameplay formulas or hardcoded layout rules.

The map viewport must expose a stable `data-testid="map-container"` and a
`data-time-of-day` attribute for the active visual phase. Current supported
phases are `dawn`, `day`, `dusk` and `night`.

The normal player HUD should show time as a readable day-night cycle gauge, not
as an exact hour clock. Internal hour and minute values may remain part of the
domain model for ticks, building effects and synchronization rules.

Map visuals should render generated or authored assets through visual data
helpers:

- time-of-day background assets;
- building exterior/interior/roof/prop assets;
- external Market and Arena assets;
- ambient banner assets;
- gladiator sprite frame arrays.

Ambient map motion should be subtle and continuous. It should use renderer-side
transform/opacity animation and must respect `prefers-reduced-motion`.

## 6. Building Interaction

Buildings are clickable.

Clicking a building opens a centered modal with:

- overview;
- level;
- effects;
- improvements;
- current policy;
- assigned gladiators.

Building panels should use shared tabs:

- Overview: ownership, level, upgrade or purchase action, current level effects and building-specific summaries.
- Improvements: available improvements, cost, required level, required improvements, effects, purchased status and disabled purchase reasons.
- Policy: available policies, selection cost when present, required level, effects, selected status and disabled selection reasons.
- Gladiators: assigned gladiators with compact condition context.

For base buildings, the primary call to action should be upgrade or configure rather than purchase, because they start owned at level 1. Purchase actions should still exist for future optional buildings that start unpurchased.

Building details should not be permanently displayed below the map or in a separate side panel.

The Dormitory panel must clearly show:

- used places / total ludus capacity;
- available places;
- that capacity is governed by the Domus level rather than purchasable beds.

Suggested building panel tabs:

- Overview;
- Improvements;
- Policy;
- Gladiators.

Buildings should be represented by generated or authored visual assets. The removed building budget slider system must not return.

Improvement and policy rows should compose shared primitives such as `SectionCard`, `EffectList`, `CostSummary`, badges and shared action buttons. Expensive or blocking purchases should use the global confirmation modal. Disabled actions must show i18n-backed reasons rather than silently disabling controls.

Upgrade and purchase confirmations for buildings should use the shared modal
host with rich building action content when preview data is available. The
expected flow is:

- click a building on the map;
- inspect current level, effects, improvements, policies and assigned
  gladiators in the building modal;
- trigger purchase or upgrade from the panel;
- see a confirmation with building art, current-to-next level comparison,
  effect changes and resource cost;
- confirm the action and return to the same map-first context.

Simple confirmation modals remain acceptable for small focused actions such as
buying a Dormitory bed or selecting a paid policy.

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
- current objective or warning.

Clicking a gladiator should:

- select the gladiator;
- focus the map on the gladiator when possible;
- open the gladiator detail modal.

Gladiators should also have map sprites used by `LudusMap`. Demo saves must provide stable portrait and sprite references for visual testing.

## 8. Weekly Planning

Weekly planning should be a dedicated `XL` modal.

It should display:

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

- modal shells for centered feature modals, including title, close action, optional back action, scrollable body and optional footer actions;
- section cards for repeated panel sections;
- tabs for panel subviews such as overview, improvements, policies and assigned gladiators;
- empty states for unavailable content, empty rosters, empty event queues and future feature placeholders;
- notice boxes for warnings, recommendations, save errors and temporary informational states;
- effect lists for building effects, policies, improvements and event choices;
- cost summaries for purchases, upgrades, market buys and paid actions;
- badges or status pills for level, ownership, risk, availability and demo state;
- metric rows or stat lines for compact values such as health, energy, morale, satiety, capacity and treasury;
- confirmation dialogs for irreversible, expensive or blocking choices;
- lightweight form modal layouts for focused interactions that do not need a full screen.

Feature modals should compose these primitives instead of recoding their own headers, section wrappers, empty-state markup, repeated effect rows or confirmation UI. New primitives should stay small and practical; a feature-specific component is acceptable when the structure is genuinely unique.

## 9.1 Empty, Warning And Error States

Player screens and panels should expose clear, i18n-backed states for missing or blocked content:

- empty roster: the bottom roster shows that no gladiators have been recruited yet;
- empty market: the market shows that no candidates remain this week;
- full capacity: the market shows used places, available places and a warning before blocking recruitment;
- no owned gladiators: the market sell section shows an empty state;
- no events: the events panel shows that no event needs a decision right now;
- no combat or no eligible combatant: the arena panel shows why no Sunday combat is available;
- save failures: the HUD/toast layer shows the local save error while preserving dirty state;
- demo templates: loading one starts a normal local save, and the HUD keeps a restart-from-template action visible.

These states should use shared primitives such as `EmptyState`, `NoticeBox`, modal content shells, `SectionCard`, badges and modal infrastructure where practical. They should not be silent disabled controls.

## 10. Main Menu

The main menu is the entry point for starting, loading and configuring play.

It should provide:

- options and load game actions that open as modal overlays;
- demo mode indicator only when enabled.

Language selection should not be visible directly on the main menu. The interface should use the browser language by default when no stored preference exists, and language changes should happen through Options.

## 11. Market

Market should open as a centered `XL` modal and follow the same shared UI primitive direction as other feature modals where practical.

The market must:

- show ludus capacity as used places / total capacity;
- show available places before the player buys a gladiator;
- block buy actions when no place is available;
- display a clear shared empty or warning state when capacity is full;
- display a clear shared empty state when the candidate list is empty;
- display a clear shared empty state when there are no owned gladiators to sell;
- keep all buy validation in domain logic rather than React.

## 12. Arena

Arena should be available from the map. Before Sunday, it opens as a focused closed-state panel with the schedule. During Sunday arena day, it opens as a dedicated full-screen route.

The arena panel must show:

- the current combat with gladiator, opponent, rank and victory or defeat state;
- combat log progression using shared log-row or list primitives and i18n-backed log text;
- rewards and consequences for each resolved combat;
- a Sunday summary with total treasury gained, reputation change, health, energy and morale changes, wins and losses;
- a clear empty state when no gladiator is eligible or no arena day is active.

The player should be able to advance the visible combat log when progression is used, switch to resolved combats to inspect their logs, and finish or continue the weekly flow when the Sunday summary is complete. The arena panel and route should compose shared primitives such as modal content shells, `CardBlured`, `SectionCard`, `Badge`, `ImpactList`, `EmptyState` and reusable log rows rather than duplicating feature-specific chrome.

Before Sunday, the arena panel should not reveal opponents or combat odds. It should explain when the arena opens next.

When combat presentation is available, the arena panel should provide an entry
point into a dedicated full-screen or overlay combat view instead of forcing the
weekly climax into the side panel.

The combat presentation should:

- use the generated Arena combat background;
- show left and right combatant panels with portraits, health, energy, morale
  and active effects;
- render central fighter sprites with combat idle/attack frames;
- expose combat skills, condition, odds and core fighter attributes;
- progress the visible combat log one turn at a time for replay-based combat;
- show final reward, reputation and consequence summary from existing combat
  state;
- return cleanly to the arena/map context.

Combat UI may reveal turns from an already resolved `CombatState`. It must not
reimplement hit chance, damage, rewards or consequences in React.

## 13. Supporting Flows

Supporting flows should keep the player focused on the current decision.

New game:

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

- the map is the main visual focus;
- buildings are visually represented;
- base buildings are visible and available from the start;
- gladiators have portraits;
- gladiators have map sprites;
- the bottom roster is portrait-based;
- feature modals open contextually from the map, roster or navigation rail;
- weekly planning is not permanently visible;
- market and arena appear as external locations;
- repeated panel, modal, empty-state, effect-list, cost and tab structures use shared UI primitives;
- arena logs, rewards, consequences and Sunday summary are visible through i18n-backed UI;
- dedicated combat presentation can progress at least one visible turn when a
  resolved combat exists;
- map time-of-day and asset rendering can be smoke-tested through stable
  attributes and generated asset paths;
- all visible text uses i18n;
- Playwright can still target stable `data-testid` values.
