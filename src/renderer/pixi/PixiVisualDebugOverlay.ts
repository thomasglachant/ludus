import { Container, Graphics, Text } from 'pixi.js';

export interface PixiDebugPoint {
  x: number;
  y: number;
}

export interface PixiDebugRect extends PixiDebugPoint {
  width: number;
  height: number;
}

export interface PixiVisualDebugMetric extends PixiDebugRect {
  anchor?: PixiDebugPoint;
  anchorPosition?: PixiDebugPoint;
  color?: number;
  hitbox?: PixiDebugRect;
  label: string;
  nativeHeight?: number;
  nativeWidth?: number;
  scaleX?: number;
  scaleY?: number;
}

const DEFAULT_BOUNDS_COLOR = 0x86e7ff;
const HITBOX_COLOR = 0xff6f5f;
const ANCHOR_COLOR = 0xf8e56b;

function formatNumber(value: number | undefined): string {
  return value === undefined ? 'n/a' : value.toFixed(2);
}

function formatSize(width: number | undefined, height: number | undefined): string {
  if (width === undefined || height === undefined) {
    return 'n/a';
  }

  return `${Math.round(width)}x${Math.round(height)}`;
}

function roundRect(rect: PixiDebugRect): PixiDebugRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export class PixiVisualDebugOverlay {
  readonly root = new Container();

  private readonly graphics = new Graphics({ roundPixels: true });
  private readonly labels: Text[] = [];

  constructor() {
    this.root.eventMode = 'none';
    this.root.label = 'pixi-visual-debug-overlay';
    this.root.addChild(this.graphics);
  }

  destroy(): void {
    this.clear();
    this.root.removeChild(this.graphics);
    this.graphics.destroy();
    this.root.destroy({ children: true });
  }

  draw(metrics: PixiVisualDebugMetric[]): void {
    this.clear();

    for (const metric of metrics) {
      this.drawMetric(metric);
    }
  }

  private clear(): void {
    this.graphics.clear();

    for (const label of this.labels) {
      this.root.removeChild(label);
      label.destroy();
    }

    this.labels.length = 0;
  }

  private drawMetric(metric: PixiVisualDebugMetric): void {
    const bounds = roundRect(metric);
    const color = metric.color ?? DEFAULT_BOUNDS_COLOR;

    this.graphics.setStrokeStyle({ alpha: 0.88, color, width: 1 });
    this.graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.graphics.stroke();

    if (metric.hitbox) {
      const hitbox = roundRect(metric.hitbox);

      this.graphics.setFillStyle({ alpha: 0.08, color: HITBOX_COLOR });
      this.graphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
      this.graphics.fill();
      this.graphics.setStrokeStyle({ alpha: 0.95, color: HITBOX_COLOR, width: 1 });
      this.graphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
      this.graphics.stroke();
    }

    if (metric.anchorPosition) {
      const anchorX = Math.round(metric.anchorPosition.x);
      const anchorY = Math.round(metric.anchorPosition.y);

      this.graphics.setStrokeStyle({ alpha: 0.95, color: ANCHOR_COLOR, width: 1 });
      this.graphics.moveTo(anchorX - 5, anchorY);
      this.graphics.lineTo(anchorX + 5, anchorY);
      this.graphics.moveTo(anchorX, anchorY - 5);
      this.graphics.lineTo(anchorX, anchorY + 5);
      this.graphics.stroke();
    }

    this.drawLabel(metric, bounds);
  }

  private drawLabel(metric: PixiVisualDebugMetric, bounds: PixiDebugRect): void {
    const anchorText = metric.anchor
      ? `${formatNumber(metric.anchor.x)},${formatNumber(metric.anchor.y)}`
      : 'n/a';
    const hitboxText = metric.hitbox
      ? formatSize(metric.hitbox.width, metric.hitbox.height)
      : 'n/a';
    const label = new Text({
      text: [
        metric.label,
        `native ${formatSize(metric.nativeWidth, metric.nativeHeight)} scale ${formatNumber(
          metric.scaleX,
        )}x${formatNumber(metric.scaleY)}`,
        `anchor ${anchorText} hitbox ${hitboxText}`,
      ].join('\n'),
      style: {
        fill: '#f8f2c2',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 12,
        stroke: { color: '#22150c', width: 3 },
      },
    });

    label.eventMode = 'none';
    label.label = `${metric.label}:debug-label`;
    label.resolution = 1;
    label.roundPixels = true;
    label.x = Math.round(bounds.x);
    label.y = Math.round(bounds.y - 38);
    this.labels.push(label);
    this.root.addChild(label);
  }
}
