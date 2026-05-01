import { getAvailableLudusGladiatorPlaces } from '../../domain/ludus/capacity';
import type { Gladiator, MarketGladiator } from '../../domain/types';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { UserAlert } from '../components/UserAlert';
import { formatMoneyAmount } from '../formatters/money';
import { MarketContent } from '../market/MarketContent';
import { AppModal } from './AppModal';

interface MarketModalProps {
  onBack?(): void;
  onClose(): void;
}

export function MarketModal({ onBack, onClose }: MarketModalProps) {
  const { buyMarketGladiator, currentSave, sellGladiator } = useGameStore();
  const { openConfirmModal, t } = useUiStore();

  if (!currentSave) {
    return null;
  }

  const requestBuy = (candidate: MarketGladiator) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'market.buy',
      messageKey: 'market.buyConfirmation',
      messageParams: {
        name: candidate.name,
        price: formatMoneyAmount(candidate.price),
      },
      onConfirm: () => buyMarketGladiator(candidate.id),
      testId: 'market-buy-confirm-dialog',
      titleKey: 'market.buyConfirmationTitle',
    });
  };
  const requestSell = (gladiator: Gladiator) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'market.sell',
      messageKey: 'market.sellConfirmation',
      messageParams: { name: gladiator.name },
      onConfirm: () => sellGladiator(gladiator.id),
      testId: 'market-sell-confirm-dialog',
      titleKey: 'market.sellConfirmationTitle',
    });
  };
  const isLudusFull = getAvailableLudusGladiatorPlaces(currentSave) <= 0;

  return (
    <AppModal
      size="xl"
      testId="market-modal"
      titleKey="market.title"
      onBack={onBack}
      onClose={onClose}
    >
      {isLudusFull ? (
        <UserAlert
          className="market-modal__alert"
          iconName="capacity"
          level="error"
          messageKey="market.capacityFullState"
          testId="market-capacity-full-notice"
        />
      ) : null}
      <p className="market-modal__subtitle">{t('market.subtitle')}</p>
      <MarketContent save={currentSave} onBuy={requestBuy} onSell={requestSell} />
    </AppModal>
  );
}
