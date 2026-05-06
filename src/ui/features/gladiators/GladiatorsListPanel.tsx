import './gladiators.css';
import type { GameSave } from '@/domain/types';
import { calculateGladiatorSaleValue } from '@/domain/market/market-actions';
import { useUiStore } from '@/state/ui-store-context';
import { EntityList } from '@/ui/shared/components/EntityList';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { GladiatorListRow } from '@/ui/features/gladiators/GladiatorListRow';

interface GladiatorsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenGladiator(gladiatorId: string): void;
  onSellGladiator(gladiatorId: string): void;
}

export function GladiatorsListPanel({
  onOpenGladiator,
  onSellGladiator,
  save,
}: GladiatorsListPanelProps) {
  const { t } = useUiStore();

  return (
    <section className="panel-shell panel-shell--wide" data-testid="gladiators-list-panel">
      <EntityList emptyMessageKey="ludus.noGladiators">
        {save.gladiators.map((gladiator) => (
          <GladiatorListRow
            action={{
              iconName: 'userMinus',
              id: 'sell',
              label: `${t('market.sell')} (${formatMoneyAmount(calculateGladiatorSaleValue(gladiator))})`,
              onClick: () => onSellGladiator(gladiator.id),
              testId: `market-sell-${gladiator.id}`,
            }}
            gladiator={gladiator}
            key={gladiator.id}
            openLabel={t('roster.openGladiator', { name: gladiator.name })}
            save={save}
            onOpen={() => onOpenGladiator(gladiator.id)}
          />
        ))}
      </EntityList>
    </section>
  );
}
