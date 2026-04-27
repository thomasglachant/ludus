import { useMemo } from 'react';
import type { GameSave } from '../../domain/types';
import {
  LUDUS_MAP_DEFINITION,
  type MapLocationDefinition,
  type MapLocationId,
} from '../../game-data/map-layout';
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

export function PixiLudusMap({ save, onLocationSelect }: PixiLudusMapProps) {
  const { t } = useUiStore();
  const reducedMotion = usePrefersReducedMotion();
  const viewModel = useMemo(
    () => createLudusMapSceneViewModel(save, { reducedMotion, translateLabel: t }),
    [reducedMotion, save, t],
  );
  const selectLocation = (locationId: MapLocationId) => {
    const location = getMapLocation(locationId);

    if (location) {
      onLocationSelect(location);
    }
  };

  return (
    <section className="ludus-map" aria-label={t('map.viewportLabel')}>
      <div className="ludus-map__viewport" data-testid="map-container" role="application">
        <PixiSceneViewport sceneLabel={t('map.viewportLabel')}>
          <LudusMapScene
            viewModel={viewModel}
            onLocationSelect={(locationId) => selectLocation(locationId as MapLocationId)}
          />
        </PixiSceneViewport>
        {import.meta.env.MODE === 'test' ? (
          <div data-testid="pixi-map-test-hit-zones">
            {viewModel.locations.map((location) => (
              <button
                aria-label={location.label}
                data-asset={location.assetPath}
                data-building-level={location.level}
                data-building-purchased={location.isOwned}
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
