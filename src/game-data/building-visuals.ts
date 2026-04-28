import type { BuildingId } from '../domain/buildings/types';
import { BUILDING_IDS } from './buildings';
import {
  getBuildingAssetSet,
  getPixelArtBuildingLevel,
  PIXEL_ART_BUILDING_LEVELS,
} from './visual-assets';

export interface BuildingVisualDefinition {
  buildingId: BuildingId;
  level: number;
  exteriorAssetPath: string;
  roofAssetPath?: string;
  interiorAssetPath?: string;
  propsAssetPath?: string;
  width: number;
  height: number;
}

const buildingVisualSizes: Record<BuildingId, { width: number; height: number }> = {
  domus: { width: 280, height: 190 },
  canteen: { width: 230, height: 160 },
  dormitory: { width: 250, height: 170 },
  trainingGround: { width: 300, height: 210 },
  pleasureHall: { width: 250, height: 170 },
  infirmary: { width: 240, height: 160 },
};

function createBuildingVisualDefinition(
  buildingId: BuildingId,
  level: number,
): BuildingVisualDefinition {
  const visualLevel = getPixelArtBuildingLevel(level);
  const assetSet = getBuildingAssetSet(buildingId, visualLevel);
  const fallbackSize = buildingVisualSizes[buildingId];

  if (!assetSet) {
    throw new Error(`Missing visual asset set for building ${buildingId}`);
  }

  return {
    buildingId,
    level,
    exteriorAssetPath: assetSet.exterior,
    roofAssetPath: assetSet?.roof,
    interiorAssetPath: assetSet?.interior,
    propsAssetPath: assetSet?.props,
    width: assetSet?.width ?? fallbackSize.width,
    height: assetSet?.height ?? fallbackSize.height,
  };
}

export const BUILDING_VISUAL_DEFINITIONS: BuildingVisualDefinition[] = BUILDING_IDS.flatMap(
  (buildingId) =>
    PIXEL_ART_BUILDING_LEVELS.map((level) => createBuildingVisualDefinition(buildingId, level)),
);

export function getBuildingVisualDefinition(
  buildingId: BuildingId,
  level: number,
): BuildingVisualDefinition {
  return createBuildingVisualDefinition(buildingId, level);
}
