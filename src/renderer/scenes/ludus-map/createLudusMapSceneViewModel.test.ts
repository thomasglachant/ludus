import { describe, expect, it } from 'vitest';
import { demoEarlyLudus } from '../../../game-data/demo-saves/demo-early-ludus';
import { LUDUS_MAP_DEFINITION } from '../../../game-data/map-layout';
import { createLudusMapSceneViewModel } from './createLudusMapSceneViewModel';

describe('createLudusMapSceneViewModel', () => {
  it('creates serializable map scene props from save and game-data', () => {
    const viewModel = createLudusMapSceneViewModel(demoEarlyLudus.save);

    expect(viewModel).toEqual(JSON.parse(JSON.stringify(viewModel)));
    expect(viewModel.width).toBe(LUDUS_MAP_DEFINITION.size.width);
    expect(viewModel.height).toBe(LUDUS_MAP_DEFINITION.size.height);
    expect(viewModel.defaultCamera).toEqual(LUDUS_MAP_DEFINITION.defaultCamera);
    expect(viewModel.defaultZoom).toBe(LUDUS_MAP_DEFINITION.defaultZoom);
    expect(viewModel.minZoom).toBe(LUDUS_MAP_DEFINITION.minZoom);
    expect(viewModel.maxZoom).toBe(LUDUS_MAP_DEFINITION.maxZoom);
    expect(viewModel.currentGameMinute).toBeTypeOf('number');
    expect(viewModel.reducedMotion).toBe(false);
    expect(viewModel.theme.backgroundAssetPath).toContain('/assets/pixel-art/map/backgrounds/');
    expect(viewModel.paths.map((path) => path.id)).toEqual(
      LUDUS_MAP_DEFINITION.paths.map((path) => path.id),
    );
    expect(viewModel.decorations.map((decoration) => decoration.id)).toEqual(
      LUDUS_MAP_DEFINITION.decorations.map((decoration) => decoration.id),
    );
    expect(viewModel.ambientElements.length).toBeGreaterThan(0);
    expect(viewModel.gladiators).toHaveLength(3);
    expect(viewModel.gladiators[0]).toMatchObject({
      id: 'glad-demo-early-marcus',
      animationState: 'training',
    });
    expect(viewModel.gladiators[0].spriteFrames.length).toBeGreaterThan(0);
    expect(viewModel.locations.map((location) => location.id)).toEqual([
      'domus',
      'canteen',
      'dormitory',
      'trainingGround',
      'pleasureHall',
      'infirmary',
      'market',
      'arena',
    ]);
    expect(viewModel.locations.find((location) => location.id === 'domus')).toMatchObject({
      isOwned: true,
      level: 3,
    });
    expect(viewModel.locations.find((location) => location.id === 'market')).toMatchObject({
      kind: 'external',
      isOwned: true,
    });
  });

  it('exposes movement intent for Pixi interpolation without store access', () => {
    const viewModel = createLudusMapSceneViewModel({
      ...demoEarlyLudus.save,
      gladiators: [
        {
          ...demoEarlyLudus.save.gladiators[0],
          currentBuildingId: 'trainingGround',
          mapMovement: {
            currentLocation: 'dormitory',
            targetLocation: 'trainingGround',
            activity: 'trainAgility',
            movementStartedAt: 40,
            movementDuration: 20,
          },
        },
      ],
    });

    expect(viewModel.gladiators[0]).toMatchObject({
      animationState: 'walking',
      movementStartedAt: 40,
      movementDuration: 20,
    });
    expect(viewModel.gladiators[0].from).not.toEqual(viewModel.gladiators[0].to);
  });

  it('reduces visual animation speed when reduced motion is requested', () => {
    const viewModel = createLudusMapSceneViewModel(demoEarlyLudus.save, {
      reducedMotion: true,
    });

    expect(viewModel.reducedMotion).toBe(true);
    expect(viewModel.gameMinutesPerRealMillisecond).toBe(0);
  });
});
