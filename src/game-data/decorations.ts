export type MapDecorationStyle =
  | 'oliveTree'
  | 'cypressTree'
  | 'well'
  | 'storage'
  | 'field'
  | 'wall'
  | 'fence'
  | 'torch'
  | 'amphora';

export interface MapDecorationDefinition {
  id: string;
  style: MapDecorationStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export const LUDUS_MAP_DECORATIONS: MapDecorationDefinition[] = [
  { id: 'olive-north-west', style: 'oliveTree', x: 610, y: 330, width: 74, height: 92 },
  { id: 'olive-north-plateau', style: 'oliveTree', x: 910, y: 270, width: 86, height: 104 },
  { id: 'olive-south-west', style: 'oliveTree', x: 560, y: 1060, width: 82, height: 98 },
  { id: 'olive-west-ridge', style: 'oliveTree', x: 420, y: 1260, width: 92, height: 108 },
  { id: 'olive-south-east', style: 'oliveTree', x: 1620, y: 1100, width: 78, height: 96 },
  { id: 'olive-east-plateau', style: 'oliveTree', x: 1880, y: 960, width: 88, height: 106 },
  { id: 'olive-far-east', style: 'oliveTree', x: 2290, y: 1180, width: 84, height: 102 },
  { id: 'olive-south-field', style: 'oliveTree', x: 1780, y: 1420, width: 96, height: 112 },
  { id: 'cypress-north-east', style: 'cypressTree', x: 1650, y: 340, width: 56, height: 128 },
  { id: 'cypress-gate', style: 'cypressTree', x: 520, y: 780, width: 52, height: 120 },
  { id: 'cypress-sea-road', style: 'cypressTree', x: 260, y: 520, width: 46, height: 112 },
  { id: 'cypress-east-slope', style: 'cypressTree', x: 2140, y: 770, width: 50, height: 122 },
  { id: 'cypress-south-edge', style: 'cypressTree', x: 1280, y: 1450, width: 54, height: 128 },
  { id: 'well-courtyard', style: 'well', x: 955, y: 820, width: 72, height: 72 },
  { id: 'storage-canteen', style: 'storage', x: 620, y: 690, width: 84, height: 58 },
  { id: 'field-west', style: 'field', x: 90, y: 1010, width: 310, height: 230, rotation: -4 },
  { id: 'field-south', style: 'field', x: 1280, y: 1220, width: 360, height: 170, rotation: 3 },
  { id: 'wall-north', style: 'wall', x: 540, y: 295, width: 1180, height: 24 },
  { id: 'wall-south', style: 'wall', x: 540, y: 1180, width: 1180, height: 24 },
  { id: 'wall-west', style: 'wall', x: 515, y: 320, width: 24, height: 850 },
  { id: 'wall-east', style: 'wall', x: 1720, y: 320, width: 24, height: 850 },
  { id: 'fence-market-road', style: 'fence', x: 470, y: 920, width: 220, height: 26, rotation: -7 },
  {
    id: 'fence-arena-road',
    style: 'fence',
    x: 1700,
    y: 670,
    width: 260,
    height: 26,
    rotation: -11,
  },
  { id: 'torch-gate-west', style: 'torch', x: 548, y: 765, width: 28, height: 64 },
  { id: 'torch-domus', style: 'torch', x: 1320, y: 740, width: 28, height: 64 },
  { id: 'amphora-canteen', style: 'amphora', x: 660, y: 660, width: 42, height: 58 },
  { id: 'amphora-dormitory', style: 'amphora', x: 910, y: 1005, width: 42, height: 58 },
];
