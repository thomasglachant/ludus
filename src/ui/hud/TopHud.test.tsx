import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import { UiStoreProvider } from '../../state/ui-store';
import { TopHud } from './TopHud';

function createSave() {
  return createInitialSave({
    createdAt: '2026-04-25T10:00:00.000Z',
    ludusName: 'Test Ludus',
    ownerName: 'Marcus',
    saveId: 'save-test',
  });
}

describe('TopHud', () => {
  it('keeps save status hidden while preserving the manual save action', () => {
    render(
      <UiStoreProvider>
        <TopHud
          alertCount={0}
          areAlertsOpen={false}
          isSaving={false}
          save={createSave()}
          onAlertsToggle={vi.fn()}
          onOpenMenu={vi.fn()}
          onSave={vi.fn()}
          onSpeedChange={vi.fn()}
        />
      </UiStoreProvider>,
    );

    expect(screen.queryByTestId('save-status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('shows the day cycle without exposing an exact clock', () => {
    render(
      <UiStoreProvider>
        <TopHud
          alertCount={0}
          areAlertsOpen={false}
          isSaving={false}
          save={createSave()}
          onAlertsToggle={vi.fn()}
          onOpenMenu={vi.fn()}
          onSave={vi.fn()}
          onSpeedChange={vi.fn()}
        />
      </UiStoreProvider>,
    );

    expect(screen.getByTestId('day-cycle-gauge')).toHaveTextContent('Day');
    expect(screen.queryByText('08:00')).not.toBeInTheDocument();
  });

  it('shows the alert count in the top bar action', () => {
    render(
      <UiStoreProvider>
        <TopHud
          alertCount={3}
          areAlertsOpen={false}
          isSaving={false}
          save={createSave()}
          onAlertsToggle={vi.fn()}
          onOpenMenu={vi.fn()}
          onSave={vi.fn()}
          onSpeedChange={vi.fn()}
        />
      </UiStoreProvider>,
    );

    expect(screen.getByRole('button', { name: 'Alerts (3)' })).toHaveTextContent('3');
  });
});
