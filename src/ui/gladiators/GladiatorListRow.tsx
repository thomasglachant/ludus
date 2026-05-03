import type { Gladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { EntityListRow, type EntityListActionItem } from '../components/EntityList';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { GladiatorAttributes } from './GladiatorAttributes';

interface GladiatorListRowProps {
  action?: EntityListActionItem;
  gladiator: Gladiator;
  openLabel?: string;
  testId?: string;
  warning?: string;
  onOpen?(): void;
}

export function GladiatorListRow({
  action,
  gladiator,
  openLabel,
  testId,
  warning,
  onOpen,
}: GladiatorListRowProps) {
  const { t } = useUiStore();
  const primaryTrait = gladiator.traits[0];

  return (
    <EntityListRow
      actions={action ? [action] : []}
      avatar={<GladiatorPortrait gladiator={gladiator} size="small" />}
      infoContent={<GladiatorAttributes gladiator={gladiator} />}
      openLabel={openLabel}
      subtitle={
        <span>
          {t('market.age', { age: gladiator.age })} -{' '}
          {primaryTrait ? <>{t(`traits.${primaryTrait}`)}</> : null}
          {warning ? <span className="entity-list-row__warning">{warning}</span> : null}
        </span>
      }
      testId={testId}
      title={gladiator.name}
      onOpen={onOpen}
    />
  );
}
