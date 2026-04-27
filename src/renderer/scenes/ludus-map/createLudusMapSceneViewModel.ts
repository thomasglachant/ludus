import { getGameMinuteStamp } from '../../../domain/gladiators/map-movement';
import type { GameSave } from '../../../domain/types';
import { getBuildingVisualDefinition } from '../../../game-data/building-visuals';
import {
  getGladiatorMapAnimationDefinition,
  getGladiatorMapAnimationDefinitionById,
} from '../../../game-data/gladiator-animations';
import { getGladiatorMapPoint } from '../../../game-data/gladiator-map-movement';
import {
  LUDUS_MAP_AMBIENT_ELEMENTS,
  LUDUS_MAP_WATER_ANIMATION,
} from '../../../game-data/map-visuals';
import { TIME_CONFIG } from '../../../game-data/time';
import { getTimeOfDayDefinition } from '../../../game-data/time-of-day';
import {
  getGladiatorMapAnimationAsset,
  getGladiatorVisualIdentity,
} from '../../../game-data/gladiator-visuals';
import { LUDUS_MAP_DEFINITION, type MapLocationId } from '../../../game-data/map-layout';
import { VISUAL_ASSET_MANIFEST } from '../../../game-data/visual-assets';
import type { LudusMapSceneViewModel } from './LudusMapSceneViewModel';

interface CreateLudusMapSceneViewModelOptions {
  reducedMotion?: boolean;
  selectedLocationId?: MapLocationId;
  translateLabel?: (key: string) => string;
}

function parseHexColor(hexColor: string) {
  return Number.parseInt(hexColor.replace('#', ''), 16);
}

function getDecorationAssetPath(style: string): string | undefined {
  const ambientAssets = VISUAL_ASSET_MANIFEST.map.ambient;

  if (style === 'oliveTree') {
    return ambientAssets['olive-tree'];
  }

  if (style === 'cypressTree') {
    return ambientAssets['cypress-tree'];
  }

  return undefined;
}

function shouldOffsetAmbientElement(kind: string): boolean {
  return kind !== 'cloud';
}

export function createLudusMapSceneViewModel(
  save: GameSave,
  options: CreateLudusMapSceneViewModelOptions = {},
): LudusMapSceneViewModel {
  const translateLabel = options.translateLabel ?? ((key: string) => key);
  const usedSlotsByBuilding = new Map<string, number>();
  const currentGameMinute = getGameMinuteStamp(save.time);
  const timeOfDay = getTimeOfDayDefinition(save.time.hour);
  const ambientSpeedMultiplier = timeOfDay.visualTheme.ambientSpeedMultiplier ?? 1;
  const reducedMotion = options.reducedMotion ?? false;

  return {
    width: LUDUS_MAP_DEFINITION.size.width,
    height: LUDUS_MAP_DEFINITION.size.height,
    timeOfDayPhase: timeOfDay.phase,
    selectedLocationId: options.selectedLocationId,
    currentGameMinute,
    gameMinutesPerRealMillisecond:
      reducedMotion || save.time.isPaused || save.time.speed === 0
        ? 0
        : (save.time.speed * TIME_CONFIG.minutesPerHour) / TIME_CONFIG.realMillisecondsPerGameHour,
    animationSpeedMultiplier: reducedMotion || save.time.isPaused ? 0 : save.time.speed,
    reducedMotion,
    defaultCamera: LUDUS_MAP_DEFINITION.defaultCamera,
    defaultZoom: LUDUS_MAP_DEFINITION.defaultZoom,
    minZoom: LUDUS_MAP_DEFINITION.minZoom,
    maxZoom: LUDUS_MAP_DEFINITION.maxZoom,
    zoomPresets: LUDUS_MAP_DEFINITION.zoomPresets,
    theme: {
      skyColor: parseHexColor(timeOfDay.visualTheme.skyColor),
      terrainColor: parseHexColor(timeOfDay.visualTheme.terrainColor),
      terrainHighlightColor: parseHexColor(timeOfDay.visualTheme.terrainHighlightColor),
      overlayColor: parseHexColor(timeOfDay.visualTheme.overlayColor),
      overlayOpacity: timeOfDay.visualTheme.overlayOpacity,
      lightColor: parseHexColor(timeOfDay.visualTheme.lightColor),
      shadowColor: parseHexColor(timeOfDay.visualTheme.shadowColor),
      spriteBrightness: timeOfDay.visualTheme.spriteBrightness,
      buildingLightOpacity: timeOfDay.visualTheme.buildingLightOpacity,
      backgroundAssetPath: timeOfDay.visualTheme.mapBackgroundAssetPath,
    },
    paths: LUDUS_MAP_DEFINITION.paths.map((path) => ({
      id: path.id,
      kind: path.kind,
      points: path.points,
    })),
    decorations: LUDUS_MAP_DEFINITION.decorations.map((decoration) => ({
      id: decoration.id,
      style: decoration.style,
      x: decoration.x,
      y: decoration.y,
      width: decoration.width,
      height: decoration.height,
      rotation: decoration.rotation ?? 0,
      assetPath: getDecorationAssetPath(decoration.style),
      sortY: decoration.y + decoration.height,
    })),
    ambientElements: LUDUS_MAP_AMBIENT_ELEMENTS.map((element) => {
      const xOffset = shouldOffsetAmbientElement(element.kind)
        ? LUDUS_MAP_DEFINITION.contentOffset.x
        : 0;
      const yOffset = shouldOffsetAmbientElement(element.kind)
        ? LUDUS_MAP_DEFINITION.contentOffset.y
        : 0;

      return {
        id: element.id,
        kind: element.kind,
        assetPath: element.assetPath,
        x: element.x + xOffset,
        y: element.y + yOffset,
        width: element.width,
        height: element.height,
        opacity:
          element.kind === 'torch'
            ? (element.opacity ?? 1) * timeOfDay.visualTheme.torchOpacity
            : element.kind === 'cloud'
              ? (element.opacity ?? 1) * (timeOfDay.visualTheme.cloudOpacity ?? 1)
              : (element.opacity ?? 1),
        rotation: element.rotation ?? 0,
        animationDelaySeconds: element.animationDelaySeconds ?? 0,
        animationDurationSeconds:
          (element.animationDurationSeconds ?? 4) / Math.max(ambientSpeedMultiplier, 0.1),
        zIndex: element.zIndex ?? 1,
      };
    }),
    waterAnimation: {
      id: LUDUS_MAP_WATER_ANIMATION.id,
      x: LUDUS_MAP_WATER_ANIMATION.x,
      y: LUDUS_MAP_WATER_ANIMATION.y,
      width: LUDUS_MAP_WATER_ANIMATION.width,
      height: LUDUS_MAP_WATER_ANIMATION.height,
      color: parseHexColor(LUDUS_MAP_WATER_ANIMATION.color),
      lineCount: LUDUS_MAP_WATER_ANIMATION.lineCount,
      lineWidth: LUDUS_MAP_WATER_ANIMATION.lineWidth,
      opacity: LUDUS_MAP_WATER_ANIMATION.opacity,
      speed: LUDUS_MAP_WATER_ANIMATION.speed,
    },
    locations: LUDUS_MAP_DEFINITION.locations.map((location) => {
      const building = location.kind === 'building' ? save.buildings[location.id] : null;
      const visual =
        location.kind === 'building'
          ? getBuildingVisualDefinition(location.id, building?.level ?? 0)
          : undefined;
      const externalVisual =
        location.kind === 'external' ? VISUAL_ASSET_MANIFEST.locations[location.id] : undefined;
      const exteriorAssetPath = visual?.exteriorAssetPath ?? location.assetPath;
      const propsAssetPath = visual?.propsAssetPath ?? externalVisual?.props;
      const roofAssetPath = visual?.roofAssetPath;
      const width = visual?.width ?? location.width;
      const height = visual?.height ?? location.height;

      return {
        id: location.id,
        mapLocationId: location.id,
        kind: location.kind,
        labelKey: location.nameKey,
        label: translateLabel(location.nameKey),
        x: location.x,
        y: location.y,
        width,
        height,
        isOwned: location.kind === 'external' || Boolean(building?.isPurchased),
        level: building?.level ?? 0,
        exteriorAssetPath,
        propsAssetPath,
        roofAssetPath,
        assetPath: exteriorAssetPath,
        hitArea: {
          x: 0,
          y: 0,
          width,
          height,
        },
        labelPosition: {
          x: location.x + width / 2,
          y: location.y + height + 32,
        },
        sortY: location.y + height,
      };
    }),
    gladiators: save.gladiators.map((gladiator) => {
      const targetLocationId =
        gladiator.mapMovement?.targetLocation ??
        gladiator.currentLocationId ??
        gladiator.currentBuildingId ??
        'domus';
      const slotIndex = usedSlotsByBuilding.get(targetLocationId) ?? 0;
      const movement = gladiator.mapMovement;
      const animation = movement
        ? getGladiatorMapAnimationDefinitionById('walk')
        : getGladiatorMapAnimationDefinition(gladiator);
      const visualIdentity = getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity);
      const animationAsset = getGladiatorMapAnimationAsset(visualIdentity, animation.id);

      usedSlotsByBuilding.set(targetLocationId, slotIndex + 1);

      return {
        id: gladiator.id,
        name: gladiator.name,
        from: getGladiatorMapPoint(movement?.currentLocation ?? targetLocationId, slotIndex),
        to: getGladiatorMapPoint(movement?.targetLocation ?? targetLocationId, slotIndex),
        movementStartedAt: movement?.movementStartedAt ?? currentGameMinute,
        movementDuration: movement?.movementDuration ?? 1,
        animation,
        animationId: animation.id,
        fallbackFramePaths: animationAsset.fallbackFramePaths,
        frameNames: animationAsset.frameNames,
        spritesheetAtlasPath: animationAsset.atlasPath,
      };
    }),
  };
}
