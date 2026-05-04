import type { VisualAssetManifest } from '../visual-assets';

export const PRODUCTION_VISUAL_ASSET_MANIFEST = {
  version: 1,
  sourceQuality: 'production',
  generatedAt: '2026-04-28T00:00:00.000Z',
  ludus: {
    sourceQuality: 'production',
    background: '/assets/ludus/ludus-background.png',
  },
  homepage: {
    sourceQuality: 'production',
    backgrounds: {
      day: '/assets/main-menu/main-menu-background-day.webp',
    },
  },
  buildings: {
    canteen: {
      'level-1': {
        sourceQuality: 'production',
        width: 1254,
        height: 1254,
        exterior: '/assets/generated/buildings/canteen.png',
      },
    },
    domus: {
      'level-1': {
        sourceQuality: 'production',
        width: 1254,
        height: 1254,
        exterior: '/assets/generated/buildings/domus.png',
      },
    },
    dormitory: {
      'level-1': {
        sourceQuality: 'production',
        width: 1254,
        height: 1254,
        exterior: '/assets/generated/buildings/dormitory.png',
      },
    },
    trainingGround: {
      'level-1': {
        sourceQuality: 'production',
        width: 1254,
        height: 1254,
        exterior: '/assets/generated/buildings/trainingGround.png',
      },
    },
  },
  locations: {
    arena: {
      sourceQuality: 'production',
      combatBackground: '/assets/combat/arena-background.webp',
      exterior: '/assets/generated/buildings/arena.png',
    },
    market: {
      sourceQuality: 'production',
      exterior: '/assets/generated/buildings/market.png',
    },
  },
  gladiators: {},
  ui: {
    'laurel-left': '/assets/ui/laurel-left.png',
  },
} as const satisfies VisualAssetManifest;
