# ludus

`ludus` is a browser-based management game where the player manages a Roman gladiator school.

The game combines:

- weekly planning;
- gladiator training and recovery;
- strategic building upgrades;
- market decisions;
- contracts and events;
- Sunday arena combats;
- betting and combat preparation.

## Stack

- Vite
- React
- TypeScript
- ESLint
- Prettier
- Husky
- lint-staged
- commitlint
- Vitest
- React Testing Library
- Playwright

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run test
```

## Documentation

- `docs/00_overview/PROJECT_VISION.md`
- `docs/00_overview/MVP_SCOPE.md`
- `docs/01_game_design/GAMEPLAY.md`
- `docs/01_game_design/GAME_DATA.md`
- `docs/01_game_design/DEMO_MODE.md`
- `docs/02_technical/ARCHITECTURE.md`
- `docs/02_technical/DOMAIN_MODELS.md`
- `docs/03_product/UI_UX.md`
- `docs/03_product/ART_DIRECTION.md`
- `docs/04_roadmap/ROADMAP.md`

## Principles

- Source code is written in English.
- UI supports French and English.
- Game formulas and definitions live in `src/game-data` and `src/domain`.
- React components do not contain complex game logic.
- The project should remain easy to rebalance.
- The default player interface is map-first, not dashboard-first.
