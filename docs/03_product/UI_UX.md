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

The Tailwind + shadcn/ui migration keeps the UI layers explicit and reusable.
Dependency direction is one-way: `src/ui/screens` composes `src/ui/game`,
which composes `src/ui/primitives`.

- `src/ui/primitives` contains the lowest-level accessible primitives, Tailwind
  variants and adapters around shadcn/ui, Radix UI or React Aria APIs. These
  components have no game vocabulary, store access, domain rules or
  feature-specific i18n keys.
- `src/ui/game` contains reusable Ludus components that express the Roman
  American comic / BD-inspired visual language. They compose primitives into
  buttons, panels, tabs, badges and modal bodies. They may know generic game
  concepts such as resources, but they do not compute gameplay or read stores.
- `src/ui/screens` contains route, screen and modal surfaces. Screens bind store
  state, selectors, actions and view models, then compose `src/ui/game`
  components into the player experience.

Reuse rule: use the highest shared component that fits before creating anything
new. Screens should first reach for `src/ui/game`; game components should first
reach for `src/ui/primitives`. Feature-local UI is allowed only after a short
contract explains the gap, owned props/state, reuse expectation and shared
building blocks.

## Ludus Component Contracts

The migration uses short, stable contracts for Ludus-themed components:

- `RomanButton`: default themed command component for primary, secondary,
  destructive, ghost and icon actions. It composes the primitive button and CTA
  treatments, accepts i18n-rendered content, optional icons, disabled/loading
  states and optional resource or money affordances. Parents own actions.
- `ParchmentModal`: themed modal body wrapper used inside the modal stack or the
  chosen accessible dialog primitive. It owns parchment visual structure,
  title/description slots, body/footer layout and action placement. Modal state,
  focus policy and stack behavior stay with the modal infrastructure.
- `StonePanel` / `ParchmentPanel`: reusable visual containers. `StonePanel` is
  for HUD, navigation, operational controls and high-contrast overlays.
  `ParchmentPanel` is for readable entity content, forms and detail surfaces.
  Both expose header/body/footer slots and density variants; avoid nesting them.
- `WaxTabletTabs`: accessible themed tabs for modal and screen sections. It
  receives controlled tab state, i18n labels, optional icons, badges/counts and
  hidden/disabled states. Tabs that do not apply should be hidden.
- `ResourceBadge` / `TreasuryBadge` / `ReputationBadge`: compact icon-backed
  resource facts. `ResourceBadge` is generic; resource-specific badges provide
  icon, tone and formatting defaults plus optional click behavior such as opening
  finance. Values are computed upstream.
- `GamePanel`: reusable screen-level panel frame for building, list, finance and
  planning surfaces. It provides title, action, filter, content and footer slots
  with consistent spacing over scenic backgrounds. It does not fetch state or
  implement feature logic.

## Main Game Shell

Target structure:

```tsx
<GameShell>
  <TopHud />
  <BuildingsOverview />
  <BottomNavigation />
  <ModalHost />
  <ToastAndAlertLayer />
</GameShell>
```

The shell uses a bottom navigation surface for primary panel access.

Bottom navigation entries:

- Buildings;
- Gladiators;
- Market;
- Planning;
- Finances.

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

## Buildings Overview

The buildings overview remains the center of the game shell.

It displays:

- current buildings;
- alerts attached to buildings;
- building level;
- quick access to market and arena.

Building interactions focus on opening the management panels quickly while preserving the Roman American comic / BD-inspired direction through assets, HUD styling and parchment/bronze panels.

## Alerts

Alerts are active-action prompts derived from the current save. They can be global to the Ludus, attached to a building, or attached to a gladiator.

Global Ludus alerts currently cover weekly planning:

- empty planning is critical and opens the weekly planning panel, but does not block the week;
- incomplete planning is a warning and opens the weekly planning panel, but does not block the week.

Building alerts badge the related building and show its avatar in the right alert rail. The Domus open register alert appears when the Ludus has space and at least one affordable recruit in the market; clicking it opens the market.

Gladiator alerts show the gladiator portrait and open the relevant gladiator surface when possible. Current rules cover unassigned skill points and visible status effects.

Future rules such as low happiness or low treasury should be added to the central alert engine as Ludus rules, with matching i18n keys and tests. UI routing should continue to rely on `actionKind`, `buildingId` and `gladiatorId` rather than feature-specific trigger code.

## Building Panels

Clicking a building opens the building modal.

Building detail modals use the shared modal framework described below. They show a hero card with avatar, name, description, level and short configurable metrics before any tab content.

Building modal tabs are ordered as:

- Overview;
- Configuration, only when the building has policies or specialized activities;
- Upgrades, only when the building has improvements or a skill tree;
- Finances.

The panel shows ownership, level, current effects, generated skill tree entries and relevant planning/ledger context.

## Modal Framework

`AppModal` remains the outer accessibility shell for focus, backdrop, title, close and back behavior. Modal content should use the internal framework components from `src/ui/modals/ModalContentFrame.tsx` for consistent item details.

`ParchmentModal` is the Ludus-themed modal body contract for the Tailwind +
shadcn/ui migration. It should complement the modal stack instead of replacing
stack semantics or entity drilldown behavior.

Shared modal content components:

- `ModalContentFrame` wraps the modal body content and provides the common spacing rhythm.
- `ModalHeroCard` renders the item identity block with avatar, eyebrow, title, description, optional level and a configurable metric strip.
- `ModalTabs` renders tab navigation with optional count badges, including count badges for available skill points or actionable alerts.
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
- Finances shows building-specific gains, costs and recent ledger entries.

Gladiator detail template:

- Use the same hero card structure with portrait, name, short description and key stats.
- Use tabs for overview, assignment or planning, progression and finances only when those sections exist.
- Show derived level, total XP, XP toward the next level and available skill points through view-model values, not component-local formulas.
- Progression contains skill allocation controls for strength, agility, defense and life. Allocation spends whole points only, clamps skills to 1..10 and disables maxed skills.
- Use `GladiatorAttributes` from `src/ui/gladiators/GladiatorAttributes.tsx` whenever a gladiator row or gladiator hero needs the standard compact attributes. The order is reputation, life, strength, agility and defense, and skill values are displayed as integers from 1 to 10.
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
- Prefer `EntityListInfoItem` icon/value metrics for compact facts such as level, reputation, wage, cost or profitability. `EntityListRow` renders these through `IconValueStat`; keep new list facts on that path instead of custom row markup.
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

Current visible task options are unlocked from owned buildings and building skills. The current player-facing planner exposes a single `training` task.

The panel shows projected daily deltas and an aggregate weekly projection. Starting the week and entering the arena are handled by the separate game action dock above the bottom navigation.

Skill allocation alerts should appear when owned gladiators have available skill points. Alert actions should open the relevant gladiator progression UI. The alert layer, gladiator list rows and gladiator detail tabs may show badges, but allocation remains a deliberate player action. The alert itself is generated by the central alert engine, not by the planning UI.

## Gladiators

Gladiators are available through the `Gladiators` list panel and building context.

This keeps the main screen scalable as the school grows.

## Events

Events remain focused blocking modal decisions. They are opened by game flow when a pending event needs a choice and do not appear as a persistent bottom navigation entry. Activity-gated events should only appear when their related activity has points allocated or when a global condition explicitly allows them.

## Visual Direction

The Roman American comic / BD-inspired direction remains:

- dark bronze and stone HUDs;
- parchment-like panels;
- warm ludus backdrop;
- visible buildings and management entry points;
- bold readable silhouettes;
- simple color masses with qualitative illustrative detail;
- theatrical arena combat presentation.

Debug or dashboard-style UI must remain behind debug flags or dedicated debug routes.
