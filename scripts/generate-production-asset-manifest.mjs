#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicAssetsRoot = join(root, 'public', 'assets');
const typescriptManifestPath = join(
  root,
  'src',
  'game-data',
  'generated',
  'asset-manifest.production.ts',
);
const buildingsPath = join(root, 'src', 'domain', 'buildings', 'types.ts');
const generatedAt = '2026-04-28T00:00:00.000Z';
const checkOnly = process.argv.includes('--check');

const externalLocationIds = new Set(['arena', 'market']);
const productionRasterExtensions = new Set(['.webp']);

function toWebPath(path) {
  return `/assets/${relative(publicAssetsRoot, path).split(sep).join('/')}`;
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function listFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name);

    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function sortObjectEntries(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readWebpSize(path, buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`Expected WebP asset: ${path}`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;

    if (chunkType === 'VP8X') {
      return {
        width: readUint24LE(buffer, chunkDataOffset + 4) + 1,
        height: readUint24LE(buffer, chunkDataOffset + 7) + 1,
      };
    }

    if (chunkType === 'VP8 ') {
      return {
        width: buffer.readUInt16LE(chunkDataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(chunkDataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === 'VP8L') {
      const bits = buffer.readUInt32LE(chunkDataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  throw new Error(`Unsupported WebP asset: ${path}`);
}

function readRasterSize(path) {
  const buffer = readFileSync(path);
  const extension = extname(path);

  if (extension === '.webp') {
    return readWebpSize(path, buffer);
  }

  throw new Error(`Unsupported raster asset: ${path}`);
}

function parseArrayConstant(source, name) {
  const match = source.match(
    new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const(?: satisfies [^;]+)?;`),
  );
  if (!match) {
    throw new Error(`Missing variant constant: ${name}`);
  }

  return Array.from(match[1].matchAll(/'([^']+)'/g), ([, value]) => value);
}

function buildHomepageManifest() {
  const lastSaveThumbnailPath = join(publicAssetsRoot, 'main-menu', 'last-save-thumbnail.webp');
  const backgrounds = Object.fromEntries(
    [['main', join(publicAssetsRoot, 'main-menu', 'main-menu-background.webp')]]
      .filter(([, path]) => existsSync(path))
      .map(([phase, path]) => [phase, toWebPath(path)]),
  );

  return {
    sourceQuality: 'production',
    backgrounds,
    ...(existsSync(lastSaveThumbnailPath)
      ? { lastSaveThumbnail: toWebPath(lastSaveThumbnailPath) }
      : {}),
  };
}

function buildLudusManifest() {
  const webpBackgroundPath = join(publicAssetsRoot, 'ludus', 'ludus-background.webp');

  return {
    sourceQuality: 'production',
    background: toWebPath(webpBackgroundPath),
  };
}

function buildBuildingManifest() {
  const activeBuildingIds = new Set(
    parseArrayConstant(readFileSync(buildingsPath, 'utf8'), 'BUILDING_IDS'),
  );
  const buildingFiles = listFiles(join(publicAssetsRoot, 'buildings')).filter((path) =>
    productionRasterExtensions.has(extname(path)),
  );
  const buildings = {};

  for (const path of buildingFiles) {
    const [, buildingId, levelId, partName] =
      relative(join(publicAssetsRoot, 'buildings'), path)
        .split(sep)
        .join('/')
        .match(/^([^/]+)\/(level-\d+)\/([^/]+)\.webp$/) ?? [];

    if (!buildingId || !activeBuildingIds.has(buildingId) || !levelId || !partName) {
      continue;
    }

    const size = readRasterSize(path);
    buildings[buildingId] ??= {};
    buildings[buildingId][levelId] ??= {
      sourceQuality: 'production',
      width: size.width,
      height: size.height,
    };
    buildings[buildingId][levelId][partName] = toWebPath(path);
  }

  const generatedBuildingFiles = listFiles(join(publicAssetsRoot, 'generated', 'buildings')).filter(
    (path) => productionRasterExtensions.has(extname(path)),
  );

  for (const path of generatedBuildingFiles) {
    const buildingId = relative(join(publicAssetsRoot, 'generated', 'buildings'), path)
      .split(sep)
      .join('/')
      .replace(/\.webp$/, '');

    if (!buildingId || externalLocationIds.has(buildingId) || !activeBuildingIds.has(buildingId)) {
      continue;
    }

    const size = readRasterSize(path);
    buildings[buildingId] ??= {};
    buildings[buildingId]['level-1'] ??= {
      sourceQuality: 'production',
      width: size.width,
      height: size.height,
    };
    buildings[buildingId]['level-1'].exterior ??= toWebPath(path);
  }

  return sortObjectEntries(
    Object.fromEntries(
      Object.entries(buildings).map(([buildingId, levels]) => [
        buildingId,
        sortObjectEntries(levels),
      ]),
    ),
  );
}

function buildLocationsManifest() {
  const arenaExteriorPath = join(publicAssetsRoot, 'generated', 'buildings', 'arena.webp');
  const marketExteriorPath = join(publicAssetsRoot, 'generated', 'buildings', 'market.webp');

  return {
    arena: {
      sourceQuality: 'production',
      combatBackground: '/assets/combat/arena-background.webp',
      ...(existsSync(arenaExteriorPath) ? { exterior: toWebPath(arenaExteriorPath) } : {}),
    },
    market: {
      sourceQuality: 'production',
      ...(existsSync(marketExteriorPath) ? { exterior: toWebPath(marketExteriorPath) } : {}),
    },
  };
}

function buildGladiatorManifest() {
  return {};
}

function buildUiManifest() {
  const uiFiles = listFiles(join(publicAssetsRoot, 'ui')).filter((path) =>
    ['.webp', '.svg'].includes(extname(path)),
  );

  return Object.fromEntries(
    uiFiles
      .map((path) => {
        const id = relative(join(publicAssetsRoot, 'ui'), path)
          .split(sep)
          .join('/')
          .replace(/\.(webp|svg)$/, '');
        return [id, toWebPath(path)];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function serializeManifestModule(manifest) {
  return format(
    `import type { VisualAssetManifest } from '../visual-assets';\n\nexport const PRODUCTION_VISUAL_ASSET_MANIFEST = ${JSON.stringify(
      manifest,
      null,
      2,
    )} as const satisfies VisualAssetManifest;\n`,
    {
      parser: 'typescript',
      printWidth: 100,
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
    },
  );
}

function writeText(path, content) {
  ensureDir(dirname(path));

  if (existsSync(path) && readFileSync(path, 'utf8') === content) {
    return false;
  }

  writeFileSync(path, content);
  return true;
}

function checkText(path, content) {
  if (!existsSync(path)) {
    console.error(`Missing asset manifest: ${relative(root, path)}`);
    return false;
  }

  if (readFileSync(path, 'utf8') !== content) {
    console.error(`Asset manifest is out of date: ${relative(root, path)}`);
    console.error('Run npm run generate:assets.');
    return false;
  }

  return true;
}

async function run() {
  const manifest = {
    version: 1,
    sourceQuality: 'production',
    generatedAt,
    ludus: buildLudusManifest(),
    homepage: buildHomepageManifest(),
    buildings: buildBuildingManifest(),
    locations: buildLocationsManifest(),
    gladiators: buildGladiatorManifest(),
    ui: buildUiManifest(),
  };

  const manifestModule = await serializeManifestModule(manifest);

  if (checkOnly) {
    if (!checkText(typescriptManifestPath, manifestModule)) {
      process.exitCode = 1;
      return;
    }

    console.log(
      `Checked production asset manifest with ${Object.keys(manifest.gladiators).length} gladiators.`,
    );
    return;
  }

  writeText(typescriptManifestPath, manifestModule);

  console.log(
    `Generated production asset manifest with ${Object.keys(manifest.gladiators).length} gladiators.`,
  );
}

await run();
