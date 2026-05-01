import { describe, expect, it } from 'vitest';
import { getTimeOfDayDefinition } from '../../game-data/time-of-day';
import { resolveMapTimeOfDayPhase } from './time-of-day-visuals';

describe('time of day visuals', () => {
  it('selects explicit visual themes without reading a game clock', () => {
    const dawn = getTimeOfDayDefinition('dawn');
    const day = getTimeOfDayDefinition('day').visualTheme;

    expect(dawn.phase).toBe('dawn');
    expect(getTimeOfDayDefinition().phase).toBe('day');
    expect(getTimeOfDayDefinition('day').visualTheme.skyColor).toBe(day.skyColor);
    expect(day.skyColor).toBe('#91b9c8');
  });

  it('resolves map themes from the weekly day and macro phase', () => {
    const night = getTimeOfDayDefinition('night').visualTheme;

    expect(
      resolveMapTimeOfDayPhase({
        year: 1,
        week: 1,
        dayOfWeek: 'monday',
        phase: 'planning',
      }),
    ).toBe('dawn');
    expect(
      resolveMapTimeOfDayPhase({
        year: 2,
        week: 4,
        dayOfWeek: 'thursday',
        phase: 'planning',
      }),
    ).toBe('day');
    expect(
      resolveMapTimeOfDayPhase({
        year: 5,
        week: 7,
        dayOfWeek: 'saturday',
        phase: 'planning',
      }),
    ).toBe('dusk');
    expect(
      resolveMapTimeOfDayPhase({
        year: 1,
        week: 1,
        dayOfWeek: 'wednesday',
        phase: 'event',
      }),
    ).toBe('night');
    expect(getTimeOfDayDefinition('night').visualTheme.overlayOpacity).toBe(night.overlayOpacity);
    expect(night.overlayOpacity).toBe(0.56);
  });
});
