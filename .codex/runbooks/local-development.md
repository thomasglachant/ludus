# Local Development Runbook

1. Install dependencies:

```bash
npm ci
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app at `http://localhost:5175/`.

4. Before handing work back or committing, run the relevant checks:

```bash
npm run check:assets
npm run build
npm run lint
npm run test
```

5. To match CI locally in one command:

```bash
npm run check:assets && npm run build && npm run lint && npm run test
```
