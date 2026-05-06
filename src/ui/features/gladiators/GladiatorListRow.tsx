import './gladiators.css';
import type { GameSave, Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { EntityListRow, type EntityListActionItem } from '@/ui/shared/components/EntityList';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';
import { GladiatorAttributes } from './GladiatorAttributes';
import { GladiatorTraits } from './GladiatorTraits';

interface GladiatorListRowProps {
  action?: EntityListActionItem;
  gladiator: Gladiator;
  openLabel?: string;
  save: GameSave;
  testId?: string;
  warning?: string;
  onOpen?(): void;
}

export function GladiatorListRow({
  action,
  gladiator,
  openLabel,
  save,
  testId,
  warning,
  onOpen,
}: GladiatorListRowProps) {
  const { t } = useUiStore();

  return (
    <EntityListRow
      actions={action ? [action] : []}
      avatar={<GladiatorPortrait gladiator={gladiator} size="small" />}
      infoContent={
        <>
          <GladiatorAttributes gladiator={gladiator} />
          <GladiatorTraits gladiator={gladiator} save={save} variant="compact" />
        </>
      }
      openLabel={openLabel}
      subtitle={
        <span>
          {t('market.age', { age: gladiator.age })}
          {warning ? <span className="game-list-row__warning">{warning}</span> : null}
        </span>
      }
      testId={testId}
      title={gladiator.name}
      onOpen={onOpen}
    />
  );
}
