import { describe, expect, it } from 'vitest';
import { formatMoneyAmount } from './money';

describe('formatMoneyAmount', () => {
  it('formats medium sums with spaces', () => {
    expect(formatMoneyAmount(3_200)).toBe('3 200');
    expect(formatMoneyAmount(12_000)).toBe('12 000');
    expect(formatMoneyAmount(999_999)).toBe('999 999');
  });

  it('compacts large sums with suffixes', () => {
    expect(formatMoneyAmount(1_000_000)).toBe('1M');
    expect(formatMoneyAmount(1_500_000)).toBe('1.5M');
  });
});
