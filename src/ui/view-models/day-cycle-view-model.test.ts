import { describe, expect, it } from 'vitest';
import { getDayCycleViewModel } from './day-cycle-view-model';

describe('day cycle view model', () => {
  it('starts the visible cycle at dawn', () => {
    const viewModel = getDayCycleViewModel({ hour: 5, minute: 0 });

    expect(viewModel.phase).toBe('dawn');
    expect(viewModel.progressPercent).toBe(0);
  });

  it('places noon inside the day segment without exposing clock text', () => {
    const viewModel = getDayCycleViewModel({ hour: 12, minute: 0 });

    expect(viewModel.phase).toBe('day');
    expect(viewModel.progressPercent).toBeCloseTo(29.17, 2);
  });

  it('keeps the wrapped night segment at the end of the cycle', () => {
    const viewModel = getDayCycleViewModel({ hour: 23, minute: 0 });

    expect(viewModel.phase).toBe('night');
    expect(viewModel.progressPercent).toBe(75);
    expect(viewModel.segments.map((segment) => segment.phase)).toEqual([
      'dawn',
      'day',
      'dusk',
      'night',
    ]);
    expect(viewModel.segments.map((segment) => segment.widthPercent)).toEqual([
      12.5, 41.66666666666667, 12.5, 33.33333333333333,
    ]);
  });
});
