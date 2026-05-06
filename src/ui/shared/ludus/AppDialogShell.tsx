import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

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
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalOffset, setModalOffset] = useState(0);
  const [modalBottomOffset, setModalBottomOffset] = useState(18);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const modal = modalRef.current;

    if (!modal) {
      return undefined;
    }

    const updateModalOffset = () => {
      const preferredTopOffset = Math.min(Math.max(window.innerHeight * 0.12, 28), 112);
      const centeredTopOffset = Math.max((window.innerHeight - modal.offsetHeight) / 2, 18);
      const modalOffset = Math.min(preferredTopOffset, centeredTopOffset);
      const bottomOffset = Math.max(18, modalOffset);
      const availableHeight = window.innerHeight - modalOffset - bottomOffset;

      setModalOffset(modalOffset);
      setModalBottomOffset(bottomOffset);
      modal.style.setProperty('--app-modal-available-height', `${availableHeight}px`);
    };

    const resizeObserver = new ResizeObserver(updateModalOffset);

    updateModalOffset();
    resizeObserver.observe(modal);
    window.addEventListener('resize', updateModalOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateModalOffset);
    };
  }, [children, footer, isActive]);

  const modalStyle: CSSProperties & Record<string, string | number> = {
    marginBottom: modalBottomOffset,
    marginTop: modalOffset,
  };
  const descriptionContent = descriptionKey ? t(descriptionKey, descriptionParams) : description;

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
          aria-hidden={isActive ? undefined : true}
          className={['app-modal-backdrop', isActive ? null : 'app-modal-backdrop--inactive']
            .filter(Boolean)
            .join(' ')}
          data-testid={testId}
          forceMount
        >
          <DialogContent
            aria-labelledby={titleId}
            className={`app-modal app-modal--${size}`}
            forceMount
            ref={modalRef}
            style={modalStyle}
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
            onOpenAutoFocus={(event) => {
              if (dismissible) {
                event.preventDefault();
                closeButtonRef.current?.focus();
              }
            }}
          >
            <div className="app-modal__header">
              {dismissible && onBack ? (
                <IconButton
                  aria-label={t('common.back')}
                  className="app-modal__back"
                  variant="secondary"
                  onClick={onBack}
                >
                  <GameIcon color="currentColor" name="back" size={18} />
                </IconButton>
              ) : null}
              <div className="app-modal__title">
                <DialogTitle asChild>
                  <h1 id={titleId}>{titleKey ? t(titleKey, titleParams) : title}</h1>
                </DialogTitle>
              </div>
              {dismissible ? (
                <DialogClose asChild>
                  <IconButton
                    aria-label={t('common.close')}
                    className="app-modal__close"
                    ref={closeButtonRef}
                    variant="secondary"
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
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}
