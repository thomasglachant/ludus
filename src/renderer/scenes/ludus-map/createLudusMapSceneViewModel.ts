import { getGameMinuteStamp } from '../../../domain/gladiators/map-movement';
import type { GameSave } from '../../../domain/types';
import { getBuildingVisualDefinition } from '../../../game-data/building-visuals';
import { getGladiatorAnimationDefinition } from '../../../game-data/gladiator-animations';
import { getGladiatorMapPoint } from '../../../game-data/gladiator-map-movement';
import { LUDUS_MAP_AMBIENT_ELEMENTS } from '../../../game-data/map-visuals';
import { TIME_CONFIG } from '../../../game-data/time';
import { getTimeOfDayDefinition } from '../../../game-data/time-of-day';
import {
  getGladiatorSpriteFrames,
  getGladiatorVisualIdentity,
} from '../../../game-data/gladiator-visuals';
import { LUDUS_MAP_DEFINITION } from '../../../game-data/map-layout';
import type { LudusMapSceneViewModel } from './LudusMapSceneViewModel';

interface CreateLudusMapSceneViewModelOptions {
  reducedMotion?: boolean;
  translateLabel?: (key: string) => string;
}

function parseHexColor(hexColor: string) {
  return Number.parseInt(hexColor.replace('#', ''), 16);
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
    currentGameMinute,
    gameMinutesPerRealMillisecond:
      reducedMotion || save.time.isPaused || save.time.speed === 0
        ? 0
        : (save.time.speed * TIME_CONFIG.minutesPerHour) / TIME_CONFIG.realMillisecondsPerGameHour,
    reducedMotion,
    defaultCamera: LUDUS_MAP_DEFINITION.defaultCamera,
    defaultZoom: LUDUS_MAP_DEFINITION.defaultZoom,
    minZoom: LUDUS_MAP_DEFINITION.minZoom,
    maxZoom: LUDUS_MAP_DEFINITION.maxZoom,
    theme: {
      terrainColor: parseHexColor(timeOfDay.visualTheme.terrainColor),
      terrainHighlightColor: parseHexColor(timeOfDay.visualTheme.terrainHighlightColor),
      overlayColor: parseHexColor(timeOfDay.visualTheme.overlayColor),
      overlayOpacity: timeOfDay.visualTheme.overlayOpacity,
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
    })),
    ambientElements: LUDUS_MAP_AMBIENT_ELEMENTS.map((element) => ({
      id: element.id,
      kind: element.kind,
      assetPath: element.assetPath,
      x: element.x,
      y: element.y,
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
    })),
    locations: LUDUS_MAP_DEFINITION.locations.map((location) => {
      const building = location.kind === 'building' ? save.buildings[location.id] : null;
      const visual =
        location.kind === 'building'
          ? getBuildingVisualDefinition(location.id, building?.level ?? 0)
          : undefined;

      return {
        id: location.id,
        mapLocationId: location.id,
        kind: location.kind,
        labelKey: location.nameKey,
        label: translateLabel(location.nameKey),
        x: location.x,
        y: location.y,
        width: visual?.width ?? location.width,
        height: visual?.height ?? location.height,
        isOwned: location.kind === 'external' || Boolean(building?.isPurchased),
        level: building?.level ?? 0,
        assetPath: visual?.exteriorAssetPath ?? location.assetPath,
      };
    }),
    gladiators: save.gladiators.map((gladiator) => {
      const targetBuildingId = gladiator.currentBuildingId ?? 'domus';
      const slotIndex = usedSlotsByBuilding.get(targetBuildingId) ?? 0;
      const movement = gladiator.mapMovement;
      const animation = movement
        ? { state: 'walking' as const }
        : getGladiatorAnimationDefinition(gladiator);
      const visualIdentity = getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity);

      usedSlotsByBuilding.set(targetBuildingId, slotIndex + 1);

      return {
        id: gladiator.id,
        name: gladiator.name,
        from: getGladiatorMapPoint(movement?.currentLocation ?? targetBuildingId, slotIndex),
        to: getGladiatorMapPoint(movement?.targetLocation ?? targetBuildingId, slotIndex),
        movementStartedAt: movement?.movementStartedAt ?? currentGameMinute,
        movementDuration: movement?.movementDuration ?? 1,
        animationState: animation.state,
        spriteFrames: getGladiatorSpriteFrames(visualIdentity, animation.state),
      };
    }),
  };
}
