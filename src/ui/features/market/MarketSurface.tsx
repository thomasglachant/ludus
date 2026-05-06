import { getAvailableLudusGladiatorPlaces } from '@/domain/ludus/capacity';
import type { GameSave, MarketGladiator } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { GameSurface, SurfaceHeader } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { UserAlert } from '@/ui/shared/components/UserAlert';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { MarketContent } from './MarketContent';

export function MarketSurface({ save }: { save: GameSave }) {
  const { openConfirmModal } = useUiStore();
  const { buyMarketGladiator } = useGameStore();
  const isLudusFull = getAvailableLudusGladiatorPlaces(save) <= 0;

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

  return (
    <GameSurface className="game-surface--market" testId="market-surface">
      <SurfaceHeader eyebrowKey="market.eyebrow" titleKey="market.title" />
      <div className="game-surface__body">
        {isLudusFull ? (
          <UserAlert
            className="market-modal__alert"
            iconName="capacity"
            level="error"
            messageKey="market.capacityFullState"
            testId="market-capacity-full-notice"
          />
        ) : null}
        <MarketContent save={save} onBuy={requestBuy} />
      </div>
    </GameSurface>
  );
}
