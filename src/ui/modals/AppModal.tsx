import { Shield, X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store';

interface AppModalProps {
  children: ReactNode;
  onClose(): void;
  size?: 'default' | 'wide';
  testId?: string;
  titleKey: string;
  titleParams?: Record<string, string | number>;
}

export function AppModal({
  children,
  onClose,
  size = 'default',
  testId,
  titleKey,
  titleParams,
}: AppModalProps) {
  const { t } = useUiStore();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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
        role="dialog"
      >
        <div className="app-modal__header">
          <div className="app-modal__title">
            <Shield aria-hidden="true" size={26} />
            <h1 id={titleId}>{t(titleKey, titleParams)}</h1>
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
        {children}
      </section>
    </div>
  );
}
