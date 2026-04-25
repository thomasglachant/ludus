import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { Gladiator } from '../../domain/types';
import { translate } from '../../i18n';
import {
  createBuildingPanelViewModel,
  createDormitoryCapacityViewModel,
} from './building-panel-view-model';

function createSave() {
  return createInitialSave({
    createdAt: '2026-04-25T12:00:00.000Z',
    language: 'en',
    ludusName: 'Ludus Magnus',
    ownerName: 'Marcus',
    saveId: 'save-test',
  });
}

const assignedGladiator: Gladiator = {
  age: 24,
  agility: 8,
  currentBuildingId: 'canteen',
  defense: 7,
  energy: 62,
  health: 74,
  id: 'glad-test',
  losses: 1,
  morale: 66,
  name: 'Aulus',
  reputation: 12,
  satiety: 58,
  strength: 9,
  traits: [],
  wins: 2,
};

describe('building panel view models', () => {
  it('prepares building panel data without owning gameplay rules', () => {
    const save = {
      ...createSave(),
      gladiators: [assignedGladiator],
    };

    const viewModel = createBuildingPanelViewModel(save, 'canteen', (key, params) =>
      translate('en', key, params),
    );

    expect(viewModel.nameKey).toBe('buildings.canteen.name');
    expect(viewModel.statusKey).toBe('common.purchased');
    expect(viewModel.action).toMatchObject({
      isAllowed: false,
      labelKey: 'buildings.upgrade',
      validationMessageKey: 'buildings.validation.missingDomusLevel',
    });
    expect(viewModel.effects).toContain('+6 satiety per hour');
    expect(viewModel.improvements.map((improvement) => improvement.id)).toContain('betterKitchen');
    expect(viewModel.policies.map((policy) => policy.id)).toContain('balancedMeals');
    expect(viewModel.assignedGladiators).toEqual([
      {
        id: 'glad-test',
        name: 'Aulus',
        readiness: 66,
      },
    ]);
  });

  it('prepares dormitory capacity display data from domain helpers', () => {
    const save = {
      ...createSave(),
      gladiators: [assignedGladiator],
    };

    expect(createDormitoryCapacityViewModel(save)).toEqual({
      availableBeds: 0,
      capacity: 1,
      maximumPurchasableBeds: 2,
      purchasedBeds: 0,
      usedBeds: 1,
    });
  });
});
