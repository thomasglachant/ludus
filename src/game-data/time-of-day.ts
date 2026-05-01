export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeOfDayVisualTheme {
  skyColor: string;
  terrainColor: string;
  terrainHighlightColor: string;
  overlayColor: string;
  overlayOpacity: number;
  lightColor: string;
  shadowColor: string;
  spriteBrightness: number;
  buildingLightOpacity: number;
}

export interface TimeOfDayDefinition {
  phase: TimeOfDayPhase;
  overlayClassName: string;
  visualTheme: TimeOfDayVisualTheme;
}

export const TIME_OF_DAY_DEFINITIONS: TimeOfDayDefinition[] = [
  {
    phase: 'dawn',
    overlayClassName: 'ludus-map__viewport--dawn',
    visualTheme: {
      skyColor: '#d99a79',
      terrainColor: '#c7a66b',
      terrainHighlightColor: '#f2d18f',
      overlayColor: '#d96f55',
      overlayOpacity: 0.2,
      lightColor: '#ffe1a1',
      shadowColor: '#5d3c38',
      spriteBrightness: 1.04,
      buildingLightOpacity: 0.08,
    },
  },
  {
    phase: 'day',
    overlayClassName: 'ludus-map__viewport--day',
    visualTheme: {
      skyColor: '#91b9c8',
      terrainColor: '#c4ae71',
      terrainHighlightColor: '#e5c983',
      overlayColor: '#fff3c4',
      overlayOpacity: 0.06,
      lightColor: '#fff1bd',
      shadowColor: '#4f3a28',
      spriteBrightness: 1,
      buildingLightOpacity: 0,
    },
  },
  {
    phase: 'dusk',
    overlayClassName: 'ludus-map__viewport--dusk',
    visualTheme: {
      skyColor: '#7b526d',
      terrainColor: '#a6855c',
      terrainHighlightColor: '#d09b61',
      overlayColor: '#87334f',
      overlayOpacity: 0.28,
      lightColor: '#ffbc66',
      shadowColor: '#3d2632',
      spriteBrightness: 0.92,
      buildingLightOpacity: 0.16,
    },
  },
  {
    phase: 'night',
    overlayClassName: 'ludus-map__viewport--night',
    visualTheme: {
      skyColor: '#17283d',
      terrainColor: '#6f6858',
      terrainHighlightColor: '#91805d',
      overlayColor: '#0f2340',
      overlayOpacity: 0.56,
      lightColor: '#ff9f43',
      shadowColor: '#0d1828',
      spriteBrightness: 0.82,
      buildingLightOpacity: 0.3,
    },
  },
];

export function getTimeOfDayDefinition(phase: TimeOfDayPhase = 'day') {
  return (
    TIME_OF_DAY_DEFINITIONS.find((definition) => definition.phase === phase) ??
    TIME_OF_DAY_DEFINITIONS[1]
  );
}
