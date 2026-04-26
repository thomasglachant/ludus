import { ShoppingCart, UserMinus, Users } from 'lucide-react';
import {
  getAvailableLudusGladiatorPlaces,
  getLudusGladiatorCapacity,
} from '../../domain/ludus/capacity';
import {
  calculateGladiatorSaleValue,
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import type { GameSave, Gladiator, MarketGladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { EmptyState, MetricList, NoticeBox } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface MarketContentProps {
  save: GameSave;
  onBuy(candidateId: string): void;
  onSell(gladiator: Gladiator): void;
}

function getMarketValidationMessageKey(validation: MarketActionValidation) {
  return validation.reason ? `market.validation.${validation.reason}` : null;
}

function StatBlock({
  gladiator,
}: {
  gladiator: Pick<Gladiator, 'strength' | 'agility' | 'defense' | 'health' | 'energy' | 'morale'>;
}) {
  const { t } = useUiStore();

  return (
    <dl className="gladiator-stat-list">
      <div>
        <dt>{t('market.stats.strength')}</dt>
        <dd>{gladiator.strength}</dd>
      </div>
      <div>
        <dt>{t('market.stats.agility')}</dt>
        <dd>{gladiator.agility}</dd>
      </div>
      <div>
        <dt>{t('market.stats.defense')}</dt>
        <dd>{gladiator.defense}</dd>
      </div>
      <div>
        <dt>{t('market.stats.health')}</dt>
        <dd>{gladiator.health}</dd>
      </div>
      <div>
        <dt>{t('market.stats.energy')}</dt>
        <dd>{gladiator.energy}</dd>
      </div>
      <div>
        <dt>{t('market.stats.morale')}</dt>
        <dd>{gladiator.morale}</dd>
      </div>
    </dl>
  );
}

function TraitList({ gladiator }: { gladiator: Pick<Gladiator, 'traits'> }) {
  const { t } = useUiStore();

  if (gladiator.traits.length === 0) {
    return null;
  }

  return (
    <ul className="trait-list" aria-label={t('market.traits')}>
      {gladiator.traits.map((trait) => (
        <li key={trait}>{t(`traits.${trait}`)}</li>
      ))}
    </ul>
  );
}

function MarketCandidateCard({
  candidate,
  onBuy,
  save,
}: {
  candidate: MarketGladiator;
  onBuy(candidateId: string): void;
  save: GameSave;
}) {
  const { t } = useUiStore();
  const validation = validateMarketPurchase(save, candidate.id);
  const validationMessageKey = getMarketValidationMessageKey(validation);

  return (
    <article className="gladiator-card" data-testid={`market-candidate-${candidate.id}`}>
      <div className="gladiator-card__header">
        <GladiatorPortrait gladiator={candidate} size="small" />
        <div>
          <h3>{candidate.name}</h3>
          <p>{t('market.age', { age: candidate.age })}</p>
        </div>
        <strong>{t('market.price', { price: formatMoneyAmount(candidate.price) })}</strong>
      </div>
      <StatBlock gladiator={candidate} />
      <TraitList gladiator={candidate} />
      {validationMessageKey ? (
        <p className="gladiator-card__warning">{t(validationMessageKey)}</p>
      ) : null}
      <div className="gladiator-card__actions">
        <ActionButton
          disabled={!validation.isAllowed}
          icon={<ShoppingCart aria-hidden="true" size={18} />}
          label={t('market.buy')}
          testId={`market-buy-${candidate.id}`}
          variant="primary"
          onClick={() => onBuy(candidate.id)}
        />
      </div>
    </article>
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
  const saleValue = calculateGladiatorSaleValue(gladiator);

  return (
    <article className="gladiator-card" data-testid={`market-owned-${gladiator.id}`}>
      <div className="gladiator-card__header">
        <GladiatorPortrait gladiator={gladiator} size="small" />
        <div>
          <h3>{gladiator.name}</h3>
          <p>{t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}</p>
        </div>
        <strong>{t('market.saleValue', { price: formatMoneyAmount(saleValue) })}</strong>
      </div>
      <StatBlock gladiator={gladiator} />
      <TraitList gladiator={gladiator} />
      <div className="gladiator-card__actions">
        <ActionButton
          icon={<UserMinus aria-hidden="true" size={18} />}
          label={t('market.sell')}
          onClick={() => onSell(gladiator)}
        />
      </div>
    </article>
  );
}

export function MarketContent({ save, onBuy, onSell }: MarketContentProps) {
  const { t } = useUiStore();
  const ludusCapacity = getLudusGladiatorCapacity(save);
  const availablePlaces = getAvailableLudusGladiatorPlaces(save);

  return (
    <div className="market-content">
      <section className="panel panel--summary" data-testid="market-capacity-summary">
        <h2>{t('market.capacityTitle')}</h2>
        <MetricList
          items={[
            {
              labelKey: 'market.ownedBeds',
              value: `${save.gladiators.length}/${ludusCapacity}`,
            },
            { labelKey: 'market.availableBeds', value: availablePlaces },
            { labelKey: 'market.candidates', value: save.market.availableGladiators.length },
          ]}
        />
        {availablePlaces <= 0 ? (
          <NoticeBox tone="warning" testId="market-capacity-full-notice">
            <Users aria-hidden="true" size={18} />
            <span>{t('market.noBedWarning')}</span>
          </NoticeBox>
        ) : null}
      </section>
      <section className="panel" data-testid="market-candidates-section">
        <h2>{t('market.availableGladiators')}</h2>
        {availablePlaces <= 0 ? (
          <EmptyState messageKey="market.capacityFullState" testId="market-capacity-full-state" />
        ) : null}
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
      <section className="panel" data-testid="market-owned-section">
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
