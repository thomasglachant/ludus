import { describe, expect, it } from 'vitest';
import { getTimeOfDayDefinition } from '../../game-data/time-of-day';

describe('time of day visuals', () => {
  it('switches to the next target theme once at the phase boundary', () => {
    const dawn = getTimeOfDayDefinition(7);
    const day = getTimeOfDayDefinition(8).visualTheme;

    expect(dawn.phase).toBe('dawn');
    expect(getTimeOfDayDefinition(8).phase).toBe('day');
    expect(getTimeOfDayDefinition(8).visualTheme.skyColor).toBe(day.skyColor);
    expect(day.skyColor).toBe('#91b9c8');
  });

  it('leaves the display animation to the renderer instead of blending by minute', () => {
    const night = getTimeOfDayDefinition(22).visualTheme;

    expect(getTimeOfDayDefinition(22).visualTheme.overlayOpacity).toBe(night.overlayOpacity);
    expect(night.overlayOpacity).toBe(0.56);
  });
});
