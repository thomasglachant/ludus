# Decision 0001 — Map-first Player Interface

## Status

Accepted

## Context

The initial prototype UI was functional but looked like a debug dashboard. It displayed too many systems at once and did not communicate the intended Roman pixel-art management game fantasy.

## Decision

The default player interface will be rebuilt around a full-screen map-first game shell.

The current dashboard-style interface may remain available only as a development/debug screen.

The main game screen will prioritize:

- a large living ludus map;
- contextual panels;
- portrait-based gladiator roster;
- visual building assets;
- time-of-day atmosphere;
- Roman countryside pixel-art direction.

## Consequences

- UI work must prioritize layout, art direction and interaction hierarchy before adding more gameplay features.
- Debug components must be separated from player-facing components.
- Map layout and visual definitions must be data-driven.
- Demo saves must include visual identities for gladiators.
- The old building budget slider system must not be reintroduced.
