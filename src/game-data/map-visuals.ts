import type { MapRect } from './map-layout';

export type MapAmbientElementKind = 'banner';

export interface MapAmbientElementDefinition extends MapRect {
  id: string;
  kind: MapAmbientElementKind;
  assetPath: string;
  rotation?: number;
  scale?: number;
  opacity?: number;
  animationDelaySeconds?: number;
  animationDurationSeconds?: number;
  zIndex?: number;
}

export const LUDUS_MAP_AMBIENT_ELEMENTS: MapAmbientElementDefinition[] = [];
