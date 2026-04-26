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

  it('prepares improvement and policy action status with validation reasons', () => {
    const viewModel = createBuildingPanelViewModel(createSave(), 'dormitory', (key, params) =>
      translate('en', key, params),
    );
    const woodenBeds = viewModel.improvements.find(
      (improvement) => improvement.id === 'woodenBeds',
    );
    const strawBeds = viewModel.improvements.find((improvement) => improvement.id === 'strawBeds');

    expect(strawBeds).toMatchObject({
      canPurchase: true,
      isPurchased: false,
      requiredBuildingLevel: 1,
      validationMessageKey: null,
    });
    expect(woodenBeds).toMatchObject({
      canPurchase: false,
      validationMessageKey: 'buildings.validation.missingImprovementPrerequisite',
    });
    expect(woodenBeds?.requiredImprovementNames).toEqual(['Straw beds']);
  });

  it('prepares selected policy status and paid policy actions', () => {
    const viewModel = createBuildingPanelViewModel(createSave(), 'canteen', (key, params) =>
      translate('en', key, params),
    );
    const selectedPolicy = viewModel.policies.find((policy) => policy.id === 'balancedMeals');
    const paidPolicy = viewModel.policies.find((policy) => policy.id === 'richMeals');

    expect(selectedPolicy).toMatchObject({
      canSelect: false,
      isSelected: true,
      validationMessageKey: 'buildings.validation.alreadySelectedPolicy',
    });
    expect(paidPolicy).toMatchObject({
      canSelect: true,
      cost: 40,
      isSelected: false,
      validationMessageKey: null,
    });
  });

  it('prepares dormitory capacity display data from domain helpers', () => {
    const save = {
      ...createSave(),
      gladiators: [assignedGladiator],
    };

    expect(createDormitoryCapacityViewModel(save)).toEqual({
      availableBeds: 0,
      capacity: 1,
      usedBeds: 1,
    });
  });
});
