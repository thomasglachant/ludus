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
          aria-hidden={isActive ? undefined : true}
          className={['app-modal-backdrop', isActive ? null : 'app-modal-backdrop--inactive']
            .filter(Boolean)
            .join(' ')}
          data-testid={modal.testId ?? 'confirm-dialog'}
          forceMount
        >
          <AlertDialogContent className={`app-modal app-modal--${modal.size ?? 'md'}`} forceMount>
            <div className="app-modal__header">
              <div className="app-modal__title">
                <AlertDialogTitle asChild>
                  <h1>{t(modal.titleKey, modal.titleParams)}</h1>
                </AlertDialogTitle>
              </div>
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
                  <Button>
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
        </AlertDialogOverlay>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
