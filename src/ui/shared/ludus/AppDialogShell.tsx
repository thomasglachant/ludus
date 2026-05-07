import { type ReactNode } from 'react';

import { useUiStore, type ModalSize } from '@/state/ui-store-context';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/ui/shared/primitives/Dialog';
import { IconButton } from './IconButton';

interface AppDialogShellProps {
  children: ReactNode;
  description?: ReactNode;
  descriptionKey?: string;
  descriptionParams?: Record<string, string | number>;
  dismissible?: boolean;
  footer?: ReactNode;
  isActive?: boolean;
  onBack?(): void;
  onClose(): void;
  size?: ModalSize;
  testId?: string;
  title?: ReactNode;
  titleKey?: string;
  titleParams?: Record<string, string | number>;
}

export function AppDialogShell({
  children,
  description,
  descriptionKey,
  descriptionParams,
  dismissible = true,
  footer,
  isActive = true,
  onBack,
  onClose,
  size = 'md',
  testId,
  title,
  titleKey,
  titleParams,
}: AppDialogShellProps) {
  const { t } = useUiStore();
  const descriptionContent = descriptionKey ? t(descriptionKey, descriptionParams) : description;
  const inactiveProps = isActive ? {} : { 'data-app-inactive': true };
  const descriptionProps = descriptionContent ? {} : { 'aria-describedby': undefined };

  return (
    <Dialog
      open={isActive}
      onOpenChange={(isOpen) => {
        if (!isOpen && isActive && dismissible) {
          onClose();
        }
      }}
    >
      <DialogPortal forceMount>
        <DialogOverlay
          className="app-modal-backdrop app-dialog__overlay"
          data-testid={testId}
          forceMount
          {...inactiveProps}
        />
        <DialogContent
          className={`app-modal app-modal--${size} app-dialog__content`}
          forceMount
          onEscapeKeyDown={(event) => {
            if (!dismissible) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (!dismissible) {
              event.preventDefault();
            }
          }}
          {...descriptionProps}
          {...inactiveProps}
        >
          <div className="app-modal__header">
            {dismissible && onBack ? (
              <IconButton
                aria-label={t('common.back')}
                className="app-modal__back"
                variant="ghost"
                onClick={onBack}
              >
                <GameIcon color="currentColor" name="back" size={18} />
              </IconButton>
            ) : null}
            <DialogTitle asChild>
              <h1 className="app-modal__title">{titleKey ? t(titleKey, titleParams) : title}</h1>
            </DialogTitle>
            {dismissible ? (
              <DialogClose asChild>
                <IconButton
                  aria-label={t('common.close')}
                  className="app-modal__close"
                  variant="ghost"
                >
                  <GameIcon color="currentColor" name="close" size={18} />
                </IconButton>
              </DialogClose>
            ) : null}
          </div>
          {descriptionContent ? (
            <DialogDescription className="app-modal__description">
              {descriptionContent}
            </DialogDescription>
          ) : null}
          <div className="app-modal__body">{children}</div>
          {footer ? <div className="app-modal__footer">{footer}</div> : null}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
