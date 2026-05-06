import type { ReactNode } from 'react';
import type { GameListAction, GameListFact } from '@/ui/shared/ludus/GameList';
import { GameList, GameListRow } from '@/ui/shared/ludus/GameList';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';

export type EntityListInfoTone = 'danger' | 'neutral' | 'positive' | 'warning';

export interface EntityListInfoItem {
  iconName: GameIconName;
  id: string;
  label: string;
  tone?: EntityListInfoTone;
  value: ReactNode;
}

export interface EntityListActionItem {
  amountMoney?: ReactNode;
  disabled?: boolean;
  iconName?: GameIconName;
  id: string;
  label: string;
  testId?: string;
  variant?: 'primary' | 'secondary';
  onClick(): void;
}

interface EntityListProps {
  children?: ReactNode;
  className?: string;
  emptyMessageKey?: string;
  emptyTestId?: string;
}

interface EntityListRowProps {
  actions?: EntityListActionItem[];
  avatar?: ReactNode;
  className?: string;
  info?: EntityListInfoItem[];
  infoContent?: ReactNode;
  openLabel?: string;
  subtitle?: ReactNode;
  testId?: string;
  title: ReactNode;
  onOpen?(): void;
}

export function EntityList({ children, className, emptyMessageKey, emptyTestId }: EntityListProps) {
  return (
    <GameList className={className} emptyMessageKey={emptyMessageKey} emptyTestId={emptyTestId}>
      {children}
    </GameList>
  );
}

export function EntityListRow({
  actions = [],
  avatar,
  className,
  info = [],
  infoContent,
  onOpen,
  openLabel,
  subtitle,
  testId,
  title,
}: EntityListRowProps) {
  return (
    <GameListRow
      actions={actions as GameListAction[]}
      avatar={avatar}
      className={className}
      facts={info as GameListFact[]}
      infoContent={infoContent}
      openLabel={openLabel}
      subtitle={subtitle}
      testId={testId}
      title={title}
      onOpen={onOpen}
    />
  );
}
