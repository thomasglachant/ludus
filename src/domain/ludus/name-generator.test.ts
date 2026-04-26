import { describe, expect, it } from 'vitest';
import { generateLudusName, generateLudusOwnerName } from './name-generator';

describe('ludus name generator', () => {
  it('generates themed owner names', () => {
    expect(generateLudusOwnerName(undefined, () => 0)).toBe('Aelia Varro');
  });

  it('generates themed ludus names', () => {
    expect(generateLudusName(undefined, () => 0)).toBe('Ludus Aurea');
  });

  it('tries to avoid returning the current value', () => {
    const values = [0, 0.99];
    let index = 0;

    expect(generateLudusOwnerName('Aelia Varro', () => values[index++] ?? 0.99)).toBe(
      'Vibia Maxima',
    );
  });
});
