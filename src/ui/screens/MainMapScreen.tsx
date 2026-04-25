import { Home, Minus, Plus, Store, Swords, X } from 'lucide-react';
import { useCallback, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import type { BuildingId, GameSave } from '../../domain/types';
import {
  LUDUS_MAP_DEFINITION,
  type MapLocationDefinition,
  type MapLocationId,
  type MapPoint,
  type MapRect,
} from '../../game-data/map';
import { useUiStore } from '../../state/ui-store';

interface MainMapScreenProps {
  save: GameSave;
  onBuildingSelect(buildingId: BuildingId): void;
}

interface ViewportSize {
  width: number;
  height: number;
}

type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';

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

function getTimeOfDayPhase(hour: number): TimeOfDayPhase {
  if (hour >= 5 && hour < 8) {
    return 'dawn';
  }

  if (hour >= 8 && hour < 18) {
    return 'day';
  }

  if (hour >= 18 && hour < 21) {
    return 'dusk';
  }

  return 'night';
}

export function MainMapScreen({ save, onBuildingSelect }: MainMapScreenProps) {
  const { t } = useUiStore();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const [camera, setCamera] = useState<MapPoint>(LUDUS_MAP_DEFINITION.defaultCamera);
  const [zoom, setZoom] = useState(LUDUS_MAP_DEFINITION.defaultZoom);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<MapLocationId | null>(null);
  const selectedLocation =
    selectedLocationId === null
      ? undefined
      : LUDUS_MAP_DEFINITION.locations.find((location) => location.id === selectedLocationId);
  const timePhase = getTimeOfDayPhase(save.time.hour);

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

  const handleLocationClick = (location: MapLocationDefinition) => {
    setSelectedLocationId(location.id);

    if (location.kind === 'building') {
      onBuildingSelect(location.id);
    }
  };

  const renderLocation = (location: MapLocationDefinition) => {
    const isBuilding = location.kind === 'building';
    const building = isBuilding ? save.buildings[location.id] : null;
    const isEmptyPlot = isBuilding && building ? !building.isPurchased : false;
    const isSelected = selectedLocationId === location.id;
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
          'map-location',
          `map-location--${location.style}`,
          location.kind === 'external' ? 'map-location--external' : '',
          isEmptyPlot ? 'map-location--empty' : '',
          isSelected ? 'is-selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid={
          isBuilding ? `map-building-${location.id}` : `map-special-location-${location.id}`
        }
        key={location.id}
        style={{
          height: location.height,
          left: location.x,
          top: location.y,
          width: location.width,
        }}
        type="button"
        onClick={() => handleLocationClick(location)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="map-location__art" aria-hidden="true">
          <span className="map-location__shadow" />
          <span className="map-location__base" />
          <span className="map-location__roof" />
          <span className="map-location__props" />
        </span>
        <span className="map-location__text">
          <span className="map-location__name">{t(location.nameKey)}</span>
          <span className="map-location__badge">{badgeText}</span>
        </span>
      </button>
    );
  };

  return (
    <section className="main-map-screen" aria-labelledby="main-map-title">
      <div className="main-map-screen__header">
        <div>
          <p className="eyebrow">{t('map.eyebrow')}</p>
          <h2 id="main-map-title">{t('map.title')}</h2>
          <p>{t('map.subtitle')}</p>
        </div>
        <div className="map-controls" aria-label={t('map.controls')}>
          <button
            type="button"
            onClick={() => focusMapPoint(getRectCenter(LUDUS_MAP_DEFINITION.ludusBounds), 0.72)}
          >
            <Home aria-hidden="true" size={17} />
            <span>{t('map.focusLudus')}</span>
          </button>
          <button type="button" onClick={() => focusLocation('market')}>
            <Store aria-hidden="true" size={17} />
            <span>{t('map.focusMarket')}</span>
          </button>
          <button type="button" onClick={() => focusLocation('arena')}>
            <Swords aria-hidden="true" size={17} />
            <span>{t('map.focusArena')}</span>
          </button>
          <button
            aria-label={t('map.zoomOut')}
            type="button"
            onClick={() => changeZoom(-ZOOM_STEP)}
          >
            <Minus aria-hidden="true" size={18} />
          </button>
          <button aria-label={t('map.zoomIn')} type="button" onClick={() => changeZoom(ZOOM_STEP)}>
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <div
        aria-label={t('map.viewportLabel')}
        className={[
          'main-map-screen__viewport',
          `main-map-screen__viewport--${timePhase}`,
          isPanning ? 'is-panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid="map-container"
        ref={viewportRef}
        role="application"
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div
          className="main-map-screen__world"
          style={{
            height: LUDUS_MAP_DEFINITION.size.height,
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
            width: LUDUS_MAP_DEFINITION.size.width,
          }}
        >
          <div
            className="main-map-screen__ludus-boundary"
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
              className={['map-decoration', `map-decoration--${decoration.style}`]
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
            className="main-map-screen__paths"
            viewBox={`0 0 ${LUDUS_MAP_DEFINITION.size.width} ${LUDUS_MAP_DEFINITION.size.height}`}
          >
            {LUDUS_MAP_DEFINITION.paths.map((path) => (
              <polyline
                className={`main-map-screen__path main-map-screen__path--${path.kind}`}
                key={path.id}
                points={getPathPoints(path.points)}
              />
            ))}
          </svg>
          {LUDUS_MAP_DEFINITION.locations.map(renderLocation)}
        </div>
      </div>
      {selectedLocation ? (
        <div
          className="map-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedLocationId(null)}
        >
          <section
            aria-labelledby="map-modal-title"
            aria-modal="true"
            className="map-modal"
            data-testid="building-modal"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="map-modal__header">
              <div>
                <p className="eyebrow">{t('map.modalEyebrow')}</p>
                <h2 id="map-modal-title" data-testid="building-modal-title">
                  {t(selectedLocation.nameKey)}
                </h2>
              </div>
              <button
                aria-label={t('common.close')}
                className="map-modal__close"
                type="button"
                onClick={() => setSelectedLocationId(null)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <p>{t(selectedLocation.descriptionKey)}</p>
            <dl className="map-modal__meta">
              <div>
                <dt>{t('map.modalKind')}</dt>
                <dd>{t(`map.kind.${selectedLocation.kind}`)}</dd>
              </div>
              <div>
                <dt>{t('common.status')}</dt>
                <dd>
                  {selectedLocation.kind === 'external'
                    ? t('map.externalLocation')
                    : save.buildings[selectedLocation.id].isPurchased
                      ? t('common.purchased')
                      : t('common.notPurchased')}
                </dd>
              </div>
            </dl>
            <p className="map-modal__placeholder">{t('map.placeholderBody')}</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
