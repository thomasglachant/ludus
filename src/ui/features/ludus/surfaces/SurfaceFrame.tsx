import './ludus-surfaces.css';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/state/ui-store-context';
import { Button } from '@/ui/shared/ludus/Button';
import { GameCard, GameCardBody, GameCardHeader } from '@/ui/shared/ludus/GameCard';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { WaxTabletTabs } from '@/ui/shared/ludus/WaxTabletTabs';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { Dialog, DialogContent, DialogPortal, DialogTitle } from '@/ui/shared/primitives/Dialog';

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

type SurfaceBodyVariant = 'default' | 'detail' | 'list';

interface SurfaceBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'compact' | 'normal' | 'roomy';
  scrollable?: boolean;
  variant?: SurfaceBodyVariant;
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
    <GameCard
      as="section"
      className={cn('game-surface', className)}
      data-testid={testId}
      layout="frame"
      surface="dark"
    >
      {children}
    </GameCard>
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
    <GameCardHeader className="game-surface__header">
      <div className="game-surface__heading">
        {onBack ? (
          <Button
            className="game-surface__back"
            density="compact"
            variant="secondary"
            type="button"
            onClick={onBack}
          >
            <GameIcon name="back" size={17} />
            <span>{t(backLabelKey)}</span>
          </Button>
        ) : null}
        <div className="game-surface__title-block">
          {eyebrowKey ? <span>{t(eyebrowKey)}</span> : null}
          <h1>{titleKey ? t(titleKey) : title}</h1>
        </div>
      </div>
      {actions ? <div className="game-surface__header-actions">{actions}</div> : null}
      {children ? <div className="game-surface__header-body">{children}</div> : null}
    </GameCardHeader>
  );
}

export function SurfaceBody({
  children,
  className,
  padding = 'normal',
  scrollable = true,
  variant = 'default',
  ...props
}: SurfaceBodyProps) {
  return (
    <GameCardBody
      className={cn(
        'game-surface__body',
        variant !== 'default' ? `game-surface__body--${variant}` : null,
        className,
      )}
      padding={padding}
      scrollable={scrollable}
      {...props}
    >
      {children}
    </GameCardBody>
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
    <Dialog
      modal={false}
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogPortal>
        <DialogContent
          className="context-sheet"
          data-testid="context-sheet"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <header className="context-sheet__header">
            <DialogTitle asChild>
              <h2>{titleKey ? t(titleKey) : title}</h2>
            </DialogTitle>
            <IconButton aria-label={t('common.close')} type="button" onClick={onClose}>
              <GameIcon name="close" size={18} />
            </IconButton>
          </header>
          <div className="context-sheet__body">{children}</div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
