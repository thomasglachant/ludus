import {
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import { getLudusGladiatorCapacity } from '../../domain/ludus/capacity';
import type { GameSave, MarketGladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { EntityList } from '../components/EntityList';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorListRow } from '../gladiators/GladiatorListRow';
import { GameIcon } from '../icons/GameIcon';
import { ModalContentFrame, ModalHeroCard, ModalTabPanel } from '../modals/ModalContentFrame';

interface MarketContentProps {
  save: GameSave;
  onBuy(candidate: MarketGladiator): void;
}

function MarketAvatar() {
  return (
    <div className="finance-modal-avatar" aria-hidden="true">
      <GameIcon name="shoppingCart" size={58} />
    </div>
  );
}

function getMarketValidationMessageKey(validation: MarketActionValidation) {
  if (validation.reason === 'noAvailablePlace') {
    return null;
  }

  return validation.reason ? `market.validation.${validation.reason}` : null;
}

export function MarketContent({ save, onBuy }: MarketContentProps) {
  const { t } = useUiStore();
  const gladiatorCapacity = getLudusGladiatorCapacity(save);
  const ownedCapacityValue = t('market.capacityValue', {
    current: save.gladiators.length,
    maximum: gladiatorCapacity,
  });

  return (
    <ModalContentFrame className="market-content">
      <ModalHeroCard
        avatar={<MarketAvatar />}
        descriptionKey="market.subtitle"
        eyebrowKey="market.eyebrow"
        titleKey="market.title"
      />
      <ModalTabPanel>
        <div className="market-candidates" data-testid="market-candidates-section">
          <p className="market-candidates__owned-capacity">
            {t('market.currentlyOwned')} {ownedCapacityValue}
          </p>
          <EntityList emptyMessageKey="market.noCandidates" emptyTestId="market-empty-candidates">
            {save.market.availableGladiators.map((candidate) => {
              const validation = validateMarketPurchase(save, candidate.id);
              const validationMessageKey = getMarketValidationMessageKey(validation);

              return (
                <GladiatorListRow
                  action={{
                    amountMoney: formatMoneyAmount(candidate.price),
                    disabled: !validation.isAllowed,
                    iconName: 'shoppingCart',
                    id: 'buy',
                    label: t('market.buy'),
                    onClick: () => onBuy(candidate),
                    testId: `market-buy-${candidate.id}`,
                    variant: 'primary',
                  }}
                  gladiator={candidate}
                  key={candidate.id}
                  testId={`market-candidate-${candidate.id}`}
                  warning={validationMessageKey ? t(validationMessageKey) : undefined}
                />
              );
            })}
          </EntityList>
        </div>
      </ModalTabPanel>
    </ModalContentFrame>
  );
}
