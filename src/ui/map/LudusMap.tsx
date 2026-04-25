import { Home, Minus, Plus, Store, Swords } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import type { BuildingId, GameSave, Gladiator } from '../../domain/types';
import { getBuildingVisualDefinition } from '../../game-data/building-visuals';
import { getGladiatorAnimationDefinition } from '../../game-data/gladiator-animations';
import {
  LUDUS_MAP_DEFINITION,
  type MapLocationDefinition,
  type MapLocationId,
  type MapPoint,
  type MapRect,
} from '../../game-data/map-layout';
import {
  getGladiatorSpriteAssetPath,
  getGladiatorVisualIdentity,
} from '../../game-data/gladiator-visuals';
import { getTimeOfDayDefinition } from '../../game-data/time-of-day';
import { useUiStore } from '../../state/ui-store';

interface LudusMapProps {
  save: GameSave;
  selectedLocationId: MapLocationId | null;
  selectedGladiatorId?: string;
  focusGladiatorId?: string;
  onLocationSelect(location: MapLocationDefinition): void;
  onGladiatorSelect(gladiatorId: string): void;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface GladiatorPlacement extends MapPoint {
  gladiator: Gladiator;
}

const ZOOM_STEP = 0.16;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getRectCenter(rect: MapRect): MapPoint {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function getPathPoints(points: MapPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function getViewportSize(element: HTMLDivElement | null): ViewportSize | null {
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
  };
}

function constrainCamera(camera: MapPoint, zoom: number, viewport: ViewportSize | null) {
  if (!viewport || viewport.width === 0 || viewport.height === 0) {
    return camera;
  }

  const scaledWidth = LUDUS_MAP_DEFINITION.size.width * zoom;
  const scaledHeight = LUDUS_MAP_DEFINITION.size.height * zoom;
  const centeredX = (viewport.width - scaledWidth) / 2;
  const centeredY = (viewport.height - scaledHeight) / 2;

  return {
    x: scaledWidth <= viewport.width ? centeredX : clamp(camera.x, viewport.width - scaledWidth, 0),
    y:
      scaledHeight <= viewport.height
        ? centeredY
        : clamp(camera.y, viewport.height - scaledHeight, 0),
  };
}

function getGladiatorPlacements(save: GameSave): GladiatorPlacement[] {
  const usedSlotsByBuilding = new Map<BuildingId, number>();

  return save.gladiators.map((gladiator, index) => {
    const buildingId = gladiator.currentBuildingId ?? 'domus';
    const slots = LUDUS_MAP_DEFINITION.gladiatorSlots.filter(
      (slot) => slot.buildingId === buildingId,
    );
    const slotIndex = usedSlotsByBuilding.get(buildingId) ?? 0;
    const slot = slots[slotIndex % Math.max(slots.length, 1)];
    const location = LUDUS_MAP_DEFINITION.locations.find(
      (candidate) => candidate.kind === 'building' && candidate.id === buildingId,
    );
    const fallback = location ? getRectCenter(location) : { x: 1120 + index * 32, y: 830 };

    usedSlotsByBuilding.set(buildingId, slotIndex + 1);

    return {
      gladiator,
      x: slot?.x ?? fallback.x,
      y: slot?.y ?? fallback.y,
    };
  });
}

function getTimeOfDayThemeStyle(hour: number): CSSProperties {
  const definition = getTimeOfDayDefinition(hour);

  return {
    '--map-sky-color': definition.visualTheme.skyColor,
    '--map-terrain-color': definition.visualTheme.terrainColor,
    '--map-terrain-highlight-color': definition.visualTheme.terrainHighlightColor,
    '--map-overlay-color': definition.visualTheme.overlayColor,
    '--map-overlay-opacity': definition.visualTheme.overlayOpacity,
    '--map-light-color': definition.visualTheme.lightColor,
    '--map-shadow-color': definition.visualTheme.shadowColor,
    '--map-torch-opacity': definition.visualTheme.torchOpacity,
    '--map-sprite-brightness': definition.visualTheme.spriteBrightness,
  } as CSSProperties;
}

export function LudusMap({
  save,
  selectedLocationId,
  selectedGladiatorId,
  focusGladiatorId,
  onLocationSelect,
  onGladiatorSelect,
}: LudusMapProps) {
  const { t } = useUiStore();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const [camera, setCamera] = useState<MapPoint>(LUDUS_MAP_DEFINITION.defaultCamera);
  const [zoom, setZoom] = useState(LUDUS_MAP_DEFINITION.defaultZoom);
  const [isPanning, setIsPanning] = useState(false);
  const timeOfDayDefinition = getTimeOfDayDefinition(save.time.hour);
  const timePhase = timeOfDayDefinition.phase;
  const timeOfDayStyle = useMemo(() => getTimeOfDayThemeStyle(save.time.hour), [save.time.hour]);
  const gladiatorPlacements = useMemo(() => getGladiatorPlacements(save), [save]);

  const focusMapPoint = useCallback((point: MapPoint, nextZoom: number) => {
    const viewport = getViewportSize(viewportRef.current);

    if (!viewport) {
      return;
    }

    const clampedZoom = clamp(nextZoom, LUDUS_MAP_DEFINITION.minZoom, LUDUS_MAP_DEFINITION.maxZoom);
    const nextCamera = {
      x: viewport.width / 2 - point.x * clampedZoom,
      y: viewport.height / 2 - point.y * clampedZoom,
    };

    setZoom(clampedZoom);
    setCamera(constrainCamera(nextCamera, clampedZoom, viewport));
  }, []);

  const focusLocation = useCallback(
    (locationId: MapLocationId) => {
      const location = LUDUS_MAP_DEFINITION.locations.find(
        (candidate) => candidate.id === locationId,
      );

      if (!location) {
        return;
      }

      focusMapPoint(getRectCenter(location), Math.max(zoom, 0.74));
    },
    [focusMapPoint, zoom],
  );

  useEffect(() => {
    if (!focusGladiatorId) {
      return;
    }

    const placement = gladiatorPlacements.find(
      (candidate) => candidate.gladiator.id === focusGladiatorId,
    );

    if (placement) {
      focusMapPoint(placement, Math.max(zoom, 0.95));
    }
  }, [focusGladiatorId, focusMapPoint, gladiatorPlacements, zoom]);

  const changeZoom = useCallback(
    (zoomDelta: number) => {
      const viewport = getViewportSize(viewportRef.current);

      if (!viewport) {
        return;
      }

      const nextZoom = clamp(
        zoom + zoomDelta,
        LUDUS_MAP_DEFINITION.minZoom,
        LUDUS_MAP_DEFINITION.maxZoom,
      );
      const viewportCenter = {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };
      const mapPointAtCenter = {
        x: (viewportCenter.x - camera.x) / zoom,
        y: (viewportCenter.y - camera.y) / zoom,
      };
      const nextCamera = {
        x: viewportCenter.x - mapPointAtCenter.x * nextZoom,
        y: viewportCenter.y - mapPointAtCenter.y * nextZoom,
      };

      setZoom(nextZoom);
      setCamera(constrainCamera(nextCamera, nextZoom, viewport));
    },
    [camera, zoom],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();

      const viewport = {
        width: event.currentTarget.clientWidth,
        height: event.currentTarget.clientHeight,
      };
      const rect = event.currentTarget.getBoundingClientRect();
      const nextZoom = clamp(
        zoom - event.deltaY * 0.001,
        LUDUS_MAP_DEFINITION.minZoom,
        LUDUS_MAP_DEFINITION.maxZoom,
      );
      const cursor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const mapPointAtCursor = {
        x: (cursor.x - camera.x) / zoom,
        y: (cursor.y - camera.y) / zoom,
      };
      const nextCamera = {
        x: cursor.x - mapPointAtCursor.x * nextZoom,
        y: cursor.y - mapPointAtCursor.y * nextZoom,
      };

      setZoom(nextZoom);
      setCamera(constrainCamera(nextCamera, nextZoom, viewport));
    },
    [camera, zoom],
  );

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    panStateRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setIsPanning(true);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const panState = panStateRef.current;

      if (!panState || panState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - panState.lastX;
      const deltaY = event.clientY - panState.lastY;
      const viewport = {
        width: event.currentTarget.clientWidth,
        height: event.currentTarget.clientHeight,
      };

      panStateRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      setCamera((currentCamera) =>
        constrainCamera(
          {
            x: currentCamera.x + deltaX,
            y: currentCamera.y + deltaY,
          },
          zoom,
          viewport,
        ),
      );
    },
    [zoom],
  );

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (panStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panStateRef.current = null;
    setIsPanning(false);
  }, []);

  const renderLocation = (location: MapLocationDefinition) => {
    const isBuilding = location.kind === 'building';
    const building = isBuilding ? save.buildings[location.id] : null;
    const isEmptyPlot = isBuilding && building ? !building.isPurchased : false;
    const isSelected = selectedLocationId === location.id;
    const visual = isBuilding
      ? getBuildingVisualDefinition(location.id, building?.level ?? 0)
      : undefined;
    const visualAssetPath = visual?.exteriorAssetPath ?? location.assetPath;
    const badgeText =
      location.kind === 'external'
        ? t('map.externalLocation')
        : building?.isPurchased
          ? t('common.level', { level: building.level })
          : t('buildings.emptySlot');

    return (
      <button
        aria-label={t('map.openLocation', { name: t(location.nameKey) })}
        aria-pressed={isSelected}
        className={[
          'ludus-map-location',
          `ludus-map-location--${location.style}`,
          location.kind === 'external' ? 'ludus-map-location--external' : '',
          visualAssetPath ? 'ludus-map-location--asset' : '',
          isEmptyPlot ? 'ludus-map-location--empty' : '',
          isSelected ? 'is-selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-asset={visualAssetPath}
        data-testid={
          isBuilding ? `map-building-${location.id}` : `map-special-location-${location.id}`
        }
        key={location.id}
        style={{
          height: visual?.height ?? location.height,
          left: location.x,
          top: location.y,
          width: visual?.width ?? location.width,
        }}
        type="button"
        onClick={() => onLocationSelect(location)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="ludus-map-location__art" aria-hidden="true">
          {visualAssetPath ? (
            <img className="ludus-map-location__asset" src={visualAssetPath} alt="" />
          ) : null}
          <span className="ludus-map-location__shadow" />
          <span className="ludus-map-location__base" />
          <span className="ludus-map-location__roof" />
          <span className="ludus-map-location__props" />
        </span>
        <span className="ludus-map-location__label">
          <span className="ludus-map-location__name">{t(location.nameKey)}</span>
          <span className="ludus-map-location__badge">{badgeText}</span>
        </span>
      </button>
    );
  };

  return (
    <section className="ludus-map" aria-label={t('map.viewportLabel')}>
      <div className="ludus-map__controls" aria-label={t('map.controls')}>
        <button
          type="button"
          onClick={() => focusMapPoint(getRectCenter(LUDUS_MAP_DEFINITION.ludusBounds), 0.72)}
        >
          <Home aria-hidden="true" size={16} />
          <span>{t('map.focusLudus')}</span>
        </button>
        <button type="button" onClick={() => focusLocation('market')}>
          <Store aria-hidden="true" size={16} />
          <span>{t('map.focusMarket')}</span>
        </button>
        <button type="button" onClick={() => focusLocation('arena')}>
          <Swords aria-hidden="true" size={16} />
          <span>{t('map.focusArena')}</span>
        </button>
        <button aria-label={t('map.zoomOut')} type="button" onClick={() => changeZoom(-ZOOM_STEP)}>
          <Minus aria-hidden="true" size={18} />
        </button>
        <button aria-label={t('map.zoomIn')} type="button" onClick={() => changeZoom(ZOOM_STEP)}>
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <div
        className={[
          'ludus-map__viewport',
          timeOfDayDefinition.overlayClassName,
          isPanning ? 'is-panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid="map-container"
        data-time-of-day={timePhase}
        ref={viewportRef}
        role="application"
        style={timeOfDayStyle}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div
          className="ludus-map__world"
          style={{
            height: LUDUS_MAP_DEFINITION.size.height,
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
            width: LUDUS_MAP_DEFINITION.size.width,
          }}
        >
          <div
            className="ludus-map__boundary"
            aria-hidden="true"
            style={{
              height: LUDUS_MAP_DEFINITION.ludusBounds.height,
              left: LUDUS_MAP_DEFINITION.ludusBounds.x,
              top: LUDUS_MAP_DEFINITION.ludusBounds.y,
              width: LUDUS_MAP_DEFINITION.ludusBounds.width,
            }}
          />
          {LUDUS_MAP_DEFINITION.decorations.map((decoration) => (
            <span
              aria-hidden="true"
              className={['ludus-map-decoration', `ludus-map-decoration--${decoration.style}`]
                .filter(Boolean)
                .join(' ')}
              key={decoration.id}
              style={{
                height: decoration.height,
                left: decoration.x,
                top: decoration.y,
                transform: `rotate(${decoration.rotation ?? 0}deg)`,
                width: decoration.width,
              }}
            />
          ))}
          <svg
            aria-hidden="true"
            className="ludus-map__paths"
            viewBox={`0 0 ${LUDUS_MAP_DEFINITION.size.width} ${LUDUS_MAP_DEFINITION.size.height}`}
          >
            {LUDUS_MAP_DEFINITION.paths.map((path) => (
              <polyline
                className={`ludus-map__path ludus-map__path--${path.kind}`}
                key={path.id}
                points={getPathPoints(path.points)}
              />
            ))}
          </svg>
          {LUDUS_MAP_DEFINITION.locations.map(renderLocation)}
          {gladiatorPlacements.map((placement, placementIndex) => {
            const visualIdentity = getGladiatorVisualIdentity(
              placement.gladiator.id,
              placement.gladiator.visualIdentity,
            );
            const spriteAssetPath = getGladiatorSpriteAssetPath(visualIdentity);
            const animation = getGladiatorAnimationDefinition(placement.gladiator);

            return (
              <button
                aria-label={t('roster.openGladiator', { name: placement.gladiator.name })}
                className={[
                  'ludus-map-sprite',
                  animation.className,
                  selectedGladiatorId === placement.gladiator.id ? 'is-selected' : '',
                  `ludus-map-sprite--${visualIdentity.paletteId ?? 'terracotta'}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-animation-state={animation.state}
                data-sprite-asset={visualIdentity.spriteAssetId}
                key={placement.gladiator.id}
                style={
                  {
                    '--sprite-animation-delay': `${(placementIndex % 6) * -0.18}s`,
                    '--sprite-animation-duration': `${animation.durationSeconds}s`,
                    left: placement.x,
                    top: placement.y,
                  } as CSSProperties
                }
                type="button"
                onClick={() => onGladiatorSelect(placement.gladiator.id)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <span className="ludus-map-sprite__shadow" aria-hidden="true" />
                <span className="ludus-map-sprite__motion" aria-hidden="true">
                  {spriteAssetPath ? (
                    <img className="ludus-map-sprite__asset" src={spriteAssetPath} alt="" />
                  ) : null}
                  <span className="ludus-map-sprite__body" />
                </span>
                <span className="ludus-map-sprite__label">{placement.gladiator.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
