import { getAvailableLudusGladiatorPlaces } from '@/domain/ludus/capacity';
import type { MarketGladiator } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { Alert } from '@/ui/shared/components/Alert';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { MarketContent } from '@/ui/features/market/MarketContent';
import { AppModal } from '@/ui/app-shell/modals/AppModal';

interface MarketModalProps {
  isActive?: boolean;
  onBack?(): void;
  onClose(): void;
}

export function MarketModal({ isActive, onBack, onClose }: MarketModalProps) {
  const { buyMarketGladiator, currentSave } = useGameStore();
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
  const isLudusFull = getAvailableLudusGladiatorPlaces(currentSave) <= 0;

  return (
    <AppModal
      isActive={isActive}
      size="xl"
      testId="market-modal"
      titleKey="market.title"
      onBack={onBack}
      onClose={onClose}
    >
      {isLudusFull ? (
        <Alert
          className="market-modal__alert"
          description={t('market.capacityFullState')}
          level="error"
          testId="market-capacity-full-notice"
        />
      ) : null}
      <MarketContent save={currentSave} onBuy={requestBuy} />
    </AppModal>
  );
}
