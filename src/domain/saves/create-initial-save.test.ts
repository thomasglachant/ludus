import { describe, expect, it } from 'vitest';
import { INITIAL_TREASURY } from '../../game-data/economy';
import { createInitialSave } from './create-initial-save';

describe('createInitialSave', () => {
  it('creates the first playable save foundation', () => {
    const save = createInitialSave({
      ownerName: 'Marcus',
      ludusName: 'Ludus Magnus',
      language: 'en',
      saveId: 'save-test',
      createdAt: '2026-04-25T12:00:00.000Z',
    });

    expect(save.schemaVersion).toBe(1);
    expect(save.ludus.treasury).toBe(INITIAL_TREASURY);
    expect(save.time).toMatchObject({
      year: 1,
      week: 1,
      dayOfWeek: 'monday',
      hour: 8,
      minute: 0,
      speed: 1,
    });
    expect(save.buildings.domus).toMatchObject({
      id: 'domus',
      isPurchased: true,
      level: 1,
    });
    expect(save.buildings.canteen.isPurchased).toBe(false);
    expect(save.gladiators).toEqual([]);
    expect(save.market.availableGladiators).toHaveLength(5);
  });
});
