import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { BUILDING_IDS } from './buildings';
import { getBuildingVisualDefinition } from './building-visuals';
import { getGladiatorSpriteFrames, GLADIATOR_PORTRAIT_ASSET_IDS } from './gladiator-visuals';
import { TIME_OF_DAY_DEFINITIONS } from './time-of-day';
import { VISUAL_ASSET_MANIFEST } from './visual-assets';

const publicRoot = join(process.cwd(), 'public');

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
      TIME_OF_DAY_DEFINITIONS.every((definition) =>
        definition.visualTheme.mapBackgroundAssetPath?.startsWith('/assets/pixel-art/'),
      ),
    ).toBe(true);
  });
});
