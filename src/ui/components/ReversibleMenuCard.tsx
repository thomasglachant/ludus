import { useState, type AriaRole, type ReactNode, type Ref } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon } from '../icons/GameIcon';
import { MenuCardFront, type MenuCardAction } from './MenuCardFront';

export type ReversibleMenuCardSize = 'sm' | 'md' | 'lg' | 'xl';

export type ReversibleMenuCardAction<PanelId extends string> = MenuCardAction<PanelId>;

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
        <MenuCardFront<PanelId>
          actions={actions}
          closeButtonRef={closeButtonRef}
          isHidden={hasActivePanel}
          title={title}
          onBack={onBack}
          onClose={onClose}
          onOpenPanel={setActivePanelId}
        />

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
                  <GameIcon color="currentColor" name="back" size={18} />
                </button>
                <h2>{activePanel.title}</h2>
                {onClose ? (
                  <button
                    aria-label={t('common.close')}
                    className="main-menu-screen__panel-close"
                    type="button"
                    onClick={onClose}
                  >
                    <GameIcon color="currentColor" name="close" size={18} />
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
