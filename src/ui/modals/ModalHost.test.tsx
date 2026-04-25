import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiStoreProvider, useUiStore } from '../../state/ui-store';
import { ModalHost } from './ModalHost';

function ModalHarness({
  onConfirm,
  onSubmit,
}: {
  onConfirm(): void;
  onSubmit(values: Record<string, string>): void;
}) {
  const { openConfirmModal, openFormModal } = useUiStore();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openConfirmModal({
            kind: 'confirm',
            messageKey: 'loadGame.empty',
            onConfirm,
            titleKey: 'options.title',
          })
        }
      >
        Open confirm
      </button>
      <button
        type="button"
        onClick={() =>
          openFormModal({
            fields: [
              {
                id: 'ownerName',
                labelKey: 'newGame.ownerName',
                required: true,
              },
            ],
            kind: 'form',
            onSubmit,
            submitLabelKey: 'common.create',
            titleKey: 'newGame.title',
          })
        }
      >
        Open form
      </button>
      <ModalHost />
    </>
  );
}

describe('ModalHost', () => {
  it('renders and resolves confirmation modals from UI store state', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <UiStoreProvider>
        <ModalHarness onConfirm={onConfirm} onSubmit={vi.fn()} />
      </UiStoreProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Open confirm' }));

    expect(screen.getByRole('dialog', { name: 'Options' })).toBeInTheDocument();
    expect(screen.getByText('No local save yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Options' })).not.toBeInTheDocument();
  });

  it('renders and submits lightweight form modals from UI store state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <UiStoreProvider>
        <ModalHarness onConfirm={vi.fn()} onSubmit={onSubmit} />
      </UiStoreProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Open form' }));
    await user.type(screen.getByLabelText('Owner name'), 'Marcus');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ ownerName: 'Marcus' });
    expect(screen.queryByRole('dialog', { name: 'New game' })).not.toBeInTheDocument();
  });
});
