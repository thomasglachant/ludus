import { describe, expect, it } from 'vitest';
import { isDemoModeEnabled } from './features';

describe('feature flags', () => {
  it('enables demo mode only for the exact true string', () => {
    expect(isDemoModeEnabled('true')).toBe(true);
    expect(isDemoModeEnabled('false')).toBe(false);
    expect(isDemoModeEnabled(undefined)).toBe(false);
    expect(isDemoModeEnabled('TRUE')).toBe(false);
    expect(isDemoModeEnabled('1')).toBe(false);
  });
});
