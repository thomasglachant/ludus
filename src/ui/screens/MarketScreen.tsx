import { ArrowLeft, Bed, ShoppingCart, UserMinus } from 'lucide-react';
import {
  getAvailableDormitoryBeds,
  getDormitoryCapacity,
} from '../../domain/buildings/dormitory-capacity';
import {
  calculateGladiatorSaleValue,
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import type { Gladiator, MarketGladiator } from '../../domain/types';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { EmptyState, MetricList, NoticeBox } from '../components/shared';
import { StatusBar } from '../components/StatusBar';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

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
}: {
  candidate: MarketGladiator;
  onBuy(candidateId: string): void;
}) {
  const { currentSave } = useGameStore();
  const { t } = useUiStore();

  if (!currentSave) {
    return null;
  }

  const validation = validateMarketPurchase(currentSave, candidate.id);
  const validationMessageKey = getMarketValidationMessageKey(validation);

  return (
    <article className="gladiator-card">
      <div className="gladiator-card__header">
        <GladiatorPortrait gladiator={candidate} size="small" />
        <div>
          <h3>{candidate.name}</h3>
          <p>{t('market.age', { age: candidate.age })}</p>
        </div>
        <strong>{t('market.price', { price: candidate.price })}</strong>
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
  onSell(gladiatorId: string): void;
}) {
  const { t } = useUiStore();
  const saleValue = calculateGladiatorSaleValue(gladiator);

  return (
    <article className="gladiator-card">
      <div className="gladiator-card__header">
        <GladiatorPortrait gladiator={gladiator} size="small" />
        <div>
          <h3>{gladiator.name}</h3>
          <p>{t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}</p>
        </div>
        <strong>{t('market.saleValue', { price: saleValue })}</strong>
      </div>
      <StatBlock gladiator={gladiator} />
      <TraitList gladiator={gladiator} />
      <div className="gladiator-card__actions">
        <ActionButton
          icon={<UserMinus aria-hidden="true" size={18} />}
          label={t('market.sell')}
          onClick={() => onSell(gladiator.id)}
        />
      </div>
    </article>
  );
}

export function MarketScreen() {
  const { currentSave, buyMarketGladiator, sellGladiator, setGameSpeed } = useGameStore();
  const { navigate, openConfirmModal, t } = useUiStore();

  if (!currentSave) {
    return null;
  }

  const dormitoryCapacity = getDormitoryCapacity(currentSave);
  const availableBeds = getAvailableDormitoryBeds(currentSave);

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
    <section className="ludus-screen">
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
      <section className="panel panel--summary">
        <h2>{t('market.capacityTitle')}</h2>
        <MetricList
          items={[
            {
              labelKey: 'market.ownedBeds',
              value: `${currentSave.gladiators.length}/${dormitoryCapacity}`,
            },
            { labelKey: 'market.availableBeds', value: availableBeds },
            { labelKey: 'market.candidates', value: currentSave.market.availableGladiators.length },
          ]}
        />
        {availableBeds <= 0 ? (
          <NoticeBox tone="warning" testId="market-capacity-full-notice">
            <Bed aria-hidden="true" size={18} />
            <span>{t('market.noBedWarning')}</span>
          </NoticeBox>
        ) : null}
      </section>
      <section className="panel">
        <h2>{t('market.availableGladiators')}</h2>
        {availableBeds <= 0 ? (
          <EmptyState messageKey="market.capacityFullState" testId="market-capacity-full-state" />
        ) : null}
        {currentSave.market.availableGladiators.length > 0 ? (
          <div className="gladiator-grid">
            {currentSave.market.availableGladiators.map((candidate) => (
              <MarketCandidateCard
                candidate={candidate}
                key={candidate.id}
                onBuy={buyMarketGladiator}
              />
            ))}
          </div>
        ) : (
          <EmptyState messageKey="market.noCandidates" />
        )}
      </section>
      <section className="panel">
        <h2>{t('market.ownedGladiators')}</h2>
        {currentSave.gladiators.length > 0 ? (
          <div className="gladiator-grid">
            {currentSave.gladiators.map((gladiator) => (
              <OwnedGladiatorCard
                gladiator={gladiator}
                key={gladiator.id}
                onSell={() => handleSell(gladiator)}
              />
            ))}
          </div>
        ) : (
          <EmptyState messageKey="market.noOwnedGladiators" />
        )}
      </section>
    </section>
  );
}
