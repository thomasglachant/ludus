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
- Staff;
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
- happiness;
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

Building detail modals use the shared modal framework described below. They show a hero card with avatar, name, description, level and short configurable metrics before any tab content.

Building modal tabs are ordered as:

- Overview;
- Configuration, only when the building has policies or specialized activities;
- Upgrades, only when the building has improvements or a skill tree;
- Staff, only when the building uses assigned staff;
- Finances.

The Staff tab only lists staff currently assigned to that building. It must not show the full staff roster. Staff assignment and recruitment live in dedicated staff or market surfaces.

The panel shows ownership, level, efficiency, current effects, staff assignment, generated skill tree entries and relevant planning/ledger context.

## Modal Framework

`AppModal` remains the outer accessibility shell for focus, backdrop, title, close and back behavior. Modal content should use the internal framework components from `src/ui/modals/ModalContentFrame.tsx` for consistent item details.

Shared modal content components:

- `ModalContentFrame` wraps the modal body content and provides the common spacing rhythm.
- `ModalHeroCard` renders the item identity block with avatar, eyebrow, title, description, optional level and a configurable metric strip.
- `ModalTabs` renders tab navigation with optional count badges, including values such as assigned staff over maximum staff.
- `ModalTabPanel` wraps the active tab content.
- `ModalSection` groups related content inside a tab with a consistent heading style.
- `ModalActionDock` centers primary CTAs at the bottom of a modal tab.

Visual containment rules:

- Avoid the “card inside card” effect. If `AppModal`, `ModalHeroCard`, `ModalTabPanel`, `SectionCard`, `EntityList`, or a feature panel already provides containment, children should usually use spacing, headings, separators, or subtle background tint instead of another bordered box.
- Do not wrap `EntityList` in `SectionCard` only to add a title. Prefer a direct list with the surrounding tab or modal title providing context. Add a `ModalSection` heading only when the page contains multiple distinct groups that would otherwise be ambiguous.
- `SectionCard` should be reserved for meaningful grouping or comparative blocks, not as a default wrapper around every list, metrics group, notice, chart or CTA.
- When nesting is unavoidable, only one layer should carry a visible border. Inner elements should use whitespace, a left accent strip, text hierarchy, or light background tint.
- Prefer fewer borders and flatter panels over stacked parchment boxes. The Roman visual style should come from typography, color, icons and purposeful hero surfaces, not from repeated frames.

Default entity detail template:

- Hero card first, with avatar on the left and name, description, level and key metrics on the right.
- Tabs second, using the same order for the same type of entity across the app.
- Tab content third, using direct lists, `ModalSection`, shared metrics, impact indicators or charts as needed. Use shared cards only when they add meaningful grouping.
- Primary CTA last, centered in `ModalActionDock` and using `CTAButton` or `.cta-button` by default.

Building detail template:

- Overview contains advanced characteristics, current effects, capacity details when relevant and the build or upgrade CTA.
- Configuration contains policies and specialized activities; hide the tab when neither exists.
- Upgrades contains purchased and available improvements plus the building skill tree; hide the tab when no upgrade data exists.
- Staff shows the assigned count in the tab label, warns when the building is understaffed and lists only assigned staff; clicking assigned staff opens the staff detail modal.
- Finances shows building-specific gains, costs and recent ledger entries.

Personnel and gladiator detail template:

- Use the same hero card structure with portrait, name, short description and key stats.
- Use tabs for overview, assignment or planning, progression and finances only when those sections exist.
- Use `GladiatorAttributes` from `src/ui/gladiators/GladiatorAttributes.tsx` whenever a gladiator row or gladiator hero needs the standard compact attributes. The order is reputation, life, strength, agility and defense.
- Use `GladiatorListRow` from `src/ui/gladiators/GladiatorListRow.tsx` for gladiator lists, including market and owned roster rows. Customize it through props for price, primary action and clickability instead of rebuilding row markup.
- Use `IconValueStat` from `src/ui/components/IconValueStat.tsx` for compact aptitude, reputation, life and cost values. Do not create feature-local stat chip components or manually pair `GameIcon` with a numeric value for these facts.
- Do not create isolated bespoke stat cards when `ModalHeroCard`, `MetricList`, `ImpactIndicator`, `ImpactList` or chart primitives can represent the data. Avoid wrapping these primitives in extra cards unless the grouping changes the meaning.

List modal template:

- Use the modal framework for the overall body rhythm, then render reusable rows directly.
- Rows should be scannable, clickable when they open a detail modal and explicit when they perform an action.
- List modals should open entity detail modals through the modal stack when the player is drilling down from a parent modal.

Modal implementation rules:

- Visible player copy must use i18n keys in French and English.
- Components should receive already-computed view models or store actions; game rules stay in `src/domain` and tunable data in `src/game-data`.
- Hide tabs that do not apply to the selected entity instead of showing empty professional-dashboard placeholders.
- Prefer icon-backed metrics, impact components and compact ledger/chart visuals over grids of identical cards.
- Keep primary CTAs visually consistent and centered at the bottom of the active modal flow.

Modal navigation rules:

- `openModal` starts a new modal root and replaces the current stack.
- `pushModal` drills down or opens an overlay above the current modal while keeping every lower modal mounted.
- `replaceModal` replaces only the active modal when the player should not be able to return to the previous modal state.
- `closeModal` always closes only the active modal; if another modal is below it, that modal reappears with its React state preserved.
- `closeAllModals` is reserved for leaving the modal context entirely, such as changing route, quitting to menu or entering the arena route.
- Do not show a modal back button for normal drilldowns. The close button is the navigation control back to the previous stacked modal.
- Confirm, form and blocking event overlays should be pushed over the current modal so partially edited lower forms, tabs, filters and scroll-related React state are not lost.

## List Framework

Entity and action lists should use `EntityList` and `EntityListRow` from `src/ui/components/EntityList.tsx`. This primitive is global UI, not modal-specific.

Default list row structure:

- optional avatar on the left;
- flexible identity area with title and optional subtitle;
- right-side information panel with icon-backed values;
- right-side action panel with one or more buttons.

List rules:

- Lists take the full available width.
- Rows and row columns are separated by simple dividers, with enough padding to stay readable.
- Use `EntityList` empty states instead of bespoke empty paragraphs for entity lists.
- If a row opens a detail view, pass `onOpen` and make the whole row clickable; action buttons must remain separate and must not trigger row navigation.
- Use primary `EntityListActionItem` actions for CTAs and secondary actions for destructive or less common operations.
- Prefer `EntityListInfoItem` icon/value metrics for compact facts such as level, reputation, wage, cost, efficiency or profitability. `EntityListRow` renders these through `IconValueStat`; keep new list facts on that path instead of custom row markup.
- Use the shared `CTAButton` for primary CTAs. When a CTA has a monetary amount, pass `amountMoney` so the button renders the standardized `label (amount treasuryIcon)` pattern.

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

The weekly planning panel includes the shared daily allocation grid. The player edits daily gladiator time points.

Current visible task options are unlocked from owned buildings and building skills. Starting options focus on training and production tasks.

The panel shows projected daily deltas and an aggregate weekly projection before the player resolves the next step.

The panel exposes a `Resolve next day` action that calls the weekly macro step.

## Gladiators

Gladiators are available through the `Gladiators` list panel and building context.

This keeps the main screen scalable as the school grows.

## Staff

Staff is available through the `Staff` list panel, staff detail modals and market recruitment tabs.

This keeps assignment review separate from recruitment while preserving the map-first shell.

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
