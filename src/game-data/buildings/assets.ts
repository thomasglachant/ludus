import type { BuildingId } from '../../domain/buildings/types';
import { VISUAL_ASSET_MANIFEST, type VisualAssetSourceQuality } from '../visual-assets';

export interface BuildingAssetSet {
  sourceQuality?: VisualAssetSourceQuality;
  exterior: string;
  roof?: string;
  interior?: string;
  props?: string;
  width: number;
  height: number;
}

export function getBuildingAssetSet(buildingId: BuildingId, level: number) {
  const levelEntries = Object.entries(VISUAL_ASSET_MANIFEST.buildings[buildingId] ?? {})
    .map(([levelId, assetSet]) => ({
      assetSet,
      level: Number.parseInt(levelId.replace('level-', ''), 10),
    }))
    .filter((entry) => Number.isFinite(entry.level))
    .sort((left, right) => right.level - left.level);

  return (
    levelEntries.find((entry) => entry.level <= level)?.assetSet ?? levelEntries.at(-1)?.assetSet
  );
}
