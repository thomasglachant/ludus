# Visual Target

> Historical note: this target brief informed the migration. Current durable
> art direction lives in `docs/03_product/ART_DIRECTION.md`.

## Overall Feeling

The game should feel like a handcrafted pixel-art Roman management game. It should not feel like a SaaS admin dashboard, a generic card UI, or a debug tool.

The player should immediately understand: “I manage a living gladiator school.”

The target references imply:

- warm Roman countryside;
- dark bronze/stone HUD frames;
- parchment surfaces for modals and cards;
- gold/ochre highlights;
- red banners and Roman insignia;
- highly readable pixel-art buildings and characters;
- a dense, lively scene without sacrificing UI clarity.

## Homepage Reference

Target composition:

- full-screen illustrated ludus background;
- logo top-left/left side with laurels and strong title;
- vertical menu buttons on the left;
- resource capsule top-right;
- last save card bottom-right;
- warm daylight countryside with buildings, arena, market, trees, mountains, walls, and paths.

Implementation guidance:

- Replace flat menu/card styling with a full-viewport menu scene.
- Keep `data-testid="main-menu-new-game"` and `data-testid="main-menu-load-game"`.
- Use the generated `main-menu-background` asset or a CSS/SVG layered scene.
- Style buttons as parchment plaques with bronze borders and red primary state.
- Keep Options and Load Game as modal overlays, not separate dashboard screens.

## Map Reference

Target composition:

- fixed full-screen game shell;
- dark top HUD with Roman insignia, season/day/time, speed controls, resources, settings;
- left compact summary rail;
- central map occupying most of the screen;
- right context/journal panel;
- bottom roster cards with portraits and meters;
- pixel-art ludus map with roads, buildings, trees, arena, training ground, walls, banners.

Implementation guidance:

- Keep `GameShell` as the structural root.
- Restyle `TopHud`, `LeftNavigationRail`, `ContextualPanelHost`, `BottomGladiatorRoster`, and `LudusMap` as one cohesive in-game interface.
- Do not show every system at once. Right-side context can say there is no active task when nothing is selected.
- The map should have layered life: moving clouds, grass sways, torch flickers, subtle building smoke/light, crowd micro-movement in arena.

## Modal Reference

Target composition:

- map darkened behind a centered parchment modal;
- dark top strip with uppercase title;
- pixel-art building illustration;
- current/next level comparison;
- improvement rows with icon, old value, arrow, new value;
- cost bar with multiple resources;
- green primary action and beige cancel action;
- ornate but readable frame.

Implementation guidance:

- Global modal/panel styling must be restyled once, not per feature.
- Building upgrade confirmation should be upgraded from generic text confirm to a `BuildingUpgradeModal`-style content shell.
- The modal can still use the existing global modal infrastructure.
- Costs should support treasury now and be visually ready for future resources.

## Combat Reference

Target composition:

- full arena background with crowd, central tribune, sand floor;
- top HUD showing date/time, round/manche, resources, pause/speed;
- left fighter status panel;
- right fighter status panel;
- center fighters with health bars above them;
- bottom-center skill selection panel;
- bottom combat log;
- fatigue bars bottom left/right;
- two-frame fighter idle/motion animation minimum.

Implementation guidance:

- Add a dedicated `CombatScreen` or `CombatOverlay` instead of forcing the combat reference into the narrow arena panel.
- Use existing `CombatState`, `CombatTurn`, combat log keys, and domain consequences.
- Add `ScreenName = 'combat'` only if store navigation and tests are updated safely; otherwise use an overlay within `GameShell` while an active combat exists.
- First version can replay resolved combat turns step-by-step rather than requiring fully interactive combat mechanics.

## Color and Material Language

Suggested tokens:

- background almost black: `#15110d`;
- panel dark: `#201a14`;
- panel dark raised: `#2a2118`;
- parchment: `#e5d1a3`;
- parchment light: `#f0dfb8`;
- parchment shadow: `#a7824f`;
- bronze: `#b47a33`;
- gold: `#d6a34a`;
- red primary: `#9e4634`;
- green action: `#2f6e46`;
- health red: `#b53a2f`;
- stamina/energy ochre: `#c08a2e`;
- morale/satiety green: `#5d9a55`;
- night overlay: `rgba(11, 18, 33, 0.54)`.

Use these as a direction, not as a rigid palette. Pixel art should keep a limited palette and strong silhouettes.

## Typography

No external font files should be committed unless licensing is explicit. Use system-safe font stacks by default.

Recommended CSS stacks:

```css
--font-display: Georgia, 'Times New Roman', serif;
--font-ui:
  Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
```

Pixel-style typography can be simulated through uppercase, letter spacing, text shadow, and small caps without introducing font licensing risk.
