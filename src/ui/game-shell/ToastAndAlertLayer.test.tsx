import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import type { Gladiator } from '../../domain/types';
import { UiStoreProvider } from '../../state/ui-store';
import { ToastAndAlertLayer } from './ToastAndAlertLayer';

const testGladiator: Gladiator = {
  id: 'gladiator-aulus',
  name: 'Aulus Niger',
  age: 27,
  strength: 62,
  agility: 58,
  defense: 64,
  energy: 70,
  health: 82,
  morale: 30,
  satiety: 76,
  reputation: 45,
  wins: 2,
  losses: 1,
  traits: ['disciplined'],
  currentBuildingId: 'pleasureHall',
};

function createSaveWithGladiatorAlert() {
  const save = createInitialSave({
    createdAt: '2026-04-25T10:00:00.000Z',
    ludusName: 'Test Ludus',
    ownerName: 'Marcus',
    saveId: 'save-test',
  });

  return {
    ...save,
    gladiators: [testGladiator],
    planning: {
      ...save.planning,
      alerts: [
        {
          id: 'alert-gladiator-aulus-low-morale',
          severity: 'warning' as const,
          titleKey: 'alerts.lowMorale.title',
          descriptionKey: 'alerts.lowMorale.description',
          gladiatorId: testGladiator.id,
          createdAt: save.updatedAt,
        },
      ],
    },
  };
}

describe('ToastAndAlertLayer', () => {
  it('opens the related gladiator from a gladiator alert', async () => {
    const user = userEvent.setup();
    const onGladiatorSelect = vi.fn();

    render(
      <UiStoreProvider>
        <ToastAndAlertLayer
          errorKey={null}
          save={createSaveWithGladiatorAlert()}
          showAlerts
          onGladiatorSelect={onGladiatorSelect}
        />
      </UiStoreProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Open Aulus Niger' }));

    expect(onGladiatorSelect).toHaveBeenCalledWith('gladiator-aulus');
  });
});
