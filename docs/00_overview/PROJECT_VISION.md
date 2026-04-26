# Project Vision

## Purpose

`ludus` is a browser-based management game about running a Roman gladiator school.
The player is a lanista who manages people, risk, money, reputation and long-term progression under the pressure of weekly arena combats.

The game should feel like a handcrafted management game set in a living Roman countryside ludus, not like a web administration dashboard.

## Core Fantasy

The player owns and develops a gladiator school. They buy and train gladiators, maintain their health and morale, upgrade buildings, accept contracts, prepare for arena fights and make economic decisions around risk and reputation.

The dramatic rhythm is weekly preparation followed by Sunday arena resolution:

- plan the week;
- manage routines and exceptions;
- react to events and warnings;
- improve buildings and gladiators;
- prepare combat strategies and betting decisions;
- resolve arena fights on Sunday;
- absorb consequences on Monday.

## Product Pillars

### Management

The player makes strategic decisions instead of manually moving every gladiator every few in-game hours. Weekly objectives, recommendations and automation should handle routine behavior, while the player focuses on priorities, risks and exceptions.

### Gladiator Identity

Gladiators are not anonymous resources. They have stats, gauges, traits, records, reputation, visual identity, routines and combat outcomes. The UI should support memorable portraits and visible map sprites.

### Progression

The ludus grows through future optional building purchases, level upgrades, improvements, policies, better routines, stronger gladiators, reputation and access to harder arena ranks.

### Buildings

Buildings are strategic systems and map locations. Base buildings start available, while future optional buildings may matter through purchase costs. All buildings should matter through upgrades, improvements, weekly policies, special actions, capacity constraints, action stations and visible progression.

The removed 1-to-10 building budget system must not return unless a future design decision explicitly restores it.

### Economy

Money and reputation connect the whole game. The player earns rewards through arena results, contracts and sales, then reinvests in buildings, market gladiators, treatment, scouting and future systems.

## Structural Constraints

- The app is built with Vite, React and TypeScript.
- Game rules and balance data live in `src/game-data`.
- Business logic lives in pure TypeScript modules under `src/domain`.
- React components render state and dispatch actions; they must not own complex game formulas.
- Save data includes `schemaVersion`.
- Local save is available from the first playable version.
- Cloud save is represented through an abstraction and can remain mocked until the backend decision is made.
- The UI supports French and English through i18n keys.
- The default player interface is map-first and full-screen.
- Debug dashboard screens may exist only behind development-only access.

## Long-Term Direction

`ludus` should become a cozy but tense management game where the school visibly grows, gladiators become recognizable, Sunday feels consequential and the player can understand the state of the ludus by watching the map before opening detailed panels.
