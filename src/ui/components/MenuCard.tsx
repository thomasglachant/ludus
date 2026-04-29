import { useState, type AriaRole, type ReactNode, type Ref } from 'react';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon } from '../icons/GameIcon';

export interface MenuCardAction<PanelId extends string> {
  disabled?: boolean;
  icon?: ReactNode;
  key: string;
  label: string;
  panelId?: PanelId;
  primary?: boolean;
  testId?: string;
  onClick?(): void;
}

export interface MenuCardPanel {
  content: ReactNode | ((controls: { closePanel(): void }) => ReactNode);
  title: string;
}

interface MenuCardProps<PanelId extends string> {
  actions: MenuCardAction<PanelId>[];
  ariaLabel?: string;
  ariaModal?: boolean;
  className?: string;
  closeButtonRef?: Ref<HTMLButtonElement>;
  panels?: Partial<Record<PanelId, MenuCardPanel>>;
  role?: AriaRole;
  title: ReactNode;
  onBack?(): void;
  onClose?(): void;
}

export function MenuCard<PanelId extends string>({
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
}: MenuCardProps<PanelId>) {
  const { t } = useUiStore();
  const [activePanelId, setActivePanelId] = useState<PanelId | null>(null);
  const activePanel = activePanelId ? panels[activePanelId] : null;
  const closePanel = () => setActivePanelId(null);
  const panelContent =
    typeof activePanel?.content === 'function'
      ? activePanel.content({ closePanel })
      : activePanel?.content;
  const backAction = activePanel ? closePanel : onBack;
  const closeButton = onClose ? (
    <button
      aria-label={t('common.close')}
      className="main-menu-screen__panel-close"
      ref={activePanel ? undefined : closeButtonRef}
      type="button"
      onClick={onClose}
    >
      <GameIcon color="currentColor" name="close" size={18} />
    </button>
  ) : null;

  return (
    <section
      className={[
        'main-menu-screen__card',
        activePanel ? 'main-menu-screen__card--panel' : 'main-menu-screen__card--root',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      aria-modal={ariaModal ? 'true' : undefined}
      role={role}
    >
      {!activePanel && backAction ? (
        <button
          aria-label={t('common.back')}
          className="main-menu-screen__panel-back"
          type="button"
          onClick={backAction}
        >
          <GameIcon color="currentColor" name="back" size={18} />
        </button>
      ) : null}
      {!activePanel ? closeButton : null}

      {activePanel ? (
        <>
          <MenuCardHeader title={activePanel.title} onBack={closePanel} />
          <div className="main-menu-screen__panel-body">{panelContent}</div>
        </>
      ) : (
        <>
          <div className="main-menu-screen__card-title">{title}</div>
          <nav className="main-menu-screen__buttons" aria-label={t('navigation.title')}>
            {actions.map((action) => (
              <button
                className={action.primary ? 'main-menu-screen__button--primary' : undefined}
                data-testid={action.testId}
                disabled={action.disabled}
                key={action.key}
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
        </>
      )}
    </section>
  );
}

function MenuCardHeader({
  right,
  title,
  onBack,
}: {
  right?: ReactNode;
  title: string;
  onBack(): void;
}) {
  const { t } = useUiStore();

  return (
    <header className="main-menu-screen__card-header">
      <button
        aria-label={t('common.back')}
        className="main-menu-screen__panel-back"
        type="button"
        onClick={onBack}
      >
        <GameIcon color="currentColor" name="back" size={18} />
      </button>
      <h2>{title}</h2>
      <div className="main-menu-screen__card-header-action">{right}</div>
    </header>
  );
}

export function MenuCardBrandTitle({ children }: { children: ReactNode }) {
  return (
    <div className="main-menu-screen__brand">
      <div className="main-menu-screen__title-row">
        <img
          className="main-menu-screen__title-laurel"
          src={VISUAL_ASSET_MANIFEST.ui['laurel-left']}
          alt=""
          aria-hidden="true"
        />
        <h1>{children}</h1>
        <img
          className="main-menu-screen__title-laurel main-menu-screen__title-laurel--right"
          src={VISUAL_ASSET_MANIFEST.ui['laurel-left']}
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
