import type { VisualAssetManifest } from '../visual-assets';

export const PRODUCTION_VISUAL_ASSET_MANIFEST = {
  version: 1,
  sourceQuality: 'production',
  generatedAt: '2026-04-28T00:00:00.000Z',
  homepage: {
    sourceQuality: 'production',
    backgrounds: {
      day: '/assets/main-menu/main-menu-background-day.webp',
    },
  },
  buildings: {},
  locations: {
    arena: {
      sourceQuality: 'production',
      combatBackground: '/assets/combat/arena-background.webp',
      crowd: '/assets/combat/arena-crowd.webp',
    },
  },
  gladiators: {
    'gladiator-01': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-01/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-01/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-01/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-01/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-01/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-01/map/map-idle-0.png',
          '/assets/gladiators/gladiator-01/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-01/map/map-walk-0.png',
          '/assets/gladiators/gladiator-01/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-01/map/map-train-0.png',
          '/assets/gladiators/gladiator-01/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-01/map/map-eat-0.png',
          '/assets/gladiators/gladiator-01/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-01/map/map-rest-0.png',
          '/assets/gladiators/gladiator-01/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-01/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-01/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-01/map/map-healing-0.png',
          '/assets/gladiators/gladiator-01/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-01/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-01/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-01/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-01/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-01/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-01/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-01/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-olive',
      bodyType: 'compact',
      hairStyle: 'cropped',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'cropped',
      headwearStyle: 'none',
      bodyBuildStyle: 'compact',
      skinTone: 'olive',
      markingStyle: 'none',
    },
    'gladiator-02': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-02/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-02/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-02/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-02/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-02/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-02/map/map-idle-0.png',
          '/assets/gladiators/gladiator-02/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-02/map/map-walk-0.png',
          '/assets/gladiators/gladiator-02/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-02/map/map-train-0.png',
          '/assets/gladiators/gladiator-02/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-02/map/map-eat-0.png',
          '/assets/gladiators/gladiator-02/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-02/map/map-rest-0.png',
          '/assets/gladiators/gladiator-02/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-02/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-02/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-02/map/map-healing-0.png',
          '/assets/gladiators/gladiator-02/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-02/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-02/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-02/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-02/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-02/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-02/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-02/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-tan',
      bodyType: 'lean',
      hairStyle: 'clothWrap',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'cropped',
      headwearStyle: 'clothWrap',
      bodyBuildStyle: 'lean',
      skinTone: 'tan',
      markingStyle: 'cheekScar',
    },
    'gladiator-03': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-03/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-03/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-03/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-03/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-03/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-03/map/map-idle-0.png',
          '/assets/gladiators/gladiator-03/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-03/map/map-walk-0.png',
          '/assets/gladiators/gladiator-03/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-03/map/map-train-0.png',
          '/assets/gladiators/gladiator-03/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-03/map/map-eat-0.png',
          '/assets/gladiators/gladiator-03/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-03/map/map-rest-0.png',
          '/assets/gladiators/gladiator-03/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-03/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-03/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-03/map/map-healing-0.png',
          '/assets/gladiators/gladiator-03/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-03/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-03/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-03/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-03/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-03/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-03/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-03/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-bronze',
      bodyType: 'broad',
      hairStyle: 'bronzeGalea',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'cropped',
      headwearStyle: 'bronzeGalea',
      bodyBuildStyle: 'broad',
      skinTone: 'bronze',
      markingStyle: 'browScar',
    },
    'gladiator-04': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-04/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-04/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-04/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-04/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-04/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-04/map/map-idle-0.png',
          '/assets/gladiators/gladiator-04/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-04/map/map-walk-0.png',
          '/assets/gladiators/gladiator-04/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-04/map/map-train-0.png',
          '/assets/gladiators/gladiator-04/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-04/map/map-eat-0.png',
          '/assets/gladiators/gladiator-04/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-04/map/map-rest-0.png',
          '/assets/gladiators/gladiator-04/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-04/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-04/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-04/map/map-healing-0.png',
          '/assets/gladiators/gladiator-04/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-04/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-04/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-04/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-04/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-04/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-04/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-04/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-dark',
      bodyType: 'tall',
      hairStyle: 'crestedHelmet',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'cropped',
      headwearStyle: 'crestedHelmet',
      bodyBuildStyle: 'tall',
      skinTone: 'dark',
      markingStyle: 'warPaint',
    },
    'gladiator-05': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-05/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-05/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-05/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-05/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-05/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-05/map/map-idle-0.png',
          '/assets/gladiators/gladiator-05/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-05/map/map-walk-0.png',
          '/assets/gladiators/gladiator-05/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-05/map/map-train-0.png',
          '/assets/gladiators/gladiator-05/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-05/map/map-eat-0.png',
          '/assets/gladiators/gladiator-05/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-05/map/map-rest-0.png',
          '/assets/gladiators/gladiator-05/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-05/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-05/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-05/map/map-healing-0.png',
          '/assets/gladiators/gladiator-05/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-05/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-05/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-05/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-05/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-05/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-05/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-05/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-olive',
      bodyType: 'stocky',
      hairStyle: 'ironMask',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'cropped',
      headwearStyle: 'ironMask',
      bodyBuildStyle: 'stocky',
      skinTone: 'olive',
      markingStyle: 'arenaDust',
    },
    'gladiator-06': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-06/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-06/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-06/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-06/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-06/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-06/map/map-idle-0.png',
          '/assets/gladiators/gladiator-06/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-06/map/map-walk-0.png',
          '/assets/gladiators/gladiator-06/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-06/map/map-train-0.png',
          '/assets/gladiators/gladiator-06/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-06/map/map-eat-0.png',
          '/assets/gladiators/gladiator-06/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-06/map/map-rest-0.png',
          '/assets/gladiators/gladiator-06/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-06/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-06/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-06/map/map-healing-0.png',
          '/assets/gladiators/gladiator-06/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-06/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-06/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-06/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-06/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-06/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-06/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-06/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-tan',
      bodyType: 'compact',
      hairStyle: 'curly',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'curly',
      headwearStyle: 'none',
      bodyBuildStyle: 'compact',
      skinTone: 'tan',
      markingStyle: 'none',
    },
    'gladiator-07': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-07/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-07/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-07/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-07/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-07/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-07/map/map-idle-0.png',
          '/assets/gladiators/gladiator-07/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-07/map/map-walk-0.png',
          '/assets/gladiators/gladiator-07/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-07/map/map-train-0.png',
          '/assets/gladiators/gladiator-07/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-07/map/map-eat-0.png',
          '/assets/gladiators/gladiator-07/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-07/map/map-rest-0.png',
          '/assets/gladiators/gladiator-07/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-07/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-07/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-07/map/map-healing-0.png',
          '/assets/gladiators/gladiator-07/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-07/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-07/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-07/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-07/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-07/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-07/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-07/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-umber',
      bodyType: 'lean',
      hairStyle: 'clothWrap',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'curly',
      headwearStyle: 'clothWrap',
      bodyBuildStyle: 'lean',
      skinTone: 'umber',
      markingStyle: 'cheekScar',
    },
    'gladiator-08': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-08/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-08/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-08/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-08/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-08/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-08/map/map-idle-0.png',
          '/assets/gladiators/gladiator-08/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-08/map/map-walk-0.png',
          '/assets/gladiators/gladiator-08/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-08/map/map-train-0.png',
          '/assets/gladiators/gladiator-08/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-08/map/map-eat-0.png',
          '/assets/gladiators/gladiator-08/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-08/map/map-rest-0.png',
          '/assets/gladiators/gladiator-08/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-08/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-08/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-08/map/map-healing-0.png',
          '/assets/gladiators/gladiator-08/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-08/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-08/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-08/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-08/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-08/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-08/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-08/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-dark',
      bodyType: 'broad',
      hairStyle: 'bronzeGalea',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'curly',
      headwearStyle: 'bronzeGalea',
      bodyBuildStyle: 'broad',
      skinTone: 'dark',
      markingStyle: 'browScar',
    },
    'gladiator-09': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-09/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-09/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-09/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-09/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-09/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-09/map/map-idle-0.png',
          '/assets/gladiators/gladiator-09/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-09/map/map-walk-0.png',
          '/assets/gladiators/gladiator-09/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-09/map/map-train-0.png',
          '/assets/gladiators/gladiator-09/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-09/map/map-eat-0.png',
          '/assets/gladiators/gladiator-09/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-09/map/map-rest-0.png',
          '/assets/gladiators/gladiator-09/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-09/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-09/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-09/map/map-healing-0.png',
          '/assets/gladiators/gladiator-09/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-09/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-09/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-09/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-09/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-09/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-09/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-09/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-olive',
      bodyType: 'tall',
      hairStyle: 'crestedHelmet',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'curly',
      headwearStyle: 'crestedHelmet',
      bodyBuildStyle: 'tall',
      skinTone: 'olive',
      markingStyle: 'warPaint',
    },
    'gladiator-10': {
      sourceQuality: 'production',
      portrait: '/assets/gladiators/gladiator-10/portrait.png',
      mapSpritesheet: '/assets/gladiators/gladiator-10/map-spritesheet.png',
      mapAtlas: '/assets/gladiators/gladiator-10/map-spritesheet.json',
      combatSpritesheet: '/assets/gladiators/gladiator-10/combat-spritesheet.png',
      combatAtlas: '/assets/gladiators/gladiator-10/combat-spritesheet.json',
      frames: {
        'map-idle': [
          '/assets/gladiators/gladiator-10/map/map-idle-0.png',
          '/assets/gladiators/gladiator-10/map/map-idle-1.png',
        ],
        'map-walk': [
          '/assets/gladiators/gladiator-10/map/map-walk-0.png',
          '/assets/gladiators/gladiator-10/map/map-walk-1.png',
        ],
        'map-train': [
          '/assets/gladiators/gladiator-10/map/map-train-0.png',
          '/assets/gladiators/gladiator-10/map/map-train-1.png',
        ],
        'map-eat': [
          '/assets/gladiators/gladiator-10/map/map-eat-0.png',
          '/assets/gladiators/gladiator-10/map/map-eat-1.png',
        ],
        'map-rest': [
          '/assets/gladiators/gladiator-10/map/map-rest-0.png',
          '/assets/gladiators/gladiator-10/map/map-rest-1.png',
        ],
        'map-celebrate': [
          '/assets/gladiators/gladiator-10/map/map-celebrate-0.png',
          '/assets/gladiators/gladiator-10/map/map-celebrate-1.png',
        ],
        'map-healing': [
          '/assets/gladiators/gladiator-10/map/map-healing-0.png',
          '/assets/gladiators/gladiator-10/map/map-healing-1.png',
        ],
        'combat-idle': [
          '/assets/gladiators/gladiator-10/combat/combat-idle-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-idle-1.png',
        ],
        'combat-attack': [
          '/assets/gladiators/gladiator-10/combat/combat-attack-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-attack-1.png',
        ],
        'combat-hit': [
          '/assets/gladiators/gladiator-10/combat/combat-hit-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-hit-1.png',
        ],
        'combat-block': [
          '/assets/gladiators/gladiator-10/combat/combat-block-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-block-1.png',
        ],
        'combat-defeat': [
          '/assets/gladiators/gladiator-10/combat/combat-defeat-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-defeat-1.png',
        ],
        'combat-victory': [
          '/assets/gladiators/gladiator-10/combat/combat-victory-0.png',
          '/assets/gladiators/gladiator-10/combat/combat-victory-1.png',
        ],
      },
      paletteId: 'madderRed-bronze',
      bodyType: 'stocky',
      hairStyle: 'ironMask',
      armorStyle: 'subligaculum',
      clothingStyle: 'subligaculum',
      clothingColor: 'madderRed',
      hairAndBeardStyle: 'curly',
      headwearStyle: 'ironMask',
      bodyBuildStyle: 'stocky',
      skinTone: 'bronze',
      markingStyle: 'none',
    },
  },
  ui: {
    'laurel-left': '/assets/ui/laurel-left.png',
  },
} as const satisfies VisualAssetManifest;
