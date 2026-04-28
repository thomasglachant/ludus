import { ArrowLeft, X } from 'lucide-react';
import { useState, type AriaRole, type ReactNode, type Ref } from 'react';
import { useUiStore } from '../../state/ui-store-context';

export type ReversibleMenuCardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ReversibleMenuCardAction<PanelId extends string> {
  disabled?: boolean;
  icon?: ReactNode;
  key: string;
  label: string;
  panelId?: PanelId;
  primary?: boolean;
  testId?: string;
  onClick?(): void;
}

export interface ReversibleMenuCardPanel {
  content: ReactNode | ((controls: { closePanel(): void }) => ReactNode);
  size?: ReversibleMenuCardSize;
  title: string;
}

interface ReversibleMenuCardProps<PanelId extends string> {
  actions: ReversibleMenuCardAction<PanelId>[];
  ariaLabel?: string;
  ariaModal?: boolean;
  className?: string;
  closeButtonRef?: Ref<HTMLButtonElement>;
  panels?: Partial<Record<PanelId, ReversibleMenuCardPanel>>;
  role?: AriaRole;
  title: ReactNode;
  onBack?(): void;
  onClose?(): void;
}

export function ReversibleMenuCard<PanelId extends string>({
  actions,
  ariaLabel,
  ariaModal = false,
  className = '',
  closeButtonRef,
  panels = {},
  role,
  title,
  onBack,
  onClose,
}: ReversibleMenuCardProps<PanelId>) {
  const { t } = useUiStore();
  const [activePanelId, setActivePanelId] = useState<PanelId | null>(null);
  const activePanel = activePanelId ? panels[activePanelId] : null;
  const hasActivePanel = Boolean(activePanel);
  const panelSize = activePanel?.size ?? 'md';
  const frontTabIndex = hasActivePanel ? -1 : undefined;
  const closePanel = () => setActivePanelId(null);
  const panelContent =
    typeof activePanel?.content === 'function'
      ? activePanel.content({ closePanel })
      : activePanel?.content;

  return (
    <div
      className={`main-menu-screen__flip-shell main-menu-screen__flip-shell--${panelSize} ${
        activePanel ? 'is-flipped' : ''
      } ${className}`}
      aria-label={ariaLabel}
      aria-modal={ariaModal ? 'true' : undefined}
      role={role}
    >
      <div className="main-menu-screen__flipper">
        <div
          aria-hidden={hasActivePanel}
          className="main-menu-screen__content main-menu-screen__face main-menu-screen__face--front"
        >
          {onBack ? (
            <button
              aria-label={t('common.back')}
              className="main-menu-screen__panel-back"
              tabIndex={frontTabIndex}
              type="button"
              onClick={onBack}
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
          ) : null}
          {onClose ? (
            <button
              aria-label={t('common.close')}
              className="main-menu-screen__panel-close"
              ref={closeButtonRef}
              tabIndex={frontTabIndex}
              type="button"
              onClick={onClose}
            >
              <X aria-hidden="true" size={18} />
            </button>
          ) : null}
          <div className="main-menu-screen__front-title">{title}</div>
          <nav className="main-menu-screen__buttons" aria-label={t('navigation.title')}>
            {actions.map((action) => (
              <button
                className={action.primary ? 'main-menu-screen__button--primary' : undefined}
                data-testid={action.testId}
                disabled={action.disabled}
                key={action.key}
                tabIndex={frontTabIndex}
                type="button"
                onClick={() => {
                  if (action.panelId) {
                    setActivePanelId(action.panelId);
                    return;
                  }

                  action.onClick?.();
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div
          aria-hidden={!hasActivePanel}
          className="main-menu-screen__content main-menu-screen__face main-menu-screen__face--back"
        >
          {activePanel ? (
            <>
              <header className="main-menu-screen__panel-header">
                <button
                  aria-label={t('common.back')}
                  className="main-menu-screen__panel-back"
                  type="button"
                  onClick={closePanel}
                >
                  <ArrowLeft aria-hidden="true" size={18} />
                </button>
                <h2>{activePanel.title}</h2>
                {onClose ? (
                  <button
                    aria-label={t('common.close')}
                    className="main-menu-screen__panel-close"
                    type="button"
                    onClick={onClose}
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                ) : null}
              </header>
              <div className="main-menu-screen__panel-body">{panelContent}</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
