import { getGameMinuteStamp } from '../../../domain/gladiators/map-movement';
import { getPlacementCells } from '../../../domain/map/occupancy';
import type { GameSave } from '../../../domain/types';
import {
  getGladiatorMapAnimationDefinition,
  getGladiatorMapAnimationDefinitionById,
} from '../../../game-data/gladiator-animations';
import {
  getGladiatorMapEntrancePoint,
  getGladiatorMapPoint,
  getGladiatorMapRoute,
  getGladiatorMapRoutePoints,
} from '../../../game-data/gladiator-map-movement';
import { LUDUS_MAP_AMBIENT_ELEMENTS } from '../../../game-data/map-visuals';
import { TIME_CONFIG } from '../../../game-data/time';
import { getTimeOfDayDefinition } from '../../../game-data/time-of-day';
import {
  getGladiatorMapAnimationAsset,
  getGladiatorVisualIdentity,
} from '../../../game-data/gladiator-visuals';
import {
  createInitialLudusMapState,
  getLudusMapTiles,
  getMapObjectDefinitions,
  LUDUS_MAP_DEFINITION,
  type MapLocationId,
} from '../../../game-data/map-layout';
import type { LudusMapSceneViewModel } from './LudusMapSceneViewModel';

interface CreateLudusMapSceneViewModelOptions {
  reducedMotion?: boolean;
  selectedLocationId?: MapLocationId;
  translateLabel?: (key: string, params?: Record<string, string | number>) => string;
}

const LOCATION_LABEL_BOTTOM_OFFSET = 40;

function parseHexColor(hexColor: string) {
  return Number.parseInt(hexColor.replace('#', ''), 16);
}

function getDecorationAssetPath(style: string): string | undefined {
  void style;
  return undefined;
}

function shouldOffsetAmbientElement(kind: string): boolean {
  void kind;
  return true;
}

function createLocationLabelParts(
  name: string,
  level: number,
  translateLabel: (key: string, params?: Record<string, string | number>) => string,
): { label: string; labelTitle: string; labelSubtitle: string } {
  const uppercaseName = name.toLocaleUpperCase();
  const subtitle = level > 0 ? translateLabel('common.level', { level }) : '';

  return {
    label: subtitle ? `${uppercaseName} ${subtitle}` : uppercaseName,
    labelTitle: uppercaseName,
    labelSubtitle: subtitle,
  };
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
  const mapState = save.map ?? createInitialLudusMapState();
  const mapObjectDefinitions = getMapObjectDefinitions();

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
      backgroundAssetPath: undefined,
    },
    grid: {
      columns: LUDUS_MAP_DEFINITION.grid.columns,
      rows: LUDUS_MAP_DEFINITION.grid.rows,
      cellSize: LUDUS_MAP_DEFINITION.grid.cellSize,
    },
    tiles: getLudusMapTiles(mapState).map((tile) => ({
      id: tile.id,
      column: tile.coord.column,
      row: tile.coord.row,
      terrainId: tile.terrainId,
      groundId: tile.groundId,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
    })),
    walls: mapState.placements
      .filter((placement) => placement.kind === 'wall')
      .flatMap((placement) =>
        getPlacementCells(placement, mapObjectDefinitions).map((cell) => ({
          id: `${placement.id}-${cell.column}-${cell.row}`,
          column: cell.column,
          row: cell.row,
          x: cell.column * LUDUS_MAP_DEFINITION.grid.cellSize,
          y: cell.row * LUDUS_MAP_DEFINITION.grid.cellSize,
          width: LUDUS_MAP_DEFINITION.grid.cellSize,
          height: LUDUS_MAP_DEFINITION.grid.cellSize,
          sortY: (cell.row + 1) * LUDUS_MAP_DEFINITION.grid.cellSize,
        })),
      ),
    terrainZones: LUDUS_MAP_DEFINITION.terrainZones.map((zone) => ({
      id: zone.id,
      kind: zone.kind,
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height,
    })),
    paths: LUDUS_MAP_DEFINITION.paths.map((path) => ({
      id: path.id,
      kind: path.kind,
      width: path.width,
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
      isAnimated: decoration.isAnimated ?? false,
      animationDelaySeconds: decoration.animationDelaySeconds ?? 0,
      animationDurationSeconds: decoration.animationDurationSeconds ?? 7,
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
        opacity: element.opacity ?? 1,
        rotation: element.rotation ?? 0,
        animationDelaySeconds: element.animationDelaySeconds ?? 0,
        animationDurationSeconds:
          (element.animationDurationSeconds ?? 4) / Math.max(ambientSpeedMultiplier, 0.1),
        zIndex: element.zIndex ?? 1,
      };
    }),
    locations: LUDUS_MAP_DEFINITION.locations.map((location) => {
      const building = location.kind === 'building' ? save.buildings[location.id] : null;
      const width = location.width;
      const height = location.height;
      const level = building?.level ?? (location.id === 'arena' ? 1 : 0);
      const name = translateLabel(location.nameKey);
      const labelParts = createLocationLabelParts(name, level, translateLabel);

      return {
        id: location.id,
        mapLocationId: location.id,
        kind: location.kind,
        labelKey: location.nameKey,
        label: labelParts.label,
        labelTitle: labelParts.labelTitle,
        labelSubtitle: labelParts.labelSubtitle,
        labelLevel: level,
        x: location.x,
        y: location.y,
        width,
        height,
        isOwned: location.kind === 'external' || Boolean(building?.isPurchased),
        level,
        activitySlots: location.activitySlots.map((slot) => ({
          id: slot.id,
          x: slot.x,
          y: slot.y,
        })),
        entrancePosition: {
          id: `${location.id}-entrance`,
          x:
            location.entrance.column * LUDUS_MAP_DEFINITION.grid.cellSize +
            LUDUS_MAP_DEFINITION.grid.cellSize / 2,
          y:
            location.entrance.row * LUDUS_MAP_DEFINITION.grid.cellSize +
            LUDUS_MAP_DEFINITION.grid.cellSize / 2,
        },
        exteriorAssetPath: undefined,
        propsAssetPath: undefined,
        roofAssetPath: undefined,
        assetPath: undefined,
        hitArea: {
          x: 0,
          y: 0,
          width,
          height,
        },
        labelPosition: {
          x: location.x + width / 2,
          y: location.y + height - LOCATION_LABEL_BOTTOM_OFFSET,
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
      const movementRoute = movement
        ? movement.route && movement.route.length > 0
          ? movement.route
          : getGladiatorMapRoute(movement.currentLocation, movement.targetLocation, mapState)
        : undefined;
      const routePoints = getGladiatorMapRoutePoints(movementRoute);
      const fallbackFrom = movement
        ? getGladiatorMapEntrancePoint(movement.currentLocation)
        : getGladiatorMapPoint(targetLocationId, slotIndex);
      const fallbackTo = movement
        ? getGladiatorMapEntrancePoint(movement.targetLocation)
        : fallbackFrom;

      usedSlotsByBuilding.set(targetLocationId, slotIndex + 1);

      return {
        id: gladiator.id,
        name: gladiator.name,
        from: routePoints[0] ?? fallbackFrom,
        to: routePoints[routePoints.length - 1] ?? fallbackTo,
        routePoints,
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
