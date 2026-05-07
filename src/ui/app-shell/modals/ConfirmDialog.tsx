import { useUiStore, type UiModalState } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/ui/shared/primitives/AlertDialog';

interface ConfirmDialogProps {
  isActive: boolean;
  modal: Extract<UiModalState, { kind: 'confirm' }>;
}

export function ConfirmDialog({ isActive, modal }: ConfirmDialogProps) {
  const { closeModal, t } = useUiStore();
  const inactiveProps = isActive ? {} : { 'data-app-inactive': true };

  return (
    <AlertDialog
      open={isActive}
      onOpenChange={(isOpen) => {
        if (!isOpen && isActive) {
          closeModal();
        }
      }}
    >
      <AlertDialogPortal forceMount>
        <AlertDialogOverlay
          className="app-modal-backdrop app-dialog__overlay"
          data-testid={modal.testId ?? 'confirm-dialog'}
          forceMount
          {...inactiveProps}
        />
        <AlertDialogContent
          className={`app-modal app-modal--${modal.size ?? 'md'} app-dialog__content`}
          forceMount
          {...inactiveProps}
        >
          <div className="app-modal__header">
            <AlertDialogTitle asChild>
              <h1 className="app-modal__title">{t(modal.titleKey, modal.titleParams)}</h1>
            </AlertDialogTitle>
          </div>
          <div className="app-modal__body">
            <AlertDialogDescription asChild>
              <div
                className={[
                  'confirm-dialog',
                  `confirm-dialog--${modal.tone ?? 'default'}`,
                  modal.content ? 'confirm-dialog--rich' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {modal.content ?? <p>{t(modal.messageKey, modal.messageParams)}</p>}
              </div>
            </AlertDialogDescription>
          </div>
          <div className="app-modal__footer">
            <ActionBar className="confirm-dialog__actions">
              <AlertDialogCancel asChild>
                <Button variant="ghost">
                  <span>{t(modal.cancelLabelKey ?? 'common.cancel')}</span>
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                {modal.tone === 'danger' ? (
                  <Button variant="danger" onClick={modal.onConfirm}>
                    <span>{t(modal.confirmLabelKey ?? 'common.confirm')}</span>
                  </Button>
                ) : (
                  <PrimaryActionButton onClick={modal.onConfirm}>
                    <span>{t(modal.confirmLabelKey ?? 'common.confirm')}</span>
                  </PrimaryActionButton>
                )}
              </AlertDialogAction>
            </ActionBar>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
