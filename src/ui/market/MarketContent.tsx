import {
  calculateGladiatorSaleValue,
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import type { GameSave, Gladiator, MarketGladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { CTAButton } from '../components/CTAButton';
import { EmptyState } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';
import { GameIcon } from '../icons/GameIcon';

interface MarketContentProps {
  save: GameSave;
  onBuy(candidate: MarketGladiator): void;
  onSell(gladiator: Gladiator): void;
}

function getMarketValidationMessageKey(validation: MarketActionValidation) {
  if (validation.reason === 'noAvailableBed') {
    return null;
  }

  return validation.reason ? `market.validation.${validation.reason}` : null;
}

function MarketCandidateCard({
  candidate,
  onBuy,
  save,
}: {
  candidate: MarketGladiator;
  onBuy(candidate: MarketGladiator): void;
  save: GameSave;
}) {
  const { t } = useUiStore();
  const validation = validateMarketPurchase(save, candidate.id);
  const validationMessageKey = getMarketValidationMessageKey(validation);
  const formattedPrice = formatMoneyAmount(candidate.price);

  return (
    <GladiatorSummary
      className="gladiator-summary--market"
      gladiator={candidate}
      testId={`market-candidate-${candidate.id}`}
      tone="light"
      topRightContent={
        <>
          <GameIcon name="treasury" size={17} />
          <strong>{formattedPrice}</strong>
        </>
      }
      topRightLabel={t('market.price', { price: formattedPrice })}
    >
      <div className="market-gladiator-summary__footer">
        <CTAButton
          data-testid={`market-buy-${candidate.id}`}
          disabled={!validation.isAllowed}
          onClick={() => onBuy(candidate)}
        >
          <GameIcon color="#fff9e7" name="shoppingCart" size={18} />
          <span>{t('market.buy')}</span>
        </CTAButton>
      </div>
      {validationMessageKey ? (
        <p className="market-gladiator-summary__warning">{t(validationMessageKey)}</p>
      ) : null}
    </GladiatorSummary>
  );
}

function OwnedGladiatorCard({
  gladiator,
  onSell,
}: {
  gladiator: Gladiator;
  onSell(gladiator: Gladiator): void;
}) {
  const { t } = useUiStore();
  const formattedSaleValue = formatMoneyAmount(calculateGladiatorSaleValue(gladiator));

  return (
    <GladiatorSummary
      className="gladiator-summary--market"
      gladiator={gladiator}
      testId={`market-owned-${gladiator.id}`}
      tone="light"
      topRightContent={
        <>
          <GameIcon name="treasury" size={17} />
          <strong>{formattedSaleValue}</strong>
        </>
      }
      topRightLabel={t('market.saleValue', { price: formattedSaleValue })}
    >
      <div className="market-gladiator-summary__footer">
        <ActionButton
          icon={<GameIcon name="userMinus" size={18} />}
          label={t('market.sell')}
          testId={`market-sell-${gladiator.id}`}
          onClick={() => onSell(gladiator)}
        />
      </div>
    </GladiatorSummary>
  );
}

export function MarketContent({ save, onBuy, onSell }: MarketContentProps) {
  const { t } = useUiStore();

  return (
    <div className="market-content">
      <section className="market-candidates" data-testid="market-candidates-section">
        <h2>{t('market.availableGladiators')}</h2>
        {save.market.availableGladiators.length > 0 ? (
          <div className="gladiator-grid">
            {save.market.availableGladiators.map((candidate) => (
              <MarketCandidateCard
                candidate={candidate}
                key={candidate.id}
                save={save}
                onBuy={onBuy}
              />
            ))}
          </div>
        ) : (
          <EmptyState messageKey="market.noCandidates" testId="market-empty-candidates" />
        )}
      </section>
      <section className="market-candidates" data-testid="market-owned-section">
        <h2>{t('market.ownedGladiators')}</h2>
        {save.gladiators.length > 0 ? (
          <div className="gladiator-grid">
            {save.gladiators.map((gladiator) => (
              <OwnedGladiatorCard gladiator={gladiator} key={gladiator.id} onSell={onSell} />
            ))}
          </div>
        ) : (
          <EmptyState messageKey="market.noOwnedGladiators" testId="market-empty-owned" />
        )}
      </section>
    </div>
  );
}
