import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useUiStore, type ModalSize } from '../../state/ui-store';

interface AppModalProps {
  children: ReactNode;
  footer?: ReactNode;
  onBack?(): void;
  onClose(): void;
  size?: ModalSize;
  testId?: string;
  title?: ReactNode;
  titleKey?: string;
  titleParams?: Record<string, string | number>;
}

export function AppModal({
  children,
  footer,
  onBack,
  onClose,
  size = 'md',
  testId,
  title,
  titleKey,
  titleParams,
}: AppModalProps) {
  const { t } = useUiStore();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLElement | null>(null);
  const [modalOffset, setModalOffset] = useState(0);
  const [modalBottomOffset, setModalBottomOffset] = useState(18);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
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
  }, [children, footer]);

  return (
    <div
      className="app-modal-backdrop"
      data-testid={testId}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
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
        style={{ marginBottom: modalBottomOffset, marginTop: modalOffset }}
      >
        <div className="app-modal__header">
          {onBack ? (
            <button
              aria-label={t('common.back')}
              className="app-modal__back"
              type="button"
              onClick={onBack}
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
          ) : null}
          <div className="app-modal__title">
            <h1 id={titleId}>{titleKey ? t(titleKey, titleParams) : title}</h1>
          </div>
          <button
            aria-label={t('common.close')}
            className="app-modal__close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="app-modal__body">{children}</div>
        {footer ? <div className="app-modal__footer">{footer}</div> : null}
      </section>
    </div>
  );
}
