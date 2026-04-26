# Future Feature Guardrails

This document is historical migration context. Durable guardrails for future
work now live in `docs/03_product/ART_DIRECTION.md` and
`docs/03_product/UI_UX.md`.

## Visual Direction Must Remain Game-First

Future features must not reintroduce a web-dashboard look.

Use:

- dark Roman HUD frames;
- parchment panels;
- bronze/gold borders;
- red banners and Roman motifs;
- pixel-art assets;
- contextual overlays;
- map-first interaction.

Avoid:

- plain white cards;
- generic SaaS button styles;
- full-page forms unless absolutely necessary;
- permanent display of every subsystem at once;
- debug-style data dumps in the normal player UI.

## Preserve Map-First Structure

The map is the player's default mental model. Future features should answer:

- where does this feature live in the ludus/world?
- which building or location opens it?
- what visual feedback appears on the map?
- how does it affect gladiators or buildings visibly?

Examples:

- Staff should appear around buildings.
- Weather should affect map tint/ambient layers.
- New buildings should have map locations, level variants, hover states, and action stations.
- New combat systems should integrate into the Arena and Combat screen rather than becoming tables.

## Asset Data First

For new visual features, add/update data before creating component-specific hardcoding.

Preferred sequence:

1. add asset(s) to `public/assets/pixel-art/`;
2. add manifest/game-data references;
3. add view-model helper if needed;
4. render through React;
5. add tests or demo state.

## Animation Rules

- Ambient animations are part of the game feel.
- Use CSS transform/opacity for simple loops.
- Avoid React per-frame state updates for ambience.
- Respect `prefers-reduced-motion`.
- Keep character animations short and readable.
- Two-frame animation is acceptable for MVP if silhouettes are clear.

## Gladiator Identity Rules

Gladiators should feel memorable.

Future gladiator-related features should use or extend visual identity dimensions:

- portrait;
- map sprite;
- combat sprite;
- skin tone;
- hair/beard;
- body type;
- tunic/armor;
- wounds/bandages;
- rank/reputation markers.

Do not display gladiators only as text rows unless the UI is explicitly compact/debug.

## Modal and Panel Rules

Use shared UI primitives before building custom chrome.

New modals should follow the modal reference:

- dark title strip;
- parchment body;
- bronze/stone frame;
- strong primary/secondary actions;
- clear resource/cost presentation;
- map remains visible/dimmed behind important focused choices.

## Combat Rules

Combat should stay theatrical.

Future combat features should integrate with:

- arena background;
- fighter status panels;
- fighter sprites;
- combat log;
- skills/strategy area;
- fatigue/health visual feedback.

Do not reduce combat back to a plain list unless it is a debug view.

## Documentation Rules

When future work changes the visual direction, update:

- `docs/03_product/ART_DIRECTION.md` for durable art direction;
- `docs/03_product/UI_UX.md` for interface behavior;
- `docs/02_technical/ARCHITECTURE.md` if data/component boundaries change;
- `agents.md` with only short orientation notes.
