# UI / UX

## Interface Goal

The player interface supports macro management without becoming a dashboard. The default experience remains a full-screen, map-first game shell.

The map is the primary interaction space. Panels and modals expose details only when requested.

All visible UI text must use i18n keys and support French and English.

## Main Game Shell

Target structure:

```tsx
<GameShell>
  <TopHud />
  <PixiLudusMap />
  <BottomNavigation />
  <ModalHost />
  <ToastAndAlertLayer />
</GameShell>
```

The shell uses a bottom navigation surface for primary panel access.

Bottom navigation entries:

- Buildings;
- Gladiators;
- Planning;
- Finances;
- Events.

## Top HUD

The HUD shows macro state:

- year;
- week;
- day;
- phase;
- clickable treasury;
- reputation;
- glory;
- happiness;
- security;
- menu access.

Treasury opens the finance panel directly.

Macro progression is handled through planning and resolve actions.

## Map

The map remains the center of the game shell.

It displays:

- current buildings;
- unpurchased building slots;
- external locations such as market and arena;
- roads, walls and scenic ambience;
- time-of-day visual theming.

The map time-of-day theme is derived from saved week state: Monday/report reads
as dawn, normal weekdays read as day, late-week/Sunday arena reads as dusk, and
blocking events or game over read as night.

Map interactions focus on locations, construction and management panels.

Building positions and visual styles are data-driven through `src/game-data/map-layout.ts`.

## Building Panels

Clicking a building opens the building modal.

Tabs:

- Overview;
- Staff;
- Skill Tree;
- Activities;
- Ledger;
- Improvements;
- Policy;
- Gladiators.

The panel shows ownership, level, efficiency, current effects, staff assignment, generated skill tree entries and relevant planning/ledger context.

## Finances

The finance panel is opened from the treasury resource or bottom navigation.

It shows:

- treasury;
- projected income, expenses and net result;
- recorded current-week net result;
- active loan count;
- recent ledger entries;
- available loans;
- active loan buyout actions.

## Planning

The weekly planning panel includes the shared daily allocation grid. The player edits daily point buckets for:

- gladiator time;
- labor;
- administration.

Current activity groups:

- gladiator time: training, meals, sleep, leisure and care;
- labor: production, security and maintenance;
- administration: contracts, events and maintenance.

The panel shows projected daily deltas and an aggregate weekly projection before the player resolves the next step.

The panel exposes a `Resolve next day` action that calls the weekly macro step.

## Gladiators

Gladiators are available through the `Gladiators` list panel and building context.

This keeps the main screen scalable as the school grows.

## Events

Events remain focused modal or panel interactions. Activity-gated events should only appear when their related activity has points allocated or when a global condition explicitly allows them.

## Visual Direction

The Roman pixel-art direction remains:

- dark bronze and stone HUDs;
- parchment-like panels;
- warm countryside map;
- visible buildings and construction slots;
- theatrical arena combat presentation.

Debug or dashboard-style UI must remain behind debug flags or dedicated debug routes.
