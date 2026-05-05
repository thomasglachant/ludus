import type { GameSave } from '../../domain/types';
import { calculateGladiatorSaleValue } from '../../domain/market/market-actions';
import { useUiStore } from '../../state/ui-store-context';
import { EntityList } from '../components/EntityList';
import { PanelShell } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorListRow } from '../gladiators/GladiatorListRow';

interface GladiatorsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenGladiator(gladiatorId: string): void;
  onSellGladiator(gladiatorId: string): void;
}

export function GladiatorsListPanel({
  onClose,
  onOpenGladiator,
  onSellGladiator,
  save,
}: GladiatorsListPanelProps) {
  const { t } = useUiStore();

  return (
    <PanelShell
      eyebrowKey="roster.eyebrow"
      titleKey="roster.title"
      testId="gladiators-list-panel"
      wide
      onClose={onClose}
    >
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
    </PanelShell>
  );
}
