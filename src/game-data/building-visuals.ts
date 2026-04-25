import type { BuildingId } from '../domain/buildings/types';

export interface BuildingVisualDefinition {
  buildingId: BuildingId;
  level: number;
  exteriorAssetPath: string;
  roofAssetPath?: string;
  interiorAssetPath?: string;
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

const visualLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export const BUILDING_VISUAL_DEFINITIONS: BuildingVisualDefinition[] = Object.entries(
  buildingVisualSizes,
).flatMap(([buildingId, size]) =>
  visualLevels.map((level) => ({
    buildingId: buildingId as BuildingId,
    level,
    exteriorAssetPath: `/assets/buildings/${buildingId}-level-${level}.svg`,
    width: size.width,
    height: size.height,
  })),
);

export function getBuildingVisualDefinition(
  buildingId: BuildingId,
  level: number,
): BuildingVisualDefinition {
  return (
    BUILDING_VISUAL_DEFINITIONS.find(
      (definition) => definition.buildingId === buildingId && definition.level === level,
    ) ??
    BUILDING_VISUAL_DEFINITIONS.find(
      (definition) => definition.buildingId === buildingId && definition.level === 1,
    ) ??
    BUILDING_VISUAL_DEFINITIONS[0]
  );
}
