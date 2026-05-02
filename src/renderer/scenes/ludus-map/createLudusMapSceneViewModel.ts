import { getBuildingPurchaseAvailability } from '../../../domain/buildings/building-unlocks';
import { getPlacementCells } from '../../../domain/map/occupancy';
import { resolveMapTimeOfDayPhase } from '../../../domain/time/time-of-day-visuals';
import type { BuildingId, GameSave } from '../../../domain/types';
import { LUDUS_MAP_AMBIENT_ELEMENTS } from '../../../game-data/map-visuals';
import { LUDUS_MAP_TEXTURE_ASSET_PATHS } from '../../../game-data/map-textures';
import { getTimeOfDayDefinition } from '../../../game-data/time-of-day';
import {
  createInitialLudusMapState,
  getLudusMapTiles,
  getMapObjectDefinitions,
  LUDUS_MAP_DEFINITION,
  LUDUS_MAP_STATE_SCHEMA_VERSION,
  type MapLocationId,
} from '../../../game-data/map-layout';
import {
  getBuildingAssetSet,
  getMapLocationAssetPath,
  type VisualLocationId,
} from '../../../game-data/visual-assets';
import type {
  LudusMapSceneOwnershipStatus,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';

interface CreateLudusMapSceneViewModelOptions {
  reducedMotion?: boolean;
  selectedLocationId?: MapLocationId;
  translateLabel?: (key: string, params?: Record<string, string | number>) => string;
}

const LOCATION_LABEL_BOTTOM_OFFSET = 40;
const EXTERNAL_MAP_LOCATION_IDS = new Set<VisualLocationId>(['arena', 'market']);

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

function resolveRenderableMapState(save: GameSave) {
  if (
    save.map.schemaVersion === LUDUS_MAP_STATE_SCHEMA_VERSION &&
    save.map.gridId === LUDUS_MAP_DEFINITION.id
  ) {
    return save.map;
  }

  return createInitialLudusMapState();
}

function getLocationExteriorAssetPath(
  locationId: MapLocationId,
  kind: 'building' | 'external',
  ownershipStatus: LudusMapSceneOwnershipStatus,
  level: number,
): string | undefined {
  if (kind === 'external') {
    return EXTERNAL_MAP_LOCATION_IDS.has(locationId as VisualLocationId)
      ? getMapLocationAssetPath(locationId as VisualLocationId)
      : undefined;
  }

  if (ownershipStatus !== 'owned') {
    return undefined;
  }

  return getBuildingAssetSet(locationId as BuildingId, level)?.exterior;
}

function createLocationLabelParts(
  name: string,
  kind: 'building' | 'external',
  level: number,
  ownershipStatus: LudusMapSceneOwnershipStatus,
  purchaseCost: number | undefined,
  requiredDomusLevel: number | undefined,
  translateLabel: (key: string, params?: Record<string, string | number>) => string,
): {
  accessibilityLabel: string;
  label: string;
  labelDetail: string;
  labelTitle: string;
  labelSubtitle: string;
} {
  const uppercaseName = name.toLocaleUpperCase();
  const hasConstructionDetails = purchaseCost !== undefined && requiredDomusLevel !== undefined;
  const subtitle =
    ownershipStatus === 'available'
      ? translateLabel('map.locationStatus.constructible')
      : ownershipStatus === 'locked' && requiredDomusLevel
        ? translateLabel('map.locationStatus.locked')
        : level > 0
          ? translateLabel('common.level', { level })
          : '';
  const labelDetail =
    ownershipStatus === 'available' && hasConstructionDetails
      ? translateLabel('map.locationDetail.available', {
          cost: purchaseCost,
          level: requiredDomusLevel,
        })
      : ownershipStatus === 'locked' && hasConstructionDetails
        ? translateLabel('map.locationDetail.locked', {
            cost: purchaseCost,
            level: requiredDomusLevel,
          })
        : '';
  const accessibilityLabel =
    kind === 'external'
      ? translateLabel('map.locationAccessibility.external', { name })
      : ownershipStatus === 'available' && hasConstructionDetails
        ? translateLabel('map.locationAccessibility.available', {
            cost: purchaseCost,
            level: requiredDomusLevel,
            name,
          })
        : ownershipStatus === 'locked' && hasConstructionDetails
          ? translateLabel('map.locationAccessibility.locked', {
              cost: purchaseCost,
              level: requiredDomusLevel,
              name,
            })
          : translateLabel('map.locationAccessibility.owned', { level, name });

  return {
    accessibilityLabel,
    label: [uppercaseName, subtitle, labelDetail].filter(Boolean).join(' '),
    labelDetail,
    labelTitle: uppercaseName,
    labelSubtitle: subtitle,
  };
}

export function createLudusMapSceneViewModel(
  save: GameSave,
  options: CreateLudusMapSceneViewModelOptions = {},
): LudusMapSceneViewModel {
  const translateLabel = options.translateLabel ?? ((key: string) => key);
  const timeOfDay = getTimeOfDayDefinition(resolveMapTimeOfDayPhase(save.time));
  const reducedMotion = options.reducedMotion ?? false;
  const mapState = resolveRenderableMapState(save);
  const mapObjectDefinitions = getMapObjectDefinitions();

  return {
    width: LUDUS_MAP_DEFINITION.size.width,
    height: LUDUS_MAP_DEFINITION.size.height,
    timeOfDayPhase: timeOfDay.phase,
    selectedLocationId: options.selectedLocationId,
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
    textures: LUDUS_MAP_TEXTURE_ASSET_PATHS,
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
        animationDurationSeconds: element.animationDurationSeconds ?? 4,
        zIndex: element.zIndex ?? 1,
      };
    }),
    locations: LUDUS_MAP_DEFINITION.locations.flatMap((location) => {
      const building = location.kind === 'building' ? save.buildings[location.id] : null;
      const purchaseAvailability =
        location.kind === 'building'
          ? getBuildingPurchaseAvailability(save, location.id)
          : undefined;

      if (location.kind === 'building' && purchaseAvailability?.status !== 'purchased') {
        return [];
      }

      const ownershipStatus: LudusMapSceneOwnershipStatus =
        location.kind === 'external' || purchaseAvailability?.status === 'purchased'
          ? 'owned'
          : (purchaseAvailability?.status ?? 'locked');
      const width = location.width;
      const height = location.height;
      const level = building?.level ?? (location.id === 'arena' ? 1 : 0);
      const name = translateLabel(location.nameKey);
      const labelParts = createLocationLabelParts(
        name,
        location.kind,
        level,
        ownershipStatus,
        purchaseAvailability?.purchaseCost,
        purchaseAvailability?.requiredDomusLevel,
        translateLabel,
      );
      const exteriorAssetPath = getLocationExteriorAssetPath(
        location.id,
        location.kind,
        ownershipStatus,
        level,
      );

      return [
        {
          id: location.id,
          mapLocationId: location.id,
          kind: location.kind,
          labelKey: location.nameKey,
          label: labelParts.label,
          labelTitle: labelParts.labelTitle,
          labelSubtitle: labelParts.labelSubtitle,
          labelDetail: labelParts.labelDetail,
          accessibilityLabel: labelParts.accessibilityLabel,
          labelLevel: level,
          x: location.x,
          y: location.y,
          width,
          height,
          isOwned: location.kind === 'external' || Boolean(purchaseAvailability?.isPurchased),
          ownershipStatus,
          level,
          purchaseCost: purchaseAvailability?.purchaseCost,
          requiredDomusLevel: purchaseAvailability?.requiredDomusLevel,
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
          exteriorAssetPath,
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
        },
      ];
    }),
  };
}
