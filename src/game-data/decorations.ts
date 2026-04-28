export type MapDecorationStyle = string;

export interface MapDecorationDefinition {
  id: string;
  style: MapDecorationStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isAnimated?: boolean;
  animationDelaySeconds?: number;
  animationDurationSeconds?: number;
}

export const LUDUS_MAP_DECORATIONS: MapDecorationDefinition[] = [];
