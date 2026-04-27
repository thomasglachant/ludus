import type { Gladiator } from '../../domain/types';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store';
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

  const handleSell = (gladiator: Gladiator) => {
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

  return (
    <AppModal
      size="xl"
      testId="market-modal"
      titleKey="market.title"
      onBack={onBack}
      onClose={onClose}
    >
      <p className="market-modal__subtitle">{t('market.subtitle')}</p>
      <MarketContent save={currentSave} onBuy={buyMarketGladiator} onSell={handleSell} />
    </AppModal>
  );
}
