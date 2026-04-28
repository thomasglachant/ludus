import type { MapRect } from './map-layout';
import { VISUAL_ASSET_MANIFEST } from './visual-assets';

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

export interface MapWaterAnimationDefinition extends MapRect {
  id: string;
  color: string;
  lineCount: number;
  lineWidth: number;
  opacity: number;
  speed: number;
}

const ambientAssets = VISUAL_ASSET_MANIFEST.map.ambient;

export const LUDUS_MAP_WATER_ANIMATION: MapWaterAnimationDefinition = {
  id: 'coastal-sea',
  x: 0,
  y: 0,
  width: 2400,
  height: 150,
  color: '#e8fbff',
  lineCount: 14,
  lineWidth: 3,
  opacity: 0.24,
  speed: 0.18,
};

export const LUDUS_MAP_AMBIENT_ELEMENTS: MapAmbientElementDefinition[] = [
  {
    id: 'banner-north-overlook',
    kind: 'banner',
    assetPath: ambientAssets['banner-red'],
    x: 1040,
    y: 258,
    width: 42,
    height: 72,
    opacity: 0.96,
    animationDelaySeconds: -0.4,
    animationDurationSeconds: 1.8,
    zIndex: 8,
  },
  {
    id: 'banner-domus-right',
    kind: 'banner',
    assetPath: ambientAssets['banner-red'],
    x: 1410,
    y: 686,
    width: 42,
    height: 72,
    opacity: 0.96,
    animationDelaySeconds: -1.1,
    animationDurationSeconds: 1.9,
    zIndex: 8,
  },
  {
    id: 'banner-arena-gate',
    kind: 'banner',
    assetPath: ambientAssets['banner-red'],
    x: 2225,
    y: 608,
    width: 46,
    height: 78,
    rotation: 2,
    opacity: 0.98,
    animationDelaySeconds: -0.7,
    animationDurationSeconds: 1.7,
    zIndex: 8,
  },
  {
    id: 'banner-south-gate',
    kind: 'banner',
    assetPath: ambientAssets['banner-red'],
    x: 1120,
    y: 1360,
    width: 44,
    height: 76,
    rotation: -1,
    opacity: 0.94,
    animationDelaySeconds: -1.5,
    animationDurationSeconds: 2.1,
    zIndex: 8,
  },
  {
    id: 'banner-training-sway',
    kind: 'banner',
    assetPath: ambientAssets['banner-red'],
    x: 1685,
    y: 802,
    width: 34,
    height: 58,
    opacity: 0.78,
    animationDelaySeconds: -3.3,
    animationDurationSeconds: 3.1,
    zIndex: 8,
  },
];
