import type { ReactNode, Ref } from 'react';
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

interface MenuCardFrontProps<PanelId extends string> {
  actions: MenuCardAction<PanelId>[];
  closeButtonRef?: Ref<HTMLButtonElement>;
  isHidden?: boolean;
  title: ReactNode;
  onBack?(): void;
  onClose?(): void;
  onOpenPanel(panelId: PanelId): void;
}

export function MenuCardFront<PanelId extends string>({
  actions,
  closeButtonRef,
  isHidden = false,
  title,
  onBack,
  onClose,
  onOpenPanel,
}: MenuCardFrontProps<PanelId>) {
  const { t } = useUiStore();
  const frontTabIndex = isHidden ? -1 : undefined;

  return (
    <div
      aria-hidden={isHidden}
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
          <GameIcon color="currentColor" name="back" size={18} />
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
          <GameIcon color="currentColor" name="close" size={18} />
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
                onOpenPanel(action.panelId);
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
