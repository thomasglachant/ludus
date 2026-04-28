import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { spawnSync } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const publicAssetsRoot = resolve('public/assets');
const gladiatorVisualVariantsPath = resolve('src/game-data/gladiator-visual-variants.ts');
const assetManifestPaths = new Set([
  resolve(publicAssetsRoot, 'asset-manifest.production.json'),
  resolve('src/game-data/generated/asset-manifest.production.json'),
]);

function generateProductionAssetManifest() {
  const result = spawnSync(process.execPath, ['scripts/generate-production-asset-manifest.mjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error('Failed to generate production asset manifest.');
  }
}

function isGeneratedAssetManifest(path: string) {
  return assetManifestPaths.has(resolve(path));
}

function isProductionManifestInput(path: string) {
  const absolutePath = resolve(path);

  if (isGeneratedAssetManifest(absolutePath)) {
    return false;
  }

  if (absolutePath === gladiatorVisualVariantsPath) {
    return true;
  }

  const relativeAssetPath = relative(publicAssetsRoot, absolutePath);

  return (
    relativeAssetPath !== '' &&
    !relativeAssetPath.startsWith('..') &&
    !isAbsolute(relativeAssetPath)
  );
}

function reloadManifestConsumers(server: ViteDevServer) {
  const module = server.moduleGraph.getModuleById(
    resolve('src/game-data/generated/asset-manifest.production.json'),
  );

  if (module) {
    server.moduleGraph.invalidateModule(module);
  }

  server.ws.send({ type: 'full-reload' });
}

function productionAssetManifestPlugin(): Plugin {
  let server: ViteDevServer | undefined;
  let regenerateTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleRegeneration(path: string) {
    if (!server || !isProductionManifestInput(path)) {
      return;
    }

    const currentServer = server;

    clearTimeout(regenerateTimer);
    regenerateTimer = setTimeout(() => {
      generateProductionAssetManifest();
      reloadManifestConsumers(currentServer);
    }, 75);
  }

  return {
    name: 'ludus-production-asset-manifest',
    buildStart() {
      generateProductionAssetManifest();
    },
    configureServer(viteServer) {
      server = viteServer;
      server.watcher.add([publicAssetsRoot, gladiatorVisualVariantsPath]);
      server.watcher.on('add', scheduleRegeneration);
      server.watcher.on('change', scheduleRegeneration);
      server.watcher.on('unlink', scheduleRegeneration);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [productionAssetManifestPlugin(), react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
