import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { useUiStore, type ModalSize } from '../../state/ui-store-context';
import { GameIcon } from '../icons/GameIcon';
import { Dialog, DialogClose, DialogTitle } from '../primitives/Dialog';
import { RomanButton } from './RomanButton';

interface ParchmentModalProps {
  children: ReactNode;
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

export function ParchmentModal({
  children,
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
}: ParchmentModalProps) {
  const { t } = useUiStore();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLElement | null>(null);
  const [modalOffset, setModalOffset] = useState(0);
  const [modalBottomOffset, setModalBottomOffset] = useState(18);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    if (dismissible) {
      closeButtonRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dismissible && event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissible, isActive, onClose]);

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

  return (
    <Dialog
      open={isActive}
      modal={false}
      onOpenChange={(isOpen) => {
        if (!isOpen && isActive && dismissible) {
          onClose();
        }
      }}
    >
      <div
        aria-hidden={isActive ? undefined : true}
        className={['app-modal-backdrop', isActive ? null : 'app-modal-backdrop--inactive']
          .filter(Boolean)
          .join(' ')}
        data-testid={testId}
        role="presentation"
        onMouseDown={(event) => {
          if (isActive && dismissible && event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <section
          aria-labelledby={titleId}
          aria-modal="true"
          className={`app-modal app-modal--${size}`}
          ref={modalRef}
          role="dialog"
          style={modalStyle}
        >
          <div className="app-modal__header">
            {dismissible && onBack ? (
              <RomanButton
                aria-label={t('common.back')}
                className="app-modal__back"
                size="icon"
                tone="secondary"
                onClick={onBack}
              >
                <GameIcon color="currentColor" name="back" size={18} />
              </RomanButton>
            ) : null}
            <div className="app-modal__title">
              <DialogTitle asChild>
                <h1 id={titleId}>{titleKey ? t(titleKey, titleParams) : title}</h1>
              </DialogTitle>
            </div>
            {dismissible ? (
              <DialogClose asChild>
                <RomanButton
                  aria-label={t('common.close')}
                  className="app-modal__close"
                  ref={closeButtonRef}
                  size="icon"
                  tone="secondary"
                >
                  <GameIcon color="currentColor" name="close" size={18} />
                </RomanButton>
              </DialogClose>
            ) : null}
          </div>
          <div className="app-modal__body">{children}</div>
          {footer ? <div className="app-modal__footer">{footer}</div> : null}
        </section>
      </div>
    </Dialog>
  );
}
