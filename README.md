# ludus

`ludus` is a browser-based management game where the player manages a Roman gladiator school.

The game combines:

- weekly planning;
- gladiator training and recovery;
- strategic building upgrades;
- market decisions;
- events;
- Sunday arena combats.

## Stack

- Vite
- React
- TypeScript
- ESLint
- Prettier
- Husky
- lint-staged
- Vitest

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run build
npm run lint
npm run test
```

## Documentation

- `docs/00_overview/PROJECT_OVERVIEW.md`
- `docs/01_game_design/GAMEPLAY.md`
- `docs/01_game_design/GAME_DATA.md`
- `docs/01_game_design/DEMO_MODE.md`
- `docs/02_technical/ARCHITECTURE.md`
- `docs/02_technical/DOMAIN_MODELS.md`
- `docs/03_product/UI_UX.md`
- `docs/03_product/ART_DIRECTION.md`

## Principles

- Source code is written in English.
- UI supports French and English.
- Game formulas and definitions live in `src/game-data` and `src/domain`.
- React components do not contain complex game logic.
- The project should remain easy to rebalance.
- The default player interface is map-first, not dashboard-first.
- The visual direction is Roman American comic / BD-inspired, with generated production images referenced as WebP.
- Documentation describes the implementation that exists now; roadmap planning lives outside the repository.
