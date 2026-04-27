import type { Application, Container } from 'pixi.js';

export interface CameraState {
  scale: number;
  x: number;
  y: number;
}

export interface CameraBounds {
  height: number;
  width: number;
}

export interface CameraLimits {
  defaultCamera: {
    x: number;
    y: number;
  };
  defaultZoom: number;
  maxZoom: number;
  minZoom: number;
  zoomPresets?: readonly number[];
}

interface CameraControllerOptions {
  app: Application;
  bounds: CameraBounds;
  canvas: HTMLCanvasElement;
  limits: CameraLimits;
  onChange?: (camera: CameraState) => void;
  overscrollRatio?: number;
  target: Container;
}

interface CameraPanState {
  pointerId: number;
  startCamera: CameraState;
  startClientX: number;
  startClientY: number;
}

const DEFAULT_OVERSCROLL_RATIO = 0;
const TAP_SUPPRESSION_MILLISECONDS = 160;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getSortedZoomPresets(limits: CameraLimits): number[] {
  return Array.from(
    new Set(
      (limits.zoomPresets ?? [])
        .filter((zoom) => zoom >= limits.minZoom && zoom <= limits.maxZoom)
        .map((zoom) => Number(zoom.toFixed(4))),
    ),
  ).sort((a, b) => a - b);
}

function getNextZoomPreset(currentZoom: number, direction: 1 | -1, limits: CameraLimits): number {
  const presets = getSortedZoomPresets(limits);

  if (presets.length === 0) {
    const zoomFactor = direction > 0 ? 1.18 : 1 / 1.18;

    return clamp(currentZoom * zoomFactor, limits.minZoom, limits.maxZoom);
  }

  const epsilon = 0.001;

  if (direction > 0) {
    return presets.find((preset) => preset > currentZoom + epsilon) ?? presets[presets.length - 1];
  }

  return [...presets].reverse().find((preset) => preset < currentZoom - epsilon) ?? presets[0];
}

export class CameraController {
  private readonly app: Application;
  private readonly canvas: HTMLCanvasElement;
  private readonly onChange?: (camera: CameraState) => void;
  private readonly overscrollRatio: number;
  private readonly target: Container;
  private bounds: CameraBounds;
  private dragged = false;
  private lastDragEndedAt = 0;
  private limits: CameraLimits;
  private panState: CameraPanState | null = null;
  private state: CameraState;

  constructor(options: CameraControllerOptions) {
    this.app = options.app;
    this.bounds = options.bounds;
    this.canvas = options.canvas;
    this.limits = options.limits;
    this.onChange = options.onChange;
    this.overscrollRatio = options.overscrollRatio ?? DEFAULT_OVERSCROLL_RATIO;
    this.target = options.target;
    this.state = this.clampCamera(this.createDefaultCamera());

    this.applyCamera(this.state);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    globalThis.addEventListener('resize', this.handleResize);
  }

  configure(bounds: CameraBounds, limits: CameraLimits): void {
    this.bounds = bounds;
    this.limits = limits;
    this.setCamera(this.clampCamera(this.state));
  }

  destroy(): void {
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    globalThis.removeEventListener('resize', this.handleResize);
    this.panState = null;
  }

  resize(): void {
    this.setCamera(this.clampCamera(this.state));
  }

  getState(): CameraState {
    return { ...this.state };
  }

  screenToWorld(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: (point.x - this.state.x) / this.state.scale,
      y: (point.y - this.state.y) / this.state.scale,
    };
  }

  worldToScreen(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: point.x * this.state.scale + this.state.x,
      y: point.y * this.state.scale + this.state.y,
    };
  }

  shouldSuppressTap(): boolean {
    return performance.now() - this.lastDragEndedAt < TAP_SUPPRESSION_MILLISECONDS;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    this.dragged = false;
    this.panState = {
      pointerId: event.pointerId,
      startCamera: this.state,
      startClientX: event.clientX,
      startClientY: event.clientY,
    };
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const panState = this.panState;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - panState.startClientX;
    const deltaY = event.clientY - panState.startClientY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 6) {
      this.dragged = true;
    }

    this.setCamera(
      this.clampCamera({
        scale: panState.startCamera.scale,
        x: panState.startCamera.x + deltaX,
        y: panState.startCamera.y + deltaY,
      }),
    );
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const panState = this.panState;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    this.panState = null;

    if (this.dragged) {
      this.lastDragEndedAt = performance.now();
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly handleResize = (): void => {
    this.resize();
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const bounds = this.canvas.getBoundingClientRect();
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;
    const direction = event.deltaY < 0 ? 1 : -1;
    const nextScale = getNextZoomPreset(this.state.scale, direction, this.limits);
    const worldX = (cursorX - this.state.x) / this.state.scale;
    const worldY = (cursorY - this.state.y) / this.state.scale;

    this.setCamera(
      this.clampCamera({
        scale: nextScale,
        x: cursorX - worldX * nextScale,
        y: cursorY - worldY * nextScale,
      }),
    );
  };

  private applyCamera(camera: CameraState): void {
    this.target.scale.set(camera.scale);
    this.target.position.set(camera.x, camera.y);
  }

  private clampCamera(camera: CameraState): CameraState {
    const viewportWidth = this.app.screen.width;
    const viewportHeight = this.app.screen.height;
    const scale = clamp(camera.scale, this.limits.minZoom, this.limits.maxZoom);
    const scaledWidth = this.bounds.width * scale;
    const scaledHeight = this.bounds.height * scale;
    const overscrollX = viewportWidth * this.overscrollRatio;
    const overscrollY = viewportHeight * this.overscrollRatio;
    const centeredX = (viewportWidth - scaledWidth) / 2;
    const centeredY = (viewportHeight - scaledHeight) / 2;
    const minimumX =
      scaledWidth <= viewportWidth
        ? centeredX - overscrollX
        : viewportWidth - scaledWidth - overscrollX;
    const minimumY =
      scaledHeight <= viewportHeight
        ? centeredY - overscrollY
        : viewportHeight - scaledHeight - overscrollY;
    const maximumX = scaledWidth <= viewportWidth ? centeredX + overscrollX : overscrollX;
    const maximumY = scaledHeight <= viewportHeight ? centeredY + overscrollY : overscrollY;

    return {
      scale,
      x: clamp(camera.x, minimumX, maximumX),
      y: clamp(camera.y, minimumY, maximumY),
    };
  }

  private createDefaultCamera(): CameraState {
    return {
      scale: this.limits.defaultZoom,
      x: this.limits.defaultCamera.x,
      y: this.limits.defaultCamera.y,
    };
  }

  private setCamera(camera: CameraState): void {
    this.state = camera;
    this.applyCamera(camera);
    this.onChange?.(this.getState());
  }
}
