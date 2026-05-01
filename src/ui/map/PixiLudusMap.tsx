import { useCallback, useMemo, useState, type CSSProperties, type FocusEvent } from 'react';
import type { GameSave } from '../../domain/types';
import {
  LUDUS_MAP_DEFINITION,
  type MapLocationDefinition,
  type MapLocationId,
} from '../../game-data/map-layout';
import type { PixiSceneContext } from '../../renderer/pixi/PixiScene';
import { PixiSceneViewport } from '../../renderer/pixi/PixiSceneViewport';
import { LudusMapScene } from '../../renderer/scenes/ludus-map/LudusMapScene';
import { createLudusMapSceneViewModel } from '../../renderer/scenes/ludus-map/createLudusMapSceneViewModel';
import { useUiStore } from '../../state/ui-store-context';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface PixiLudusMapProps {
  save: GameSave;
  onLocationSelect(location: MapLocationDefinition): void;
}

function getMapLocation(locationId: MapLocationId) {
  return LUDUS_MAP_DEFINITION.locations.find((location) => location.id === locationId);
}

function formatPixiColor(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

const ACCESSIBLE_LOCATION_LIST_STYLE: CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};

const VISIBLE_LOCATION_LIST_STYLE: CSSProperties = {
  background: 'rgba(21, 17, 13, 0.92)',
  border: '1px solid rgba(241, 196, 107, 0.72)',
  borderRadius: 8,
  boxShadow: '0 16px 32px rgba(14, 9, 6, 0.32)',
  display: 'grid',
  gap: 6,
  left: 16,
  listStyle: 'none',
  margin: 0,
  maxHeight: 'min(70%, 420px)',
  maxWidth: 300,
  overflow: 'auto',
  padding: 12,
  position: 'absolute',
  top: 16,
  width: 'min(300px, calc(100% - 32px))',
  zIndex: 20,
};

const ACCESSIBLE_LOCATION_BUTTON_STYLE: CSSProperties = {
  background: 'rgba(74, 48, 29, 0.94)',
  border: '1px solid rgba(224, 177, 94, 0.58)',
  borderRadius: 6,
  color: '#f6ddb0',
  cursor: 'pointer',
  font: 'inherit',
  padding: '8px 10px',
  textAlign: 'left',
  width: '100%',
};

export function PixiLudusMap({ save, onLocationSelect }: PixiLudusMapProps) {
  const { activeModal, isPixiDebugEnabled, t } = useUiStore();
  const [isLocationListFocused, setIsLocationListFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const selectedLocationId = useMemo<MapLocationId | undefined>(() => {
    if (activeModal?.kind === 'building') {
      return activeModal.buildingId;
    }

    if (activeModal?.kind === 'market' || activeModal?.kind === 'arena') {
      return activeModal.kind;
    }

    return undefined;
  }, [activeModal]);
  const viewModel = useMemo(
    () =>
      createLudusMapSceneViewModel(save, {
        reducedMotion,
        selectedLocationId,
        translateLabel: t,
      }),
    [reducedMotion, save, selectedLocationId, t],
  );
  const selectLocation = useCallback(
    (locationId: MapLocationId) => {
      const location = getMapLocation(locationId);

      if (location) {
        onLocationSelect(location);
      }
    },
    [onLocationSelect],
  );
  const createScene = useCallback(
    (context: PixiSceneContext) =>
      new LudusMapScene(context, {
        onLocationSelect: (locationId) => selectLocation(locationId as MapLocationId),
      }),
    [selectLocation],
  );
  const hideLocationListWhenLeaving = useCallback((event: FocusEvent<HTMLUListElement>) => {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (!event.currentTarget.contains(nextTarget)) {
      setIsLocationListFocused(false);
    }
  }, []);
  const viewportStyle = {
    '--map-sky-color': formatPixiColor(viewModel.theme.skyColor),
    '--map-terrain-color': formatPixiColor(viewModel.theme.terrainColor),
    '--map-terrain-highlight-color': formatPixiColor(viewModel.theme.terrainHighlightColor),
    '--map-overlay-color': formatPixiColor(viewModel.theme.overlayColor),
    '--map-overlay-opacity': viewModel.theme.overlayOpacity,
    '--map-light-color': formatPixiColor(viewModel.theme.lightColor),
    '--map-shadow-color': formatPixiColor(viewModel.theme.shadowColor),
    '--map-sprite-brightness': viewModel.theme.spriteBrightness,
  } as CSSProperties;

  return (
    <section className="ludus-map" aria-label={t('map.viewportLabel')}>
      <div
        className={`ludus-map__viewport ludus-map__viewport--${viewModel.timeOfDayPhase}`}
        data-testid="map-container"
        data-time-of-day={viewModel.timeOfDayPhase}
        role="application"
        style={viewportStyle}
      >
        <PixiSceneViewport
          createScene={createScene}
          debugMode={isPixiDebugEnabled}
          sceneKey="ludus-map"
          sceneLabel={t('map.viewportLabel')}
          snapshot={viewModel}
        />
        <ul
          aria-label={t('map.locationAccessibility.list')}
          style={
            isLocationListFocused ? VISIBLE_LOCATION_LIST_STYLE : ACCESSIBLE_LOCATION_LIST_STYLE
          }
          onBlur={hideLocationListWhenLeaving}
          onFocus={() => setIsLocationListFocused(true)}
        >
          {viewModel.locations.map((location) => (
            <li key={location.id}>
              <button
                aria-label={location.accessibilityLabel}
                style={ACCESSIBLE_LOCATION_BUTTON_STYLE}
                type="button"
                onClick={() => selectLocation(location.mapLocationId)}
              >
                {location.accessibilityLabel}
              </button>
            </li>
          ))}
        </ul>
        {import.meta.env.MODE === 'test' ? (
          <div
            data-active-background={viewModel.theme.backgroundAssetPath}
            data-height={viewModel.height}
            data-grid={`${viewModel.grid.columns}x${viewModel.grid.rows}`}
            data-render-layers="background terrain-tiles walls selection-highlight static-props buildings-back buildings-front ambient-effects lighting-overlay light-sprites labels"
            data-selected-location={viewModel.selectedLocationId}
            data-testid="pixi-map-test-hit-zones"
            data-width={viewModel.width}
          >
            {viewModel.locations.map((location) => (
              <button
                aria-label={location.accessibilityLabel}
                data-asset={location.assetPath}
                data-exterior-asset={location.exteriorAssetPath}
                data-building-level={location.level}
                data-building-purchased={location.isOwned}
                data-building-status={location.ownershipStatus}
                data-building-label-detail={location.labelDetail}
                data-purchase-cost={location.purchaseCost}
                data-required-domus-level={location.requiredDomusLevel}
                data-hit-area={`${location.x + location.hitArea.x},${location.y + location.hitArea.y},${location.hitArea.width},${location.hitArea.height}`}
                data-props-asset={location.propsAssetPath}
                data-roof-asset={location.roofAssetPath}
                data-testid={
                  location.kind === 'building'
                    ? `map-building-${location.id}`
                    : `map-special-location-${location.id}`
                }
                key={location.id}
                type="button"
                onClick={() => selectLocation(location.mapLocationId)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
