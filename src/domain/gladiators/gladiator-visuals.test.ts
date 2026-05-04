import { describe, expect, it } from 'vitest';
import {
  createGladiatorVisualIdentity,
  getGladiatorAvatarAssetPath,
  getGladiatorPortraitAssetPath,
  getGladiatorVisualIdentity,
} from '../../game-data/gladiator-visuals';
import {
  GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS,
  GLADIATOR_CLASS_VISUAL_ASSET_IDS,
} from '../../game-data/visual-assets';
import type { GladiatorSkillProfile, GladiatorVisualIdentity } from './types';
import { inferGladiatorClassId } from './skills';

describe('gladiator class visuals', () => {
  it('infers classes from dominant gladiator skills', () => {
    expect(inferGladiatorClassId({ strength: 9, agility: 4, defense: 4, life: 4 })).toBe(
      'murmillo',
    );
    expect(inferGladiatorClassId({ strength: 4, agility: 9, defense: 4, life: 4 })).toBe(
      'retiarius',
    );
    expect(inferGladiatorClassId({ strength: 4, agility: 4, defense: 9, life: 4 })).toBe('secutor');
  });

  it('keeps the existing strength priority when dominant skills tie', () => {
    expect(inferGladiatorClassId({ strength: 7, agility: 7, defense: 7, life: 7 })).toBe(
      'murmillo',
    );
  });

  it('uses one logical visual asset id for each inferred class', () => {
    const classProfiles: Record<string, GladiatorSkillProfile> = {
      murmillo: { strength: 9, agility: 4, defense: 4, life: 4 },
      retiarius: { strength: 4, agility: 9, defense: 4, life: 4 },
      secutor: { strength: 4, agility: 4, defense: 9, life: 4 },
    };
    const assetIds = Object.values(GLADIATOR_CLASS_VISUAL_ASSET_IDS);

    expect(new Set(assetIds).size).toBe(assetIds.length);

    for (const [classId, skillProfile] of Object.entries(classProfiles)) {
      const visualIdentity = createGladiatorVisualIdentity(`seed-${classId}`, { skillProfile });
      const expectedAssetId =
        GLADIATOR_CLASS_VISUAL_ASSET_IDS[classId as keyof typeof GLADIATOR_CLASS_VISUAL_ASSET_IDS];

      expect(visualIdentity.classId).toBe(classId);
      expect(visualIdentity.portraitAssetId).toBe(expectedAssetId);
      expect(visualIdentity.spriteAssetId).toBe(expectedAssetId);
    }
  });

  it('uses the class portrait asset for portrait and avatar rendering', () => {
    const visualIdentity = createGladiatorVisualIdentity('retiarius-seed', {
      skillProfile: { strength: 4, agility: 9, defense: 4, life: 4 },
    });

    expect(getGladiatorPortraitAssetPath(visualIdentity)).toBe(
      GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.retiarius,
    );
    expect(getGladiatorAvatarAssetPath(visualIdentity)).toBe(
      GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.retiarius,
    );
  });

  it('upgrades legacy seed-based identities when a skill profile is available', () => {
    const legacyVisualIdentity: GladiatorVisualIdentity = {
      portraitAssetId: 'gladiator-10',
      spriteAssetId: 'gladiator-10',
    };
    const visualIdentity = getGladiatorVisualIdentity('legacy-seed', legacyVisualIdentity, {
      skillProfile: { strength: 4, agility: 4, defense: 9, life: 4 },
    });

    expect(visualIdentity.classId).toBe('secutor');
    expect(visualIdentity.portraitAssetId).toBe(GLADIATOR_CLASS_VISUAL_ASSET_IDS.secutor);
    expect(getGladiatorPortraitAssetPath(visualIdentity)).toBe(
      GLADIATOR_CLASS_PORTRAIT_ASSET_PATHS.secutor,
    );
  });

  it('uses class assets for seed-only visual identities', () => {
    const visualIdentity = createGladiatorVisualIdentity('seed-only');

    expect(Object.values(GLADIATOR_CLASS_VISUAL_ASSET_IDS)).toContain(
      visualIdentity.portraitAssetId,
    );
    expect(getGladiatorAvatarAssetPath(visualIdentity)).toMatch(
      /^\/assets\/gladiators\/classes\/.+-avatar\.webp$/,
    );
  });
});
