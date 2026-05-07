# UI / UX

## Interface Goal

The player interface supports macro management without becoming a dashboard. The default experience is a full-screen, building-first game shell.

Buildings are the primary interaction space. Panels and modals expose details only when requested.

All visible UI text must use i18n keys and support French and English.

Reusable UI primitives are the default implementation path. Before creating a
feature-local component, check whether an existing shared component, modal
framework primitive, list row, metric component, CTA, card or layout wrapper can
express the interaction.

One-off components are allowed only when the implementation has an explicit
component contract: why existing primitives do not fit, what props and state the
component owns, whether it is expected to become reusable later, and which
shared styles or primitives it still relies on.

## UI Component Hierarchy

The UI structure keeps ownership explicit: shared components live in shared
folders, and feature-specific screens, panels, surfaces and CSS live in the
feature that owns them.
Dependency direction is one-way: `src/ui/features` composes
`src/ui/shared/ludus`, which composes `src/ui/shared/primitives`.

- `src/ui/shared/primitives` contains the lowest-level accessible primitives,
  plus any adapters around Radix UI or React Aria APIs. These components have no
  game vocabulary, store access, domain rules or
  feature-specific i18n keys.
- `src/ui/shared/ludus` contains reusable Ludus components that express the
  Roman American comic / BD-inspired visual language. They compose primitives
  into buttons, panels, tabs, badges and modal bodies. They may know generic game
  concepts such as resources, but they do not compute gameplay or read stores.
- `src/ui/app-shell` contains global application layout and modal
  infrastructure.
- `src/ui/features` contains route screens, shell regions, surfaces, panels,
  feature-local components and view models. Feature code binds store state,
  selectors and actions, then composes shared Ludus components into the player
  experience.

Reuse rule: use the highest shared component that fits before creating anything
new. Feature code should first reach for `src/ui/shared/ludus`; Ludus components
should first reach for `src/ui/shared/primitives`. Feature-local UI is allowed
only after a short contract explains the gap, owned props/state, reuse
expectation and shared building blocks.

## Ludus Component Contracts

The migration uses short, stable contracts for Ludus-themed components:

- `Button`: neutral command primitive for standard text actions. It owns shared
  variants, sizing, disabled/loading states and optional icons, but no
  game-specific affordances such as money.
- `PrimaryActionButton`: main player action button for buying, upgrading,
  confirming, starting or entering a flow. It owns the green action treatment and
  the optional money/resource affordance.
- `IconButton`: compact icon command for close, back, menu, random, archive and
  time controls. It must always receive an accessible label.
- `ListActionButton`: compact command inside `GameListRow` or equivalent list
  rows. It keeps row actions separate from row navigation.
- `SegmentedControl`: exclusive mode selector for language, load mode, filters or
  similarly small option sets.
- `ActionBar`: shared layout for arranging actions in modals, surfaces, panels,
  cards and arena states.
- `AppDialogShell`: themed modal body wrapper used inside the modal stack or the
  chosen accessible dialog primitive. It owns warm ivory visual structure,
  title/description slots, body/footer layout and action placement. Modal state,
  focus policy and stack behavior stay with the modal infrastructure.
- `DarkPanel` / `LightPanel`: reusable visual containers. `DarkPanel` is
  for HUD, navigation, operational controls and high-contrast overlays.
  `LightPanel` is for readable entity content, forms and detail surfaces.
  Both expose header/body/footer slots and density variants; avoid nesting them.
- `WaxTabletTabs`: accessible themed tabs for modal and screen sections. It
  receives controlled tab state, i18n labels, optional icons, badges/counts and
  hidden/disabled states. Tabs that do not apply should be hidden.
- `GameFact`: compact icon-backed fact for treasury, reputation, levels,
  counts, prices and numeric badges. Use it directly for new work.
- `GameMeter`: shared meter for happiness, health, energy, morale and similar
  bounded values. It owns the track, fill, accessible value label and tone
  colors. Avoid feature-specific meter tracks.
- `GameList` / `GameListRow`: shared list and row contract for roster, market,
  buildings and ledger-like entity lists. Rows own avatar, identity, facts,
  direct actions and open behavior. Feature code supplies data and actions only.
- `GameHero`: shared detail header for building, finance, market and gladiator
  detail surfaces. It owns avatar placement, title, eyebrow, description, level
  and key facts.
- `GameSection`: flat section grouping for tab content. It should be the default
  replacement for legacy `SectionCard`, `MetricList`, `NoticeBox` and
  `EffectList` wrappers through `GameStats`, `GameNotice`, `GameEmptyState` and
  `GameEffectList`.
- `GameFeedback`: shared feedback layer for empty states, notices, form errors,
  status messages and inline hints. Do not use feature-local `empty-state`,
  `form-error` or `notice-row` classes.
- `GamePanel`: reusable screen-level panel frame for building, list, finance and
  planning surfaces. It provides title, action, filter, content and footer slots
  with consistent spacing over scenic backgrounds. It does not fetch state or
  implement feature logic.

Shared CSS for these components lives next to the shared component family, such
as `src/ui/shared/ludus/ludus-components.css` and
`src/ui/shared/ludus/ludus-controls.css`. Feature-specific CSS lives beside the
feature owner. `src/styles` is reserved for global theme and foundation CSS
only, and `src/index.css` should import only those global files. Use plain CSS;
do not introduce `styled-components`, CSS Modules or a new styling dependency
without a separate architecture decision.

## Main Game Shell

Target structure:

```tsx
<GameShell>
  <TopHud />
  <div className="game-shell__middle">
    <main>
      <SurfaceHost />
    </main>
    <SideMenu>
      <AlertsList />
      <GameActionDock />
    </SideMenu>
  </div>
  <BottomNavigation />
  <ModalHost />
  <ToastAndAlertLayer />
</GameShell>
```

The shell uses a bottom navigation surface for primary surface access. Frequent
management views should appear as integrated Ludus surfaces instead of centered
modals.

Primary shell regions should be laid out in normal document flow: HUD at the
top, a central grid containing the active surface and right sidebar, and bottom
navigation below. Avoid absolute positioning or pseudo-elements for these main
regions; reserve overlays for modal, toast, tooltip and contextual sheet
behavior.

Bottom navigation entries:

- Buildings;
- Gladiators;
- Market;
- Planning;
- Finances.

The current player-facing shell also keeps global action CTAs, such as starting
the week or entering the arena, in the right sidebar below the alerts block.

The right sidebar is a full-height layout region without its own background. It
can stack independent game widgets. Alerts are one widget with their own panel
background and should flex to occupy the available space above optional action
widgets.

Sidebar widgets should use `ShellWidgetPanel` from
`src/ui/features/ludus/shell/ShellWidgetPanel.tsx` so alerts, action prompts and
future right-rail widgets share the same bronze/warm ivory shell treatment.

Primary surfaces are first-level tabs. They do not need a global "back to
Domain" control. Back controls are reserved for true drill-down states, blocking
flows and narrow responsive layouts where a detail view temporarily replaces a
list.

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

## Buildings Surface

The buildings surface is the default first-level game tab.

It displays:

- current buildings in a scalable list/grid at first level;
- selected building details at second level;
- alerts attached to buildings;
- building level;
- quick access to market and arena.

Building interactions focus on selecting the building inside the Buildings tab,
not opening a separate top-level surface. The first-level Buildings tab always
shows the list. Clicking a building moves one level deeper inside the same
surface and shows only that building's management panel. Reusing the bottom
navigation entry returns to the first-level list.

## Alerts

Alerts are active-action prompts derived from the current save. They can be global to the Ludus, attached to a building, or attached to a gladiator.

Global Ludus alerts currently cover weekly planning:

- empty planning is critical and opens the weekly planning panel, but does not block the week;
- incomplete planning is a warning and opens the weekly planning panel, but does not block the week.

Building alerts badge the related building and show its avatar in the side alert menu. The Dormitory open register alert appears when the Ludus has roster space and at least one affordable recruit in the market; clicking it opens the market.

Gladiator alerts show the gladiator portrait and open the relevant gladiator surface when possible. Current rules cover unassigned skill points and visible gladiator traits.

Future rules such as low happiness or low treasury should be added to the central alert engine as Ludus rules, with matching i18n keys and tests. UI routing should continue to rely on `actionKind`, `buildingId` and `gladiatorId` rather than feature-specific trigger code.

## Notifications

Notifications are persisted records of ludus-life events that happened without a direct player command. They appear in a dedicated right-sidebar widget below alerts and above global action CTAs while unarchived.

Each notification shows its game date, title, description and optional building or gladiator subject. If the subject still exists, clicking the notification opens the related building or gladiator surface. The archive button hides it from the sidebar.

The full notifications surface lists all notifications, including archived entries, sorted newest first. Unarchived entries use stronger text weight; archived entries are visually muted and labeled as archived.

## Building Panels

Clicking a building opens its second-level detail inside the Buildings surface in
normal player navigation. Legacy modal rendering may remain for compatibility,
but frequent building management should use the integrated surface.

Building details use the shared content framework described below. They show a
hero card with avatar, name, description, level and short configurable metrics
before any tab content.

Building tabs are ordered as:

- Overview;
- Gladiators, only when the surface has a contextual roster entry point;
- Configuration, only when the building has policies or specialized activities;
- Upgrades, only when the building has improvements or a skill tree;
- Finances.

The selected building panel shows ownership, level, current effects, generated
skill tree entries and relevant planning/ledger context. Dense skill trees and
finance views belong in the full Buildings surface, not in a compact contextual
sheet.

When a gladiator appears inside a building surface, selecting them opens a
contextual sheet by default. The contextual sheet provides fast reading and a CTA
to open the full Gladiators surface with that gladiator selected.

## Modal Framework

`AppModal` remains the outer accessibility shell for focus, backdrop, title, close and back behavior. Modal content should use the internal framework components from `src/ui/app-shell/modals/ModalContentFrame.tsx` for consistent item details.

`AppDialogShell` is the Ludus-themed modal body contract. It should complement
the modal stack instead of replacing stack semantics or entity drilldown
behavior.

Shared modal content components:

- `ModalContentFrame` wraps the modal body content and provides the common spacing rhythm.
- `ModalHeroCard` is a compatibility wrapper around `GameHero`.
- `ModalTabs` renders tab navigation with optional count badges, including count badges for available skill points or actionable alerts.
- `ModalTabPanel` wraps the active tab content.
- `ModalSection` is a compatibility wrapper around a flat `GameSection`.
- `ModalActionDock` centers primary CTAs at the bottom of a modal tab.

Visual containment rules:

- Avoid the “card inside card” effect. If `AppModal`, `GameHero`, `ModalTabPanel`, `GameSection`, `GameList`, or a feature panel already provides containment, children should usually use spacing, headings, separators, or subtle background tint instead of another bordered box.
- Do not wrap `GameList` in another section only to add a title. Prefer a direct list with the surrounding tab or modal title providing context. Add a `ModalSection` / `GameSection` heading only when the page contains multiple distinct groups that would otherwise be ambiguous.
- `GameSection` should be reserved for meaningful grouping or comparative blocks, not as a default wrapper around every list, metrics group, notice, chart or CTA.
- When nesting is unavoidable, only one layer should carry a visible border. Inner elements should use whitespace, a left accent strip, text hierarchy, or light background tint.
- Prefer fewer borders and flatter panels over stacked warm ivory boxes. The Roman visual style should come from typography, color, icons and purposeful hero surfaces, not from repeated frames.

Default entity detail template:

- Hero card first, with avatar on the left and name, description, level and key metrics on the right.
- Tabs second, using the same order for the same type of entity across the app.
- Tab content third, using direct lists, `ModalSection`, shared metrics, impact indicators or charts as needed. Use shared cards only when they add meaningful grouping.
- Primary action last, centered in `ModalActionDock` or `ActionBar` and using
  `PrimaryActionButton` by default.

Building detail template:

- Overview contains advanced characteristics, current effects, capacity details when relevant and the build or upgrade CTA.
- Configuration contains policies and specialized activities; hide the tab when neither exists.
- Upgrades contains purchased and available improvements plus the building skill tree; hide the tab when no upgrade data exists.
- Finances shows building-specific gains, costs and recent ledger entries.

Gladiator detail template:

- Use the same hero card structure with portrait, name, short description and key stats.
- Show `GladiatorTraits` directly below the gladiator name. The first row contains permanent traits; the second row contains temporary traits.
- Use tabs for overview, assignment or planning, progression and finances only when those sections exist.
- Show derived level, total XP, XP toward the next level and available skill points through view-model values, not component-local formulas.
- Progression contains skill allocation controls for strength, agility, defense and life. Allocation spends whole points only, clamps skills to 1..10 and disables maxed skills.
- Use `GladiatorAttributes` from `src/ui/features/gladiators/GladiatorAttributes.tsx` whenever a gladiator row or gladiator hero needs the standard compact attributes. The order is reputation, life, strength, agility and defense, and skill values are displayed as integers from 1 to 10.
- Use `GladiatorListRow` from `src/ui/features/gladiators/GladiatorListRow.tsx` for gladiator lists, including market and owned roster rows. Customize it through props for price, primary action and clickability instead of rebuilding row markup.
- Reuse `GladiatorTraits` in roster rows, market rows, contextual sheets and arena summaries whenever a gladiator identity block is shown.
- Use `GladiatorAttributes` and `GameFact` for compact aptitude, reputation,
  life and cost values. Do not create feature-local stat chip components or
  manually pair `GameIcon` with a numeric value for these facts.
- Do not create isolated bespoke stat cards when `GameHero`, `GameStats`,
  `ImpactIndicator`, `ImpactList` or chart primitives can represent the data.
  Avoid wrapping these primitives in extra cards unless the grouping changes the
  meaning.

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

Entity and action lists should use `GameList` and `GameListRow` from
`src/ui/shared/ludus/GameList.tsx`. `EntityList` remains only as a compatibility
wrapper for older feature code.

Default list row structure:

- optional avatar on the left;
- flexible identity area with title and optional subtitle;
- right-side information panel with icon-backed values;
- right-side action panel with one or more buttons.

List rules:

- Lists take the full available width.
- Rows and row columns are separated by simple dividers, with enough padding to stay readable.
- Use `GameList` / `GameEmptyState` empty states instead of bespoke empty
  paragraphs for entity lists.
- If a row opens a detail view, pass `onOpen` and make the whole row clickable; action buttons must remain separate and must not trigger row navigation.
- Use primary `GameListAction` actions for CTAs and secondary actions for
  destructive or less common operations.
- Prefer `GameListFact` icon/value metrics for compact facts such as level,
  reputation, wage, cost or profitability. `GameListRow` renders these through
  `GameFact`; keep new list facts on that path instead of custom row markup.
- Use `PrimaryActionButton` for primary CTAs. When the action has a monetary
  amount, pass `amountMoney` so the button renders the standardized
  `label (amount treasuryIcon)` pattern. Use `ListActionButton` for row-level
  actions.

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

Current visible task options are unlocked from owned buildings and building skills. The current player-facing planner exposes a single `training` task.

The panel shows projected daily deltas and an aggregate weekly projection. Starting the week and entering the arena are handled by the separate game action dock above the bottom navigation.

Skill allocation alerts should appear when owned gladiators have available skill points. Alert actions should open the relevant gladiator progression UI. The alert layer, gladiator list rows and gladiator detail tabs may show badges, but allocation remains a deliberate player action. The alert itself is generated by the central alert engine, not by the planning UI.

## Gladiators

Gladiators are available through the `Gladiators` list panel and building context.

The first-level Gladiators tab shows the roster list and roster filters. Clicking
a gladiator moves one level deeper inside the same surface and shows the full
gladiator profile without list filters. Reusing the bottom navigation entry
returns to the first-level roster list.

This keeps the main screen scalable as the school grows.

## Events

Events remain focused blocking modal decisions. They are opened by game flow when a pending event needs a choice and do not appear as a persistent bottom navigation entry. Activity-gated events should only appear when their related activity has points allocated or when a global condition explicitly allows them.

## Visual Direction

The Roman American comic / BD-inspired direction remains:

- dark bronze and stone HUDs;
- warm ivory-like panels;
- warm ludus backdrop;
- visible buildings and management entry points;
- bold readable silhouettes;
- simple color masses with qualitative illustrative detail;
- theatrical arena combat presentation.

Debug or dashboard-style UI must remain behind debug flags or dedicated debug routes.
