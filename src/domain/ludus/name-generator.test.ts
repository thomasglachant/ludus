import { describe, expect, it } from 'vitest';
import { generateLudusName } from './name-generator';

describe('ludus name generator', () => {
  it('generates themed ludus names', () => {
    expect(generateLudusName(undefined, () => 0)).toBe('Ludus Aurea');
  });

  it('tries to avoid returning the current value', () => {
    const values = [0, 0.99];
    let index = 0;

    expect(generateLudusName('Ludus Aurea', () => values[index++] ?? 0.99)).toBe('Ludus Victoriae');
  });
});
