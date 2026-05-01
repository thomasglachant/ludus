export type LudusMapTextureId = 'grass' | 'sand' | 'stonePath' | 'wallStone';

export const LUDUS_MAP_TEXTURE_ASSET_PATHS = {
  grass: '/assets/generated/map/textures/grass.png',
  sand: '/assets/generated/map/textures/sand.png',
  stonePath: '/assets/generated/map/textures/stone-path.png',
  wallStone: '/assets/generated/map/textures/wall-stone.png',
} as const satisfies Record<LudusMapTextureId, string>;
