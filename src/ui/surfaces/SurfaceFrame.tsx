import type { ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { RomanButton } from '../game/RomanButton';
import { WaxTabletTabs } from '../game/WaxTabletTabs';
import { GameIcon } from '../icons/GameIcon';

interface GameSurfaceProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

interface SurfaceHeaderProps {
  actions?: ReactNode;
  backLabelKey?: string;
  children?: ReactNode;
  eyebrowKey?: string;
  title?: ReactNode;
  titleKey?: string;
  onBack?(): void;
}

interface SurfaceTabItem<T extends string> {
  count?: number;
  countMax?: number;
  id: T;
  labelKey: string;
}

interface SurfaceTabsProps<T extends string> {
  ariaLabelKey: string;
  items: SurfaceTabItem<T>[];
  selectedId: T;
  onSelect(id: T): void;
}

interface ContextSheetProps {
  children: ReactNode;
  titleKey?: string;
  title?: ReactNode;
  onClose(): void;
}

export function GameSurface({ children, className, testId }: GameSurfaceProps) {
  return (
    <section className={['game-surface', className].filter(Boolean).join(' ')} data-testid={testId}>
      {children}
    </section>
  );
}

export function SurfaceHeader({
  actions,
  backLabelKey = 'surface.backToList',
  children,
  eyebrowKey,
  onBack,
  title,
  titleKey,
}: SurfaceHeaderProps) {
  const { t } = useUiStore();

  return (
    <header className="game-surface__header">
      <div className="game-surface__heading">
        {onBack ? (
          <RomanButton
            className="game-surface__back"
            density="compact"
            tone="secondary"
            type="button"
            onClick={onBack}
          >
            <GameIcon name="back" size={17} />
            <span>{t(backLabelKey)}</span>
          </RomanButton>
        ) : null}
        <div className="game-surface__title-block">
          {eyebrowKey ? <span>{t(eyebrowKey)}</span> : null}
          <h1>{titleKey ? t(titleKey) : title}</h1>
        </div>
      </div>
      {actions ? <div className="game-surface__header-actions">{actions}</div> : null}
      {children ? <div className="game-surface__header-body">{children}</div> : null}
    </header>
  );
}

export function SurfaceTabs<T extends string>({
  ariaLabelKey,
  items,
  onSelect,
  selectedId,
}: SurfaceTabsProps<T>) {
  const { t } = useUiStore();

  return (
    <WaxTabletTabs
      ariaLabel={t(ariaLabelKey)}
      items={items.map((item) => ({ ...item, label: t(item.labelKey) }))}
      listClassName="game-surface__tabs"
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}

export function ContextSheet({ children, onClose, title, titleKey }: ContextSheetProps) {
  const { t } = useUiStore();

  return (
    <aside className="context-sheet" data-testid="context-sheet">
      <header className="context-sheet__header">
        <h2>{titleKey ? t(titleKey) : title}</h2>
        <button aria-label={t('common.close')} type="button" onClick={onClose}>
          <GameIcon name="close" size={18} />
        </button>
      </header>
      <div className="context-sheet__body">{children}</div>
    </aside>
  );
}
