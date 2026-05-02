import { describe, expect, it } from 'vitest';
import { getLudusGladiatorCapacity } from '../domain/ludus/capacity';
import { CURRENT_SCHEMA_VERSION } from '../domain/saves/create-initial-save';
import { isGameSave } from '../domain/saves/save-validation';
import { BUILDING_IDS } from '../game-data/buildings';
import { DEMO_SAVE_DEFINITIONS } from '../game-data/demo-saves';
import { DemoSaveProvider } from './demo-save-provider';
import { SaveNotFoundError } from './save-provider';

function hasBudgetField(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if ('budget' in value) {
    return true;
  }

  return Object.values(value).some(hasBudgetField);
}

describe('DemoSaveProvider', () => {
  it('lists the three demo saves', async () => {
    const provider = new DemoSaveProvider();

    await expect(provider.listSaves()).resolves.toMatchObject([
      { saveId: 'demo-early-ludus', isDemo: true, demoSaveId: 'demo-early-ludus' },
      { saveId: 'demo-mid-ludus', isDemo: true, demoSaveId: 'demo-mid-ludus' },
      { saveId: 'demo-advanced-ludus', isDemo: true, demoSaveId: 'demo-advanced-ludus' },
    ]);
  });

  it('loads a valid demo save', async () => {
    const provider = new DemoSaveProvider();
    const save = await provider.loadSave('demo-early-ludus');

    expect(isGameSave(save)).toBe(true);
    expect(save.metadata).toEqual({
      demoSaveId: 'demo-early-ludus',
    });
  });

  it('returns a deep clone without mutating the source template', async () => {
    const provider = new DemoSaveProvider();
    const save = await provider.loadSave('demo-early-ludus');

    save.player.ludusName = 'Changed';
    save.gladiators[0].name = 'Changed';

    const reloadedSave = await provider.loadSave('demo-early-ludus');
    const sourceDefinition = DEMO_SAVE_DEFINITIONS.find(
      (definition) => definition.id === 'demo-early-ludus',
    );

    expect(reloadedSave.player.ludusName).toBe('Ludus Primus');
    expect(reloadedSave.gladiators[0].name).toBe('Marcus Varro');
    expect(sourceDefinition?.save.player.ludusName).toBe('Ludus Primus');
    expect(sourceDefinition?.save.gladiators[0].name).toBe('Marcus Varro');
  });

  it('throws for unknown demo saves', async () => {
    await expect(new DemoSaveProvider().loadSave('unknown')).rejects.toBeInstanceOf(
      SaveNotFoundError,
    );
  });

  it('does not expose writable template operations', async () => {
    const provider = new DemoSaveProvider();
    const save = await provider.loadSave('demo-early-ludus');

    await expect(provider.createSave(save)).rejects.toThrow('Demo templates cannot be written.');
    await expect(provider.updateSave(save)).rejects.toThrow('Demo templates cannot be written.');
    await expect(provider.deleteSave(save.saveId)).rejects.toThrow(
      'Demo templates cannot be written.',
    );
  });
});

describe('demo save definitions', () => {
  it('match the save schema and demo constraints', () => {
    expect(DEMO_SAVE_DEFINITIONS).toHaveLength(3);

    for (const definition of DEMO_SAVE_DEFINITIONS) {
      const save = definition.save;

      expect(isGameSave(save)).toBe(true);
      expect(save.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(save.metadata).toEqual({
        demoSaveId: definition.id,
      });
      expect(hasBudgetField(save.buildings)).toBe(false);
      expect(getLudusGladiatorCapacity(save)).toBeGreaterThanOrEqual(save.gladiators.length);
      for (const buildingId of BUILDING_IDS) {
        expect(save.buildings[buildingId]).toMatchObject({
          id: buildingId,
        });
        expect(save.buildings[buildingId].level).toBeGreaterThanOrEqual(
          save.buildings[buildingId].isPurchased ? 1 : 0,
        );
      }
      expect(save.market.availableGladiators).toHaveLength(5);

      for (const gladiator of [...save.gladiators, ...save.market.availableGladiators]) {
        expect(gladiator.strength).toBeGreaterThanOrEqual(0);
        expect(gladiator.strength).toBeLessThanOrEqual(100);
        expect(gladiator.agility).toBeGreaterThanOrEqual(0);
        expect(gladiator.agility).toBeLessThanOrEqual(100);
        expect(gladiator.defense).toBeGreaterThanOrEqual(0);
        expect(gladiator.defense).toBeLessThanOrEqual(100);
        expect(gladiator.life).toBeGreaterThanOrEqual(0);
        expect(gladiator.life).toBeLessThanOrEqual(100);
        expect(gladiator.life).toBeGreaterThanOrEqual(0);
        expect(gladiator.life).toBeLessThanOrEqual(100);
        expect(gladiator.life).toBeGreaterThanOrEqual(0);
        expect(gladiator.life).toBeLessThanOrEqual(100);
      }
    }
  });

  it('describe stable early, mid and advanced MVP scenarios', () => {
    const early = DEMO_SAVE_DEFINITIONS.find((definition) => definition.id === 'demo-early-ludus');
    const mid = DEMO_SAVE_DEFINITIONS.find((definition) => definition.id === 'demo-mid-ludus');
    const advanced = DEMO_SAVE_DEFINITIONS.find(
      (definition) => definition.id === 'demo-advanced-ludus',
    );

    expect(early?.save.time).toMatchObject({
      year: 1,
      week: 1,
      dayOfWeek: 'monday',
      phase: 'planning',
    });
    expect(early?.save.gladiators).toHaveLength(3);
    expect(early?.save.market.availableGladiators).toHaveLength(5);
    expect(early?.save.arena.resolvedCombats).toHaveLength(0);

    expect(mid?.save.time).toMatchObject({
      year: 2,
      week: 4,
      dayOfWeek: 'thursday',
      phase: 'planning',
    });
    expect(mid?.save.gladiators).toHaveLength(4);
    expect(mid?.save.arena.resolvedCombats).toHaveLength(0);

    expect(advanced?.save.time).toMatchObject({
      year: 5,
      week: 7,
      dayOfWeek: 'saturday',
      phase: 'planning',
    });
    expect(advanced?.save.gladiators).toHaveLength(6);
    expect(advanced?.save.arena.resolvedCombats).toHaveLength(0);
  });
});
