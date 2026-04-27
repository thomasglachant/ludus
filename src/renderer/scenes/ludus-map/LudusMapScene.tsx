import { extend, useApplication, useTick } from '@pixi/react';
import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
  type FederatedPointerEvent,
  type Application as PixiApplication,
} from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  LudusMapSceneAmbientElementViewModel,
  LudusMapSceneDecorationViewModel,
  LudusMapSceneGladiatorViewModel,
  LudusMapScenePathViewModel,
  LudusMapSceneViewModel,
} from './LudusMapSceneViewModel';

extend({ Container, Graphics, Sprite, Text });

interface LudusMapSceneProps {
  viewModel: LudusMapSceneViewModel;
  onLocationSelect?: (locationId: string) => void;
}

interface LudusMapGladiatorSpriteProps {
  currentGameMinute: number;
  gameMinutesPerRealMillisecond: number;
  gladiator: LudusMapSceneGladiatorViewModel;
  texturesByPath: Record<string, Texture>;
}

interface LudusMapAmbientSpriteProps {
  element: LudusMapSceneAmbientElementViewModel;
  reducedMotion: boolean;
  texture?: Texture;
}

interface CameraState {
  scale: number;
  x: number;
  y: number;
}

const CAMERA_OVERSCROLL_RATIO = 0.42;
const ASSET_PATH_SEPARATOR = '\u0000';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function getViewportSize(app: PixiApplication) {
  return {
    width: app.screen.width,
    height: app.screen.height,
  };
}

function clampCamera(camera: CameraState, viewModel: LudusMapSceneViewModel, app: PixiApplication) {
  const viewport = getViewportSize(app);
  const scaledWidth = viewModel.width * camera.scale;
  const scaledHeight = viewModel.height * camera.scale;
  const overscrollX = viewport.width * CAMERA_OVERSCROLL_RATIO;
  const overscrollY = viewport.height * CAMERA_OVERSCROLL_RATIO;
  const centeredX = (viewport.width - scaledWidth) / 2;
  const centeredY = (viewport.height - scaledHeight) / 2;
  const minimumX =
    scaledWidth <= viewport.width
      ? centeredX - overscrollX
      : viewport.width - scaledWidth - overscrollX;
  const minimumY =
    scaledHeight <= viewport.height
      ? centeredY - overscrollY
      : viewport.height - scaledHeight - overscrollY;
  const maximumX = scaledWidth <= viewport.width ? centeredX + overscrollX : overscrollX;
  const maximumY = scaledHeight <= viewport.height ? centeredY + overscrollY : overscrollY;

  return {
    scale: camera.scale,
    x: clamp(camera.x, minimumX, maximumX),
    y: clamp(camera.y, minimumY, maximumY),
  };
}

function createDefaultCamera(viewModel: LudusMapSceneViewModel): CameraState {
  return {
    scale: viewModel.defaultZoom,
    x: viewModel.defaultCamera.x,
    y: viewModel.defaultCamera.y,
  };
}

function getLudusMapAssetPaths(viewModel: LudusMapSceneViewModel) {
  return Array.from(
    new Set([
      ...viewModel.locations.flatMap((location) =>
        location.assetPath ? [location.assetPath] : [],
      ),
      ...viewModel.gladiators.flatMap((gladiator) => gladiator.spriteFrames),
      ...viewModel.ambientElements.map((element) => element.assetPath),
      ...(viewModel.theme.backgroundAssetPath ? [viewModel.theme.backgroundAssetPath] : []),
    ]),
  );
}

function LudusMapGladiatorSprite({
  currentGameMinute,
  gameMinutesPerRealMillisecond,
  gladiator,
  texturesByPath,
}: LudusMapGladiatorSpriteProps) {
  const containerRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const gameMinuteRef = useRef(currentGameMinute);
  const realTimeRef = useRef(0);

  useEffect(() => {
    gameMinuteRef.current = currentGameMinute;
    realTimeRef.current = performance.now();
  }, [currentGameMinute]);

  useTick(() => {
    const container = containerRef.current;
    const sprite = spriteRef.current;

    if (!container) {
      return;
    }

    if (realTimeRef.current === 0) {
      realTimeRef.current = performance.now();
    }

    const visualGameMinute =
      gameMinuteRef.current +
      (performance.now() - realTimeRef.current) * gameMinutesPerRealMillisecond;
    const progress =
      gameMinutesPerRealMillisecond === 0
        ? 1
        : clamp(
            (visualGameMinute - gladiator.movementStartedAt) / gladiator.movementDuration,
            0,
            1,
          );

    container.x = interpolate(gladiator.from.x, gladiator.to.x, progress);
    container.y = interpolate(gladiator.from.y, gladiator.to.y, progress);
    container.zIndex = container.y;

    if (sprite && gladiator.spriteFrames.length > 0) {
      const frameIndex =
        gameMinutesPerRealMillisecond === 0
          ? 0
          : gladiator.animationState === 'walking'
            ? Math.floor(performance.now() / 180) % gladiator.spriteFrames.length
            : Math.floor(performance.now() / 420) % gladiator.spriteFrames.length;
      const texture = texturesByPath[gladiator.spriteFrames[frameIndex]];

      if (texture) {
        sprite.texture = texture;
      }
    }
  });

  const fallbackTexture = gladiator.spriteFrames[0]
    ? texturesByPath[gladiator.spriteFrames[0]]
    : undefined;
  const initialProgress =
    gameMinutesPerRealMillisecond === 0
      ? 1
      : clamp((currentGameMinute - gladiator.movementStartedAt) / gladiator.movementDuration, 0, 1);
  const initialX = interpolate(gladiator.from.x, gladiator.to.x, initialProgress);
  const initialY = interpolate(gladiator.from.y, gladiator.to.y, initialProgress);

  return (
    <pixiContainer ref={containerRef} x={initialX} y={initialY} zIndex={initialY}>
      <pixiGraphics
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: 0x1e1712, alpha: 0.28 });
          graphics.ellipse(0, 8, 34, 12);
          graphics.fill();
        }}
      />
      {fallbackTexture ? (
        <pixiSprite
          anchor={{ x: 0.5, y: 1 }}
          height={92}
          ref={spriteRef}
          texture={fallbackTexture}
          width={62}
          x={0}
          y={4}
        />
      ) : (
        <pixiGraphics
          draw={(graphics) => {
            graphics.clear();
            graphics.setFillStyle({ color: 0x8f3f2c });
            graphics.circle(0, -24, 18);
            graphics.fill();
          }}
        />
      )}
      <pixiText
        anchor={0.5}
        eventMode="none"
        resolution={2}
        style={{
          align: 'center',
          fill: '#f5deb0',
          fontFamily: 'serif',
          fontSize: 18,
          fontWeight: '700',
          stroke: { color: '#2f2117', width: 3 },
        }}
        text={gladiator.name}
        y={24}
      />
    </pixiContainer>
  );
}

function LudusMapPaths({ paths }: { paths: LudusMapScenePathViewModel[] }) {
  const drawPaths = useCallback(
    (graphics: Graphics) => {
      graphics.clear();

      for (const path of paths) {
        if (path.points.length < 2) {
          continue;
        }

        graphics.setStrokeStyle({
          color: path.kind === 'external' ? 0x7b5a35 : 0x9f7a45,
          width: path.kind === 'external' ? 32 : 24,
          alpha: 0.5,
          cap: 'round',
          join: 'round',
        });
        graphics.moveTo(path.points[0].x, path.points[0].y);

        for (const point of path.points.slice(1)) {
          graphics.lineTo(point.x, point.y);
        }

        graphics.stroke();
        graphics.setStrokeStyle({
          color: path.kind === 'external' ? 0xd7b56b : 0xe1c27d,
          width: path.kind === 'external' ? 16 : 12,
          alpha: 0.58,
          cap: 'round',
          join: 'round',
        });
        graphics.moveTo(path.points[0].x, path.points[0].y);

        for (const point of path.points.slice(1)) {
          graphics.lineTo(point.x, point.y);
        }

        graphics.stroke();
      }
    },
    [paths],
  );

  return <pixiGraphics draw={drawPaths} zIndex={2} />;
}

function LudusMapDecoration({ decoration }: { decoration: LudusMapSceneDecorationViewModel }) {
  const drawDecoration = useCallback(
    (graphics: Graphics) => {
      const { height, style, width } = decoration;

      graphics.clear();

      if (style === 'wall') {
        graphics.setFillStyle({ color: 0x6a5140 });
        graphics.rect(0, 0, width, height);
        graphics.fill();
        graphics.setFillStyle({ color: 0x9d8064, alpha: 0.65 });
        graphics.rect(0, 0, width, Math.max(5, height * 0.28));
        graphics.fill();
        return;
      }

      if (style === 'fence') {
        graphics.setStrokeStyle({ color: 0x6c492e, width: 8, cap: 'round' });
        graphics.moveTo(0, height * 0.5);
        graphics.lineTo(width, height * 0.5);
        graphics.stroke();
        graphics.setStrokeStyle({ color: 0xb2834f, width: 4, cap: 'round' });
        for (let x = 8; x < width; x += 28) {
          graphics.moveTo(x, 2);
          graphics.lineTo(x + 6, height - 2);
        }
        graphics.stroke();
        return;
      }

      if (style === 'field') {
        graphics.setFillStyle({ color: 0xb99d55, alpha: 0.78 });
        graphics.roundRect(0, 0, width, height, 8);
        graphics.fill();
        graphics.setStrokeStyle({ color: 0xe1c97b, width: 5, alpha: 0.45 });
        for (let y = 18; y < height; y += 28) {
          graphics.moveTo(14, y);
          graphics.lineTo(width - 14, y + 8);
        }
        graphics.stroke();
        return;
      }

      if (style === 'well') {
        graphics.setFillStyle({ color: 0x33261e, alpha: 0.36 });
        graphics.ellipse(width / 2, height * 0.82, width * 0.5, height * 0.18);
        graphics.fill();
        graphics.setFillStyle({ color: 0x7b6854 });
        graphics.circle(width / 2, height / 2, Math.min(width, height) * 0.34);
        graphics.fill();
        graphics.setFillStyle({ color: 0x273f4b });
        graphics.circle(width / 2, height / 2, Math.min(width, height) * 0.22);
        graphics.fill();
        return;
      }

      if (style === 'storage') {
        graphics.setFillStyle({ color: 0x8a5b35 });
        graphics.roundRect(4, height * 0.22, width - 8, height * 0.68, 5);
        graphics.fill();
        graphics.setStrokeStyle({ color: 0xd3a15f, width: 4 });
        graphics.rect(10, height * 0.28, width - 20, height * 0.52);
        graphics.stroke();
        return;
      }

      if (style === 'torch') {
        graphics.setFillStyle({ color: 0x4d3325 });
        graphics.rect(width * 0.42, height * 0.34, width * 0.16, height * 0.62);
        graphics.fill();
        graphics.setFillStyle({ color: 0xffc25d });
        graphics.circle(width / 2, height * 0.24, width * 0.22);
        graphics.fill();
        graphics.setFillStyle({ color: 0xb73a24 });
        graphics.circle(width / 2, height * 0.29, width * 0.12);
        graphics.fill();
        return;
      }

      if (style === 'amphora') {
        graphics.setFillStyle({ color: 0x9b6535 });
        graphics.ellipse(width / 2, height * 0.58, width * 0.32, height * 0.34);
        graphics.fill();
        graphics.setFillStyle({ color: 0xd3a15f });
        graphics.rect(width * 0.38, height * 0.14, width * 0.24, height * 0.24);
        graphics.fill();
        return;
      }

      if (style === 'cypressTree') {
        graphics.setFillStyle({ color: 0x5e3b25 });
        graphics.rect(width * 0.44, height * 0.72, width * 0.12, height * 0.24);
        graphics.fill();
        graphics.setFillStyle({ color: 0x244b35 });
        graphics.moveTo(width / 2, 0);
        graphics.lineTo(width * 0.12, height * 0.78);
        graphics.lineTo(width * 0.88, height * 0.78);
        graphics.closePath();
        graphics.fill();
        return;
      }

      graphics.setFillStyle({ color: 0x684323 });
      graphics.rect(width * 0.44, height * 0.58, width * 0.12, height * 0.34);
      graphics.fill();
      graphics.setFillStyle({ color: 0x4e6b2f });
      graphics.circle(width * 0.48, height * 0.28, width * 0.3);
      graphics.circle(width * 0.28, height * 0.44, width * 0.24);
      graphics.circle(width * 0.7, height * 0.44, width * 0.24);
      graphics.fill();
    },
    [decoration],
  );

  return (
    <pixiGraphics
      draw={drawDecoration}
      pivot={{ x: decoration.width / 2, y: decoration.height / 2 }}
      rotation={(decoration.rotation * Math.PI) / 180}
      x={decoration.x + decoration.width / 2}
      y={decoration.y + decoration.height / 2}
      zIndex={decoration.y + decoration.height * 0.72}
    />
  );
}

function LudusMapAmbientSprite({ element, reducedMotion, texture }: LudusMapAmbientSpriteProps) {
  const spriteRef = useRef<Sprite | null>(null);

  useEffect(() => {
    const sprite = spriteRef.current;

    if (!sprite) {
      return;
    }

    sprite.x = element.x;
    sprite.y = element.y;
    sprite.alpha = element.opacity;
    sprite.rotation = (element.rotation * Math.PI) / 180;
  }, [element.opacity, element.rotation, element.x, element.y]);

  useTick(() => {
    const sprite = spriteRef.current;

    if (!sprite || reducedMotion) {
      return;
    }

    const elapsedSeconds = performance.now() / 1000 + element.animationDelaySeconds;
    const cycle =
      (elapsedSeconds % element.animationDurationSeconds) / element.animationDurationSeconds;
    const wave = Math.sin(cycle * Math.PI * 2);

    if (element.kind === 'cloud') {
      sprite.x = element.x + cycle * 340;
      sprite.alpha = element.opacity;
      return;
    }

    if (element.kind === 'smoke') {
      sprite.y = element.y - cycle * 26;
      sprite.alpha = element.opacity * (1 - cycle * 0.55);
      return;
    }

    if (element.kind === 'torch' || element.kind === 'crowd') {
      sprite.alpha = element.opacity * (0.78 + Math.abs(wave) * 0.22);
      return;
    }

    if (element.kind === 'banner' || element.kind === 'grass') {
      sprite.rotation = ((element.rotation + wave * 2.5) * Math.PI) / 180;
    }
  });

  if (!texture || element.opacity <= 0) {
    return null;
  }

  return (
    <pixiSprite
      alpha={element.opacity}
      height={element.height}
      ref={spriteRef}
      texture={texture}
      width={element.width}
      x={element.x}
      y={element.y}
      zIndex={element.zIndex}
    />
  );
}

export function LudusMapScene({ viewModel, onLocationSelect }: LudusMapSceneProps) {
  const { app, isInitialised } = useApplication();
  const [texturesByPath, setTexturesByPath] = useState<Record<string, Texture>>({});
  const [camera, setCamera] = useState<CameraState>(() => createDefaultCamera(viewModel));
  const viewModelRef = useRef(viewModel);
  const cameraRef = useRef(camera);
  const panStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCamera: CameraState;
  } | null>(null);
  const draggedRef = useRef(false);
  const lastDragEndedAtRef = useRef(0);
  const setCameraState = useCallback(
    (update: CameraState | ((current: CameraState) => CameraState)) => {
      setCamera((currentCamera) => {
        const nextCamera = typeof update === 'function' ? update(currentCamera) : update;
        cameraRef.current = nextCamera;

        return nextCamera;
      });
    },
    [],
  );
  const assetPathKey = getLudusMapAssetPaths(viewModel).join(ASSET_PATH_SEPARATOR);
  const stableAssetPaths = useMemo(
    () => (assetPathKey ? assetPathKey.split(ASSET_PATH_SEPARATOR) : []),
    [assetPathKey],
  );

  useEffect(() => {
    viewModelRef.current = viewModel;
  }, [viewModel]);

  useEffect(() => {
    if (!isInitialised) {
      return;
    }

    function handleResize() {
      setCameraState((currentCamera) => clampCamera(currentCamera, viewModelRef.current, app));
    }

    globalThis.addEventListener('resize', handleResize);

    return () => {
      globalThis.removeEventListener('resize', handleResize);
    };
  }, [app, isInitialised, setCameraState]);

  useEffect(() => {
    if (!isInitialised) {
      return;
    }

    const canvas = app.canvas;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const cursorX = event.clientX - bounds.left;
      const cursorY = event.clientY - bounds.top;

      setCameraState((currentCamera) => {
        const latestViewModel = viewModelRef.current;
        const nextScale = clamp(
          currentCamera.scale * Math.exp(-event.deltaY * 0.001),
          latestViewModel.minZoom,
          latestViewModel.maxZoom,
        );
        const worldX = (cursorX - currentCamera.x) / currentCamera.scale;
        const worldY = (cursorY - currentCamera.y) / currentCamera.scale;

        return clampCamera(
          {
            scale: nextScale,
            x: cursorX - worldX * nextScale,
            y: cursorY - worldY * nextScale,
          },
          latestViewModel,
          app,
        );
      });
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }

      draggedRef.current = false;
      panStateRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startCamera: cameraRef.current,
      };
      canvas.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      const panState = panStateRef.current;

      if (!panState || panState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;

      if (Math.abs(deltaX) + Math.abs(deltaY) > 6) {
        draggedRef.current = true;
      }

      setCameraState(
        clampCamera(
          {
            scale: panState.startCamera.scale,
            x: panState.startCamera.x + deltaX,
            y: panState.startCamera.y + deltaY,
          },
          viewModelRef.current,
          app,
        ),
      );
    }

    function handlePointerUp(event: PointerEvent) {
      const panState = panStateRef.current;

      if (!panState || panState.pointerId !== event.pointerId) {
        return;
      }

      panStateRef.current = null;

      if (draggedRef.current) {
        lastDragEndedAtRef.current = performance.now();
      }

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [app, isInitialised, setCameraState]);

  useEffect(() => {
    let isMounted = true;

    async function loadTextures() {
      const loadedEntries = await Promise.all(
        stableAssetPaths.map(
          async (assetPath) => [assetPath, await Assets.load<Texture>(assetPath)] as const,
        ),
      );

      if (isMounted) {
        setTexturesByPath(Object.fromEntries(loadedEntries));
      }
    }

    void loadTextures();

    return () => {
      isMounted = false;
    };
  }, [stableAssetPaths]);

  const drawBackground = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: viewModel.theme.terrainColor });
      graphics.rect(0, 0, viewModel.width, viewModel.height);
      graphics.fill();
      graphics.setFillStyle({ color: viewModel.theme.terrainHighlightColor, alpha: 0.24 });
      graphics.ellipse(viewModel.width / 2, viewModel.height * 0.64, 880, 360);
      graphics.fill();
      graphics.setStrokeStyle({ color: 0x3b2a1d, width: 6 });
      graphics.roundRect(24, 24, viewModel.width - 48, viewModel.height - 48, 18);
      graphics.stroke();
    },
    [
      viewModel.height,
      viewModel.theme.terrainColor,
      viewModel.theme.terrainHighlightColor,
      viewModel.width,
    ],
  );

  return (
    <pixiContainer scale={camera.scale} sortableChildren x={camera.x} y={camera.y}>
      <pixiGraphics draw={drawBackground} zIndex={-1100} />
      {viewModel.theme.backgroundAssetPath &&
      texturesByPath[viewModel.theme.backgroundAssetPath] ? (
        <pixiSprite
          alpha={0.9}
          height={viewModel.height}
          texture={texturesByPath[viewModel.theme.backgroundAssetPath]}
          width={viewModel.width}
          zIndex={-1000}
        />
      ) : null}
      <LudusMapPaths paths={viewModel.paths} />
      {viewModel.decorations.map((decoration) => (
        <LudusMapDecoration decoration={decoration} key={decoration.id} />
      ))}
      {viewModel.ambientElements
        .filter((element) => element.zIndex <= 3)
        .map((element) => (
          <LudusMapAmbientSprite
            element={element}
            key={element.id}
            reducedMotion={viewModel.reducedMotion}
            texture={texturesByPath[element.assetPath]}
          />
        ))}
      {viewModel.locations.map((location) => (
        <pixiContainer
          cursor="pointer"
          eventMode="static"
          key={location.id}
          label={location.id}
          zIndex={location.y + location.height}
          onPointerTap={(event: FederatedPointerEvent) => {
            event.stopPropagation();
            if (performance.now() - lastDragEndedAtRef.current < 160) {
              return;
            }
            onLocationSelect?.(location.mapLocationId);
          }}
        >
          <pixiGraphics
            draw={(graphics) => {
              graphics.clear();
              graphics.setFillStyle({
                color:
                  location.kind === 'external' ? 0x7b4c32 : location.isOwned ? 0x9b6535 : 0x4b3d33,
                alpha: location.assetPath ? 0.2 : 1,
              });
              graphics.rect(location.x, location.y, location.width, location.height);
              graphics.fill();
              graphics.setStrokeStyle({
                color:
                  location.kind === 'external' ? 0xe0b15e : location.isOwned ? 0xd6a557 : 0x7d6959,
                width: 4,
              });
              graphics.rect(location.x, location.y, location.width, location.height);
              graphics.stroke();
            }}
          />
          {location.assetPath && texturesByPath[location.assetPath] ? (
            <pixiSprite
              height={location.height}
              texture={texturesByPath[location.assetPath]}
              width={location.width}
              x={location.x}
              y={location.y}
            />
          ) : null}
          <pixiText
            anchor={0.5}
            eventMode="none"
            resolution={2}
            style={{
              align: 'center',
              dropShadow: {
                alpha: 0.7,
                angle: Math.PI / 2,
                blur: 1,
                color: '#1c130c',
                distance: 2,
              },
              fill: '#f5deb0',
              fontFamily: 'serif',
              fontSize: 28,
              fontWeight: '700',
              stroke: { color: '#2f2117', width: 4 },
            }}
            text={location.label}
            x={location.x + location.width / 2}
            y={location.y + location.height + 30}
          />
        </pixiContainer>
      ))}
      {viewModel.ambientElements
        .filter((element) => element.zIndex > 3)
        .map((element) => (
          <LudusMapAmbientSprite
            element={element}
            key={element.id}
            reducedMotion={viewModel.reducedMotion}
            texture={texturesByPath[element.assetPath]}
          />
        ))}
      {viewModel.gladiators.map((gladiator) => (
        <LudusMapGladiatorSprite
          currentGameMinute={viewModel.currentGameMinute}
          gameMinutesPerRealMillisecond={viewModel.gameMinutesPerRealMillisecond}
          gladiator={gladiator}
          key={gladiator.id}
          texturesByPath={texturesByPath}
        />
      ))}
      <pixiGraphics
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({
            color: viewModel.theme.overlayColor,
            alpha: viewModel.theme.overlayOpacity,
          });
          graphics.rect(0, 0, viewModel.width, viewModel.height);
          graphics.fill();
        }}
        eventMode="none"
        zIndex={10000}
      />
    </pixiContainer>
  );
}
