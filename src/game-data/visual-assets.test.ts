import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { BUILDING_IDS } from './buildings';
import { getBuildingVisualDefinition } from './building-visuals';
import {
  createGladiatorVisualIdentity,
  getCombatSpriteFrames,
  getGladiatorSpriteFrames,
  GLADIATOR_PORTRAIT_ASSET_IDS,
} from './gladiator-visuals';
import { LUDUS_MAP_AMBIENT_ELEMENTS } from './map-visuals';
import { TIME_OF_DAY_DEFINITIONS } from './time-of-day';
import { VISUAL_ASSET_MANIFEST } from './visual-assets';
import type { GladiatorFrameKey } from './visual-assets';

const publicRoot = join(process.cwd(), 'public');
const REQUIRED_GLADIATOR_FRAME_KEYS = [
  'map-idle',
  'map-walk',
  'map-train',
  'map-eat',
  'map-rest',
  'map-celebrate',
  'map-healing',
  'combat-idle',
  'combat-attack',
] as const satisfies readonly GladiatorFrameKey[];

function publicAssetExists(assetPath: string) {
  return existsSync(resolve(publicRoot, assetPath.replace(/^\//, '')));
}

function collectAssetPaths(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.startsWith('/assets/') ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectAssetPaths);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectAssetPaths);
  }

  return [];
}

describe('visual asset manifest', () => {
  it('references generated assets that exist in public', () => {
    const missingAssetPaths = collectAssetPaths(VISUAL_ASSET_MANIFEST).filter(
      (assetPath) => !publicAssetExists(assetPath),
    );

    expect(missingAssetPaths).toEqual([]);
  });

  it('exposes the generated baseline required by the visual migration', () => {
    expect(Object.keys(VISUAL_ASSET_MANIFEST.map.backgrounds).sort()).toEqual([
      'dawn',
      'day',
      'dusk',
      'night',
    ]);
    expect(Object.keys(VISUAL_ASSET_MANIFEST.gladiators)).toHaveLength(12);

    for (const [assetId, assetSet] of Object.entries(VISUAL_ASSET_MANIFEST.gladiators)) {
      expect(assetSet.portrait).toContain(`/assets/pixel-art/characters/gladiators/${assetId}/`);

      for (const frameKey of REQUIRED_GLADIATOR_FRAME_KEYS) {
        expect(assetSet.frames[frameKey]).toHaveLength(2);
      }
    }

    for (const buildingId of BUILDING_IDS) {
      expect(Object.keys(VISUAL_ASSET_MANIFEST.buildings[buildingId]).sort()).toEqual([
        'level-0',
        'level-1',
        'level-2',
        'level-3',
      ]);
    }
  });

  it('wires typed visual helpers to generated assets first', () => {
    const domus = getBuildingVisualDefinition('domus', 1);
    const gladiatorId = GLADIATOR_PORTRAIT_ASSET_IDS[0];
    const idleFrames = getGladiatorSpriteFrames(
      {
        portraitAssetId: gladiatorId,
        spriteAssetId: gladiatorId,
      },
      'idle',
    );

    expect(domus.exteriorAssetPath).toContain('/assets/pixel-art/buildings/domus/level-1/');
    expect(idleFrames).toHaveLength(2);
    expect(idleFrames.every((frame) => frame.includes('/assets/pixel-art/characters/'))).toBe(true);
    expect(
      getCombatSpriteFrames({ portraitAssetId: gladiatorId, spriteAssetId: gladiatorId }, 'attack'),
    ).toHaveLength(2);
    expect(
      TIME_OF_DAY_DEFINITIONS.every((definition) =>
        definition.visualTheme.mapBackgroundAssetPath?.startsWith('/assets/pixel-art/'),
      ),
    ).toBe(true);
  });

  it('wires living map ambient definitions to generated assets', () => {
    const ambientKinds = new Set(
      LUDUS_MAP_AMBIENT_ELEMENTS.map((ambientElement) => ambientElement.kind),
    );
    const missingAssetPaths = LUDUS_MAP_AMBIENT_ELEMENTS.map(
      (ambientElement) => ambientElement.assetPath,
    ).filter((assetPath) => !publicAssetExists(assetPath));

    expect(ambientKinds).toEqual(new Set(['banner', 'cloud', 'crowd', 'grass', 'smoke', 'torch']));
    expect(missingAssetPaths).toEqual([]);
  });

  it('derives visual identity deterministically from stable ids', () => {
    const firstIdentity = createGladiatorVisualIdentity('gladiator-demo-stable-id');
    const repeatedIdentity = createGladiatorVisualIdentity('gladiator-demo-stable-id');

    expect(repeatedIdentity).toEqual(firstIdentity);
    expect(GLADIATOR_PORTRAIT_ASSET_IDS).toContain(firstIdentity.portraitAssetId);
  });
});
