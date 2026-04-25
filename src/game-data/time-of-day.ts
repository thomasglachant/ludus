export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeOfDayVisualTheme {
  skyColor: string;
  terrainColor: string;
  terrainHighlightColor: string;
  overlayColor: string;
  overlayOpacity: number;
  lightColor: string;
  shadowColor: string;
  torchOpacity: number;
  spriteBrightness: number;
}

export interface TimeOfDayDefinition {
  phase: TimeOfDayPhase;
  startHour: number;
  endHour: number;
  overlayClassName: string;
  visualTheme: TimeOfDayVisualTheme;
}

export const TIME_OF_DAY_DEFINITIONS: TimeOfDayDefinition[] = [
  {
    phase: 'dawn',
    startHour: 5,
    endHour: 8,
    overlayClassName: 'ludus-map__viewport--dawn',
    visualTheme: {
      skyColor: '#d99a79',
      terrainColor: '#c7a66b',
      terrainHighlightColor: '#f2d18f',
      overlayColor: '#d96f55',
      overlayOpacity: 0.2,
      lightColor: '#ffe1a1',
      shadowColor: '#5d3c38',
      torchOpacity: 0.45,
      spriteBrightness: 1.04,
    },
  },
  {
    phase: 'day',
    startHour: 8,
    endHour: 18,
    overlayClassName: 'ludus-map__viewport--day',
    visualTheme: {
      skyColor: '#91b9c8',
      terrainColor: '#c4ae71',
      terrainHighlightColor: '#e5c983',
      overlayColor: '#fff3c4',
      overlayOpacity: 0.06,
      lightColor: '#fff1bd',
      shadowColor: '#4f3a28',
      torchOpacity: 0.12,
      spriteBrightness: 1,
    },
  },
  {
    phase: 'dusk',
    startHour: 18,
    endHour: 21,
    overlayClassName: 'ludus-map__viewport--dusk',
    visualTheme: {
      skyColor: '#7b526d',
      terrainColor: '#a6855c',
      terrainHighlightColor: '#d09b61',
      overlayColor: '#87334f',
      overlayOpacity: 0.28,
      lightColor: '#ffbc66',
      shadowColor: '#3d2632',
      torchOpacity: 0.72,
      spriteBrightness: 0.92,
    },
  },
  {
    phase: 'night',
    startHour: 21,
    endHour: 5,
    overlayClassName: 'ludus-map__viewport--night',
    visualTheme: {
      skyColor: '#17283d',
      terrainColor: '#6f6858',
      terrainHighlightColor: '#91805d',
      overlayColor: '#0f2340',
      overlayOpacity: 0.56,
      lightColor: '#ff9f43',
      shadowColor: '#0d1828',
      torchOpacity: 1,
      spriteBrightness: 0.76,
    },
  },
];

export function getTimeOfDayPhase(hour: number): TimeOfDayPhase {
  if (hour >= 5 && hour < 8) {
    return 'dawn';
  }

  if (hour >= 8 && hour < 18) {
    return 'day';
  }

  if (hour >= 18 && hour < 21) {
    return 'dusk';
  }

  return 'night';
}

export function getTimeOfDayDefinition(hour: number) {
  const phase = getTimeOfDayPhase(hour);

  return (
    TIME_OF_DAY_DEFINITIONS.find((definition) => definition.phase === phase) ??
    TIME_OF_DAY_DEFINITIONS[1]
  );
}
