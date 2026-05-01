import { describe, expect, it } from 'vitest';

import { BUILDING_DEFINITIONS, BUILDING_IDS } from '../../../game-data/buildings';
import { getGridCoordKey } from '../../../domain/map/occupancy';
import type { GridCoord } from '../../../domain/map/types';
import { createInitialSave } from '../../../domain/saves/create-initial-save';
import type { GameSave } from '../../../domain/types';
import {
  createInitialLudusMapState,
  getLudusMapTiles,
  LUDUS_MAP_DEFINITION,
  type MapGridRect,
  type MapLocationDefinition,
  type MapLocationId,
} from '../../../game-data/map-layout';
import { createLudusMapSceneViewModel } from './createLudusMapSceneViewModel';
import type { LudusMapSceneViewModel } from './LudusMapSceneViewModel';

const BUILDING_WALL_GAP_CELLS = 1;
const BUILDING_GAP_CELLS = 1;
const ROAD_BUILDING_GAP_CELLS = 1;

function getNeighborCoords(coord: GridCoord): GridCoord[] {
  return [
    { column: coord.column + 1, row: coord.row },
    { column: coord.column - 1, row: coord.row },
    { column: coord.column, row: coord.row + 1 },
    { column: coord.column, row: coord.row - 1 },
  ];
}

function createTestSave(): GameSave {
  return createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });
}

function translateLabel(key: string, params?: Record<string, string | number>): string {
  if (key === 'common.level') {
    return `Level ${params?.level}`;
  }

  if (key === 'map.locationStatus.constructible') {
    return 'Build site';
  }

  if (key === 'map.locationStatus.locked') {
    return 'Locked';
  }

  if (key === 'map.locationStatus.lockedDomus') {
    return `Domus ${params?.level}`;
  }

  if (key === 'map.locationDetail.available') {
    return `Cost ${params?.cost}, Domus ${params?.level}`;
  }

  if (key === 'map.locationDetail.locked') {
    return `Requires Domus ${params?.level}, cost ${params?.cost}`;
  }

  if (key === 'map.locationAccessibility.owned') {
    return `${params?.name}, level ${params?.level}`;
  }

  if (key === 'map.locationAccessibility.external') {
    return `${params?.name}, external location`;
  }

  if (key === 'map.locationAccessibility.available') {
    return `${params?.name}, build site. Cost ${params?.cost}. Requires Domus ${params?.level}.`;
  }

  if (key === 'map.locationAccessibility.locked') {
    return `${params?.name}, locked. Cost ${params?.cost}. Requires Domus ${params?.level}.`;
  }

  return key;
}

function createViewModel(save: GameSave): LudusMapSceneViewModel {
  return createLudusMapSceneViewModel(save, { translateLabel });
}

function findLocation(viewModel: LudusMapSceneViewModel, id: MapLocationId) {
  const location = viewModel.locations.find((candidate) => candidate.id === id);

  if (!location) {
    throw new Error(`Missing map location ${id}`);
  }

  return location;
}

function findMapLocation(id: MapLocationId): MapLocationDefinition {
  const location = LUDUS_MAP_DEFINITION.locations.find((candidate) => candidate.id === id);

  if (!location) {
    throw new Error(`Missing map location ${id}`);
  }

  return location;
}

function getCompoundGrid(): MapGridRect {
  const zone = LUDUS_MAP_DEFINITION.terrainZones.find(
    (candidate) => candidate.id === 'ludus-compound',
  );

  if (!zone) {
    throw new Error('Missing ludus compound terrain zone');
  }

  return zone.grid;
}

function expandRect(rect: MapGridRect, cells: number): MapGridRect {
  return {
    column: rect.column - cells,
    row: rect.row - cells,
    columns: rect.columns + cells * 2,
    rows: rect.rows + cells * 2,
  };
}

function rectsOverlap(left: MapGridRect, right: MapGridRect): boolean {
  return (
    left.column < right.column + right.columns &&
    left.column + left.columns > right.column &&
    left.row < right.row + right.rows &&
    left.row + left.rows > right.row
  );
}

function isCoordInGridRect(coord: GridCoord, rect: MapGridRect): boolean {
  return (
    coord.column >= rect.column &&
    coord.column < rect.column + rect.columns &&
    coord.row >= rect.row &&
    coord.row < rect.row + rect.rows
  );
}

function getPlacementCoords(kind: 'building' | 'road' | 'wall'): GridCoord[] {
  return createInitialLudusMapState()
    .placements.filter((placement) => placement.kind === kind)
    .map((placement) => placement.origin);
}

function getReachableRoadKeys(start: GridCoord, roadKeys: Set<string>): Set<string> {
  const reachableKeys = new Set<string>();
  const queue = [start];

  while (queue.length > 0) {
    const coord = queue.shift();

    if (!coord) {
      continue;
    }

    const key = getGridCoordKey(coord);

    if (reachableKeys.has(key) || !roadKeys.has(key)) {
      continue;
    }

    reachableKeys.add(key);

    queue.push(
      { column: coord.column + 1, row: coord.row },
      { column: coord.column - 1, row: coord.row },
      { column: coord.column, row: coord.row + 1 },
      { column: coord.column, row: coord.row - 1 },
    );
  }

  return reachableKeys;
}

describe('createLudusMapSceneViewModel', () => {
  it('marks starting buildings and external locations as owned', () => {
    const viewModel = createViewModel(createTestSave());

    expect(findLocation(viewModel, 'domus')).toMatchObject({
      isOwned: true,
      ownershipStatus: 'owned',
      level: 1,
      labelSubtitle: 'Level 1',
      accessibilityLabel: 'buildings.domus.name, level 1',
    });
    expect(findLocation(viewModel, 'trainingGround')).toMatchObject({
      isOwned: true,
      ownershipStatus: 'owned',
      level: 1,
      labelSubtitle: 'Level 1',
    });
    expect(findLocation(viewModel, 'market')).toMatchObject({
      isOwned: true,
      ownershipStatus: 'owned',
      level: 0,
      labelSubtitle: '',
      accessibilityLabel: 'map.locations.market.name, external location',
    });
    expect(findLocation(viewModel, 'arena')).toMatchObject({
      isOwned: true,
      ownershipStatus: 'owned',
      level: 1,
      labelSubtitle: 'Level 1',
    });
  });

  it('uses the saved week state to select the visual time of day', () => {
    const save = createTestSave();
    save.time.dayOfWeek = 'saturday';
    save.time.phase = 'planning';

    const viewModel = createViewModel(save);

    expect(viewModel.timeOfDayPhase).toBe('dusk');
    expect(viewModel.theme.overlayOpacity).toBe(0.28);
  });

  it('marks unpurchased buildings as available when the Domus requirement is met', () => {
    const save = createTestSave();
    save.buildings.domus.level = 2;

    const farm = findLocation(createViewModel(save), 'farm');

    expect(farm).toMatchObject({
      isOwned: false,
      ownershipStatus: 'available',
      purchaseCost: 300,
      requiredDomusLevel: 2,
      labelSubtitle: 'Build site',
      labelDetail: 'Cost 300, Domus 2',
      accessibilityLabel: 'buildings.farm.name, build site. Cost 300. Requires Domus 2.',
    });
  });

  it('marks unpurchased buildings as locked when the Domus requirement is not met', () => {
    const viewModel = createViewModel(createTestSave());

    expect(findLocation(viewModel, 'farm')).toMatchObject({
      isOwned: false,
      ownershipStatus: 'locked',
      purchaseCost: 300,
      requiredDomusLevel: 2,
      labelSubtitle: 'Locked',
      labelDetail: 'Requires Domus 2, cost 300',
      accessibilityLabel: 'buildings.farm.name, locked. Cost 300. Requires Domus 2.',
    });
    expect(findLocation(viewModel, 'bookmakerOffice')).toMatchObject({
      isOwned: false,
      ownershipStatus: 'locked',
      purchaseCost: 650,
      requiredDomusLevel: 4,
      labelSubtitle: 'Locked',
      labelDetail: 'Requires Domus 4, cost 650',
    });
  });

  it('keeps buildable and locked map locations visible without gladiators', () => {
    const save = createTestSave();
    save.gladiators = [];
    save.buildings.domus.level = 2;

    const viewModel = createViewModel(save);
    const availableLocations = viewModel.locations.filter(
      (location) => location.ownershipStatus === 'available',
    );
    const lockedLocations = viewModel.locations.filter(
      (location) => location.ownershipStatus === 'locked',
    );

    expect(availableLocations.length).toBeGreaterThan(0);
    expect(lockedLocations.length).toBeGreaterThan(0);
    expect(availableLocations.every((location) => location.kind === 'building')).toBe(true);
    expect(lockedLocations.every((location) => location.kind === 'building')).toBe(true);
    expect([...availableLocations, ...lockedLocations].every((location) => !location.isOwned)).toBe(
      true,
    );
    expect(findLocation(viewModel, 'farm')).toMatchObject({
      ownershipStatus: 'available',
      labelSubtitle: 'Build site',
    });
    expect(findLocation(viewModel, 'bookmakerOffice')).toMatchObject({
      ownershipStatus: 'locked',
      labelSubtitle: 'Locked',
    });
  });

  it('uses final map sprites for owned buildings and external locations only', () => {
    const viewModel = createViewModel(createTestSave());

    expect(findLocation(viewModel, 'domus').exteriorAssetPath).toBe(
      '/assets/generated/map/buildings/domus.png',
    );
    expect(findLocation(viewModel, 'trainingGround').exteriorAssetPath).toBe(
      '/assets/generated/map/buildings/trainingGround.png',
    );
    expect(findLocation(viewModel, 'market').exteriorAssetPath).toBe(
      '/assets/generated/map/buildings/market.png',
    );
    expect(findLocation(viewModel, 'arena').exteriorAssetPath).toBe(
      '/assets/generated/map/buildings/arena.png',
    );
    expect(findLocation(viewModel, 'farm').exteriorAssetPath).toBeUndefined();
  });

  it('places every ludus building inside the stone compound with required clearance', () => {
    const compound = getCompoundGrid();
    const buildingLocations = LUDUS_MAP_DEFINITION.locations.filter(
      (location) => location.kind === 'building',
    );
    const buildingIds = new Set(buildingLocations.map((location) => location.id));
    const wallRight = compound.column + compound.columns - 1;
    const wallBottom = compound.row + compound.rows - 1;

    expect(buildingLocations).toHaveLength(BUILDING_IDS.length);
    expect(BUILDING_IDS.every((buildingId) => buildingIds.has(buildingId))).toBe(true);

    for (const location of buildingLocations) {
      expect(location.grid.column).toBeGreaterThanOrEqual(
        compound.column + BUILDING_WALL_GAP_CELLS + 1,
      );
      expect(location.grid.row).toBeGreaterThanOrEqual(compound.row + BUILDING_WALL_GAP_CELLS + 1);
      expect(location.grid.column + location.grid.columns - 1).toBeLessThanOrEqual(
        wallRight - BUILDING_WALL_GAP_CELLS - 1,
      );
      expect(location.grid.row + location.grid.rows - 1).toBeLessThanOrEqual(
        wallBottom - BUILDING_WALL_GAP_CELLS - 1,
      );
    }
  });

  it('keeps buildings at least one cell apart', () => {
    const buildingLocations = LUDUS_MAP_DEFINITION.locations.filter(
      (location) => location.kind === 'building',
    );

    for (let leftIndex = 0; leftIndex < buildingLocations.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < buildingLocations.length; rightIndex += 1) {
        const left = buildingLocations[leftIndex];
        const right = buildingLocations[rightIndex];

        expect(rectsOverlap(expandRect(left.grid, BUILDING_GAP_CELLS), right.grid)).toBe(false);
      }
    }
  });

  it('keeps the complete map ten cells below the lowest building footprint', () => {
    const lowestBuildingRow = Math.max(
      ...LUDUS_MAP_DEFINITION.locations.map(
        (location) => location.grid.row + location.grid.rows - 1,
      ),
    );

    expect(LUDUS_MAP_DEFINITION.grid.rows - 1 - lowestBuildingRow).toBe(10);
  });

  it('keeps the stone compound as tight as possible around interior elements', () => {
    const compound = getCompoundGrid();
    const buildingLocations = LUDUS_MAP_DEFINITION.locations.filter(
      (location) => location.kind === 'building',
    );
    const roadCoords = getPlacementCoords('road');
    const bottom = compound.row + compound.rows - 1;
    const gateColumns = new Set(
      roadCoords.filter((coord) => coord.row === bottom).map((coord) => coord.column),
    );
    const internalNonGateRoadRows = roadCoords
      .filter(
        (coord) =>
          isCoordInGridRect(coord, compound) &&
          coord.row < bottom &&
          !gateColumns.has(coord.column),
      )
      .map((coord) => coord.row);
    const leftmostBuildingColumn = Math.min(
      ...buildingLocations.map((location) => location.grid.column),
    );
    const rightmostBuildingColumn = Math.max(
      ...buildingLocations.map((location) => location.grid.column + location.grid.columns - 1),
    );
    const topmostBuildingRow = Math.min(...buildingLocations.map((location) => location.grid.row));
    const lowestInteriorRoadRow = Math.max(...internalNonGateRoadRows);

    expect(compound.column).toBe(leftmostBuildingColumn - 2);
    expect(compound.row).toBe(topmostBuildingRow - 2);
    expect(compound.column + compound.columns - 1).toBe(rightmostBuildingColumn + 2);
    expect(bottom).toBe(lowestInteriorRoadRow + 2);
  });

  it('surrounds the ludus with a rectangular stone wall and leaves a two-cell bottom gate open', () => {
    const compound = getCompoundGrid();
    const left = compound.column;
    const bottom = compound.row + compound.rows - 1;
    const right = compound.column + compound.columns - 1;
    const roadCoords = getPlacementCoords('road');
    const roadKeys = new Set(roadCoords.map(getGridCoordKey));
    const wallCoords = getPlacementCoords('wall');
    const wallKeys = new Set(wallCoords.map(getGridCoordKey));
    const gateRoads = roadCoords
      .filter(
        (coord) => coord.row === bottom && coord.column >= compound.column && coord.column <= right,
      )
      .sort((left, rightCoord) => left.column - rightCoord.column);
    const gateColumns = gateRoads.map((coord) => coord.column);

    expect(gateRoads).toHaveLength(2);
    expect(gateColumns[1] - gateColumns[0]).toBe(1);

    for (const wallCoord of wallCoords) {
      const isOnRectangle =
        wallCoord.column === left ||
        wallCoord.column === right ||
        wallCoord.row === compound.row ||
        wallCoord.row === bottom;

      expect(isOnRectangle).toBe(true);
    }

    for (let row = bottom; row < LUDUS_MAP_DEFINITION.grid.rows; row += 1) {
      for (const column of gateColumns) {
        const passageKey = getGridCoordKey({ column, row });

        expect(roadKeys.has(passageKey)).toBe(true);
        expect(wallKeys.has(passageKey)).toBe(false);
      }
    }

    for (let column = compound.column; column <= right; column += 1) {
      const topKey = getGridCoordKey({ column, row: compound.row });
      const bottomKey = getGridCoordKey({ column, row: bottom });

      expect(wallKeys.has(topKey)).toBe(true);

      if (gateColumns.includes(column)) {
        expect(wallKeys.has(bottomKey)).toBe(false);
        expect(roadKeys.has(bottomKey)).toBe(true);
      } else {
        expect(wallKeys.has(bottomKey)).toBe(true);
      }
    }

    for (let row = compound.row + 1; row < bottom; row += 1) {
      expect(wallKeys.has(getGridCoordKey({ column: compound.column, row }))).toBe(true);
      expect(wallKeys.has(getGridCoordKey({ column: right, row }))).toBe(true);
    }
  });

  it('keeps roads away from stone walls except for the two-cell gate passage', () => {
    const compound = getCompoundGrid();
    const bottom = compound.row + compound.rows - 1;
    const roadCoords = getPlacementCoords('road');
    const wallCoords = getPlacementCoords('wall');
    const wallKeys = new Set(wallCoords.map(getGridCoordKey));
    const gateRoads = roadCoords.filter((coord) => coord.row === bottom);
    const gateColumns = new Set(gateRoads.map((coord) => coord.column));

    for (const roadCoord of roadCoords) {
      const isGatePassageRoad = roadCoord.row === bottom && gateColumns.has(roadCoord.column);

      for (const neighborCoord of getNeighborCoords(roadCoord)) {
        const touchesWall = wallKeys.has(getGridCoordKey(neighborCoord));

        if (!touchesWall) {
          continue;
        }

        expect(isGatePassageRoad).toBe(true);
      }
    }
  });

  it('keeps the compound floor sandy and marks roads separately', () => {
    const compound = getCompoundGrid();
    const tiles = getLudusMapTiles(createInitialLudusMapState());

    for (const tile of tiles) {
      if (!isCoordInGridRect(tile.coord, compound)) {
        continue;
      }

      expect(tile.terrainId).toBe('compoundDirt');
      expect(['courtyard', 'packedRoad']).toContain(tile.groundId);
    }
  });

  it('connects every downward-facing door to the bottom entrance road', () => {
    const compound = getCompoundGrid();
    const bottom = compound.row + compound.rows - 1;
    const roadCoords = getPlacementCoords('road');
    const roadKeys = new Set(roadCoords.map(getGridCoordKey));
    const gateRoad = roadCoords.find((coord) => coord.row === bottom);

    if (!gateRoad) {
      throw new Error('Missing bottom gate road');
    }

    const reachableRoadKeys = getReachableRoadKeys(gateRoad, roadKeys);

    for (const location of LUDUS_MAP_DEFINITION.locations) {
      expect(location.entrance.row).toBe(location.grid.row + location.grid.rows);
      expect(location.entrance.column).toBeGreaterThanOrEqual(location.grid.column);
      expect(location.entrance.column).toBeLessThan(location.grid.column + location.grid.columns);
      expect(roadKeys.has(getGridCoordKey(location.entrance))).toBe(true);
      expect(reachableRoadKeys.has(getGridCoordKey(location.entrance))).toBe(true);
    }
  });

  it('keeps roads one cell away from buildings except at doors', () => {
    const roadCoords = getPlacementCoords('road');

    for (const location of LUDUS_MAP_DEFINITION.locations) {
      const doorKey = getGridCoordKey(location.entrance);
      const nearBuildingRect = expandRect(location.grid, ROAD_BUILDING_GAP_CELLS);

      for (const roadCoord of roadCoords) {
        if (!isCoordInGridRect(roadCoord, nearBuildingRect)) {
          continue;
        }

        expect(getGridCoordKey(roadCoord)).toBe(doorKey);
      }
    }
  });

  it('keeps the market and arena outside the compound and tied to a branch before the gate', () => {
    const compound = getCompoundGrid();
    const bottom = compound.row + compound.rows - 1;
    const right = compound.column + compound.columns - 1;
    const roadCoords = getPlacementCoords('road');
    const roadKeys = new Set(roadCoords.map(getGridCoordKey));
    const externalLocations = [findMapLocation('market'), findMapLocation('arena')];
    const gateRoads = roadCoords.filter(
      (coord) => coord.row === bottom && coord.column >= compound.column && coord.column <= right,
    );
    const gateColumns = new Set(gateRoads.map((coord) => coord.column));
    const hasExteriorBranch = roadCoords.some((coord) => {
      if (coord.row <= bottom || !gateColumns.has(coord.column)) {
        return false;
      }

      const leftKey = getGridCoordKey({ column: coord.column - 1, row: coord.row });
      const rightKey = getGridCoordKey({ column: coord.column + 1, row: coord.row });

      return roadKeys.has(leftKey) || roadKeys.has(rightKey);
    });

    for (const location of externalLocations) {
      expect(rectsOverlap(location.grid, compound)).toBe(false);
    }

    expect(hasExteriorBranch).toBe(true);
  });

  it('keeps the requested entrance, central Domus and back-row building order', () => {
    const compound = getCompoundGrid();
    const guardBarracks = findMapLocation('guardBarracks');
    const canteen = findMapLocation('canteen');
    const dormitory = findMapLocation('dormitory');
    const infirmary = findMapLocation('infirmary');
    const trainingGround = findMapLocation('trainingGround');
    const domus = findMapLocation('domus');
    const compoundCenter = {
      column: compound.column + compound.columns / 2,
      row: compound.row + compound.rows / 2,
    };
    const domusCenter = {
      column: domus.grid.column + domus.grid.columns / 2,
      row: domus.grid.row + domus.grid.rows / 2,
    };
    const bottom = compound.row + compound.rows - 1;
    const entranceRowLocations = [guardBarracks];
    const baseRowLocations = [dormitory, canteen, trainingGround, infirmary];
    const baseDoorRow = trainingGround.entrance.row;
    const domusLevelTwoRows = BUILDING_IDS.filter(
      (buildingId) => BUILDING_DEFINITIONS[buildingId].levels[0].requiredDomusLevel === 2,
    ).map((buildingId) => findMapLocation(buildingId).grid.row);
    const firstExpansionRow = Math.min(...domusLevelTwoRows);

    expect(Math.abs(domusCenter.column - compoundCenter.column)).toBeLessThanOrEqual(6);
    expect(Math.abs(domusCenter.row - compoundCenter.row)).toBeLessThanOrEqual(3);
    expect(domus.grid.row).toBeLessThan(trainingGround.grid.row);
    expect(bottom - (guardBarracks.grid.row + guardBarracks.grid.rows - 1)).toBeLessThanOrEqual(4);

    for (const location of baseRowLocations) {
      expect(location.entrance.row).toBe(baseDoorRow);
      expect(location.grid.row).toBeLessThan(guardBarracks.grid.row);
    }

    expect(dormitory.grid.column).toBeLessThan(canteen.grid.column);
    expect(canteen.grid.column).toBeLessThan(trainingGround.grid.column);
    expect(trainingGround.grid.column).toBeLessThan(infirmary.grid.column);

    for (const buildingId of BUILDING_IDS) {
      const requiredDomusLevel = BUILDING_DEFINITIONS[buildingId].levels[0].requiredDomusLevel;
      const location = findMapLocation(buildingId);

      if (!entranceRowLocations.some((rowLocation) => rowLocation.id === buildingId)) {
        expect(location.grid.row).toBeLessThan(guardBarracks.grid.row);
      }

      if (requiredDomusLevel < 3) {
        continue;
      }

      expect(location.grid.row).toBeLessThan(firstExpansionRow);
    }
  });
});
