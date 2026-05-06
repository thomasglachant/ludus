import './menu-card.css';
import { useState, type AriaRole, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { VISUAL_ASSET_MANIFEST } from '@/game-data/visual-assets';
import { useUiStore } from '@/state/ui-store-context';
import { Button } from '@/ui/shared/ludus/Button';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { GameIcon } from '@/ui/shared/icons/GameIcon';

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
    <IconButton
      aria-label={t('common.close')}
      className="menu-card__panel-close"
      ref={activePanel ? undefined : closeButtonRef}
      type="button"
      onClick={onClose}
    >
      <GameIcon color="currentColor" name="close" size={18} />
    </IconButton>
  ) : null;

  return (
    <section
      className={['menu-card', activePanel ? 'menu-card--panel' : 'menu-card--root', className]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      aria-modal={ariaModal ? 'true' : undefined}
      role={role}
    >
      {!activePanel && backAction ? (
        <IconButton
          aria-label={t('common.back')}
          className="menu-card__panel-back"
          type="button"
          onClick={backAction}
        >
          <GameIcon color="currentColor" name="back" size={18} />
        </IconButton>
      ) : null}
      {!activePanel ? closeButton : null}

      {activePanel ? (
        <>
          <MenuCardHeader title={activePanel.title} onBack={closePanel} />
          <div className="menu-card__panel-body">{panelContent}</div>
        </>
      ) : (
        <>
          <div className="menu-card__title">{title}</div>
          <nav className="menu-card__actions" aria-label={t('navigation.title')}>
            {actions.map((action) => {
              const Component = action.primary ? PrimaryActionButton : Button;

              return (
                <Component
                  className="menu-card__action"
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
                </Component>
              );
            })}
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
    <header className="menu-card__header">
      <IconButton
        aria-label={t('common.back')}
        className="menu-card__panel-back"
        type="button"
        onClick={onBack}
      >
        <GameIcon color="currentColor" name="back" size={18} />
      </IconButton>
      <h2>{title}</h2>
      <div className="menu-card__header-action">{right}</div>
    </header>
  );
}

export function MenuCardBrandTitle({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className="menu-card__brand" {...props}>
      <div className="menu-card__brand-title">
        <img
          className="menu-card__laurel"
          src={VISUAL_ASSET_MANIFEST.ui['laurel-left']}
          alt=""
          aria-hidden="true"
        />
        <h1>{children}</h1>
        <img
          className="menu-card__laurel menu-card__laurel--right"
          src={VISUAL_ASSET_MANIFEST.ui['laurel-left']}
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
