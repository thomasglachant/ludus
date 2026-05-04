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
const buildingsPath = join(root, 'src', 'game-data', 'buildings.ts');
const generatedAt = '2026-04-28T00:00:00.000Z';
const checkOnly = process.argv.includes('--check');

const externalLocationIds = new Set(['arena', 'market']);
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

function readPngSize(path) {
  const buffer = readFileSync(path);

  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Expected PNG asset: ${path}`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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
    [
      ['day', join(publicAssetsRoot, 'main-menu', 'main-menu-background-day.webp')],
      ['dusk', join(publicAssetsRoot, 'main-menu', 'main-menu-background-dusk.webp')],
    ]
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
  return {
    sourceQuality: 'production',
    background: '/assets/ludus/ludus-background.png',
  };
}

function buildBuildingManifest() {
  const activeBuildingIds = new Set(
    parseArrayConstant(readFileSync(buildingsPath, 'utf8'), 'BUILDING_IDS'),
  );
  const buildingFiles = listFiles(join(publicAssetsRoot, 'buildings')).filter(
    (path) => extname(path) === '.png',
  );
  const buildings = {};

  for (const path of buildingFiles) {
    const [, buildingId, levelId, partName] =
      relative(join(publicAssetsRoot, 'buildings'), path)
        .split(sep)
        .join('/')
        .match(/^([^/]+)\/(level-\d+)\/([^/]+)\.png$/) ?? [];

    if (!buildingId || !activeBuildingIds.has(buildingId) || !levelId || !partName) {
      continue;
    }

    const size = readPngSize(path);
    buildings[buildingId] ??= {};
    buildings[buildingId][levelId] ??= {
      sourceQuality: 'production',
      width: size.width,
      height: size.height,
    };
    buildings[buildingId][levelId][partName] = toWebPath(path);
  }

  const generatedBuildingFiles = listFiles(join(publicAssetsRoot, 'generated', 'buildings')).filter(
    (path) => extname(path) === '.png',
  );

  for (const path of generatedBuildingFiles) {
    const buildingId = relative(join(publicAssetsRoot, 'generated', 'buildings'), path)
      .split(sep)
      .join('/')
      .replace(/\.png$/, '');

    if (!buildingId || externalLocationIds.has(buildingId) || !activeBuildingIds.has(buildingId)) {
      continue;
    }

    const size = readPngSize(path);
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
  const arenaExteriorPath = join(publicAssetsRoot, 'generated', 'buildings', 'arena.png');
  const marketExteriorPath = join(publicAssetsRoot, 'generated', 'buildings', 'market.png');

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
    ['.png', '.svg'].includes(extname(path)),
  );

  return Object.fromEntries(
    uiFiles
      .map((path) => {
        const id = relative(join(publicAssetsRoot, 'ui'), path)
          .split(sep)
          .join('/')
          .replace(/\.(png|svg)$/, '');
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
