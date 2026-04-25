import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import { UiStoreProvider } from '../../state/ui-store';
import { TopHud } from './TopHud';

function createSave() {
  return createInitialSave({
    createdAt: '2026-04-25T10:00:00.000Z',
    language: 'en',
    ludusName: 'Test Ludus',
    ownerName: 'Marcus',
    saveId: 'save-test',
  });
}

describe('TopHud save status', () => {
  it('shows dirty state and manual save action for normal saves', () => {
    render(
      <UiStoreProvider>
        <TopHud
          hasUnsavedChanges
          isSaving={false}
          lastSavedAt="2026-04-25T10:00:00.000Z"
          save={createSave()}
          onOpenMenu={vi.fn()}
          onResetDemo={vi.fn()}
          onSave={vi.fn()}
          onSpeedChange={vi.fn()}
        />
      </UiStoreProvider>,
    );

    expect(screen.getByTestId('save-status')).toHaveTextContent('Unsaved changes');
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });
});
