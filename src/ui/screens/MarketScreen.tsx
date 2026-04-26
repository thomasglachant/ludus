import { ArrowLeft } from 'lucide-react';
import type { Gladiator } from '../../domain/types';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { StatusBar } from '../components/StatusBar';
import { MarketContent } from '../market/MarketContent';

export function MarketScreen() {
  const { currentSave, buyMarketGladiator, sellGladiator, setGameSpeed } = useGameStore();
  const { navigate, openConfirmModal, t } = useUiStore();

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
    <section className="ludus-screen" data-testid="market-screen">
      <StatusBar save={currentSave} onSpeedChange={setGameSpeed} />
      <div className="ludus-header">
        <div>
          <p className="eyebrow">{t('market.eyebrow')}</p>
          <h1>{t('market.title')}</h1>
          <p>{t('market.subtitle')}</p>
        </div>
        <div className="ludus-header__actions">
          <ActionButton
            icon={<ArrowLeft aria-hidden="true" size={18} />}
            label={t('common.back')}
            onClick={() => navigate('ludus')}
          />
        </div>
      </div>
      <MarketContent save={currentSave} onBuy={buyMarketGladiator} onSell={handleSell} />
    </section>
  );
}
