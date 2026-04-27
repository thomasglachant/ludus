import { useCallback, useMemo, type CSSProperties } from 'react';
import { featureFlags } from '../../config/features';
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
import { useUiStore } from '../../state/ui-store';
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

export function PixiLudusMap({ save, onLocationSelect }: PixiLudusMapProps) {
  const { activeModal, t } = useUiStore();
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
          debugMode={featureFlags.enableDebugUi}
          sceneKey="ludus-map"
          sceneLabel={t('map.viewportLabel')}
          snapshot={viewModel}
        />
        {import.meta.env.MODE === 'test' ? (
          <div
            data-active-background={viewModel.theme.backgroundAssetPath}
            data-height={viewModel.height}
            data-render-layers="background clouds terrain-overlays paths selection-highlight static-props buildings-back characters-y-sorted buildings-front ambient-effects lighting-overlay light-sprites labels"
            data-selected-location={viewModel.selectedLocationId}
            data-testid="pixi-map-test-hit-zones"
            data-width={viewModel.width}
          >
            {viewModel.locations.map((location) => (
              <button
                aria-label={location.label}
                data-asset={location.assetPath}
                data-exterior-asset={location.exteriorAssetPath}
                data-building-level={location.level}
                data-building-purchased={location.isOwned}
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
