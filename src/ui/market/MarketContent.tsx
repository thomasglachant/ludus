import {
  calculateGladiatorSaleValue,
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import { getLudusStaffCapacity } from '../../domain/ludus/capacity';
import {
  calculateStaffSaleValue,
  validateStaffMarketPurchase,
} from '../../domain/staff/staff-actions';
import type {
  GameSave,
  Gladiator,
  MarketGladiator,
  StaffMarketCandidate,
  StaffMember,
} from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { CTAButton } from '../components/CTAButton';
import { EmptyState, MetricList, SectionCard } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';
import { GameIcon } from '../icons/GameIcon';
import { StaffPortrait } from '../staff/StaffPortrait';

interface MarketContentProps {
  save: GameSave;
  onBuy(candidate: MarketGladiator): void;
  onBuyStaff(candidate: StaffMarketCandidate): void;
  onSell(gladiator: Gladiator): void;
  onSellStaff(staffMember: StaffMember): void;
}

function getMarketValidationMessageKey(validation: MarketActionValidation) {
  if (validation.reason === 'noAvailablePlace') {
    return null;
  }

  return validation.reason ? `market.validation.${validation.reason}` : null;
}

function getStaffValidationMessageKey(reason?: string) {
  return reason ? `market.validation.${reason}` : null;
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

function StaffCandidateCard({
  candidate,
  onBuyStaff,
  save,
}: {
  candidate: StaffMarketCandidate;
  onBuyStaff(candidate: StaffMarketCandidate): void;
  save: GameSave;
}) {
  const { t } = useUiStore();
  const validation = validateStaffMarketPurchase(save, candidate.id);
  const validationMessageKey = getStaffValidationMessageKey(validation.reason);

  return (
    <SectionCard className="staff-card" testId={`market-staff-candidate-${candidate.id}`}>
      <StaffPortrait staffMember={candidate} />
      <div className="staff-card__body">
        <strong>{candidate.name}</strong>
        <MetricList
          columns={3}
          items={[
            { labelKey: 'staff.type', value: t(`staff.types.${candidate.type}`) },
            { labelKey: 'market.priceLabel', value: formatMoneyAmount(candidate.price) },
            { labelKey: 'staff.weeklyWage', value: formatMoneyAmount(candidate.weeklyWage) },
          ]}
        />
        {validationMessageKey ? (
          <p className="market-gladiator-summary__warning">{t(validationMessageKey)}</p>
        ) : null}
        <div className="market-gladiator-summary__footer">
          <CTAButton
            data-testid={`market-buy-staff-${candidate.id}`}
            disabled={!validation.isAllowed}
            onClick={() => onBuyStaff(candidate)}
          >
            <GameIcon color="#fff9e7" name="shoppingCart" size={18} />
            <span>{t('market.buy')}</span>
          </CTAButton>
        </div>
      </div>
    </SectionCard>
  );
}

function OwnedStaffCard({
  onSellStaff,
  staffMember,
}: {
  onSellStaff(staffMember: StaffMember): void;
  staffMember: StaffMember;
}) {
  const { t } = useUiStore();
  const formattedSaleValue = formatMoneyAmount(calculateStaffSaleValue(staffMember));

  return (
    <SectionCard className="staff-card" testId={`market-owned-staff-${staffMember.id}`}>
      <StaffPortrait staffMember={staffMember} />
      <div className="staff-card__body">
        <strong>{staffMember.name}</strong>
        <MetricList
          columns={3}
          items={[
            { labelKey: 'staff.type', value: t(`staff.types.${staffMember.type}`) },
            { labelKey: 'market.saleValueLabel', value: formattedSaleValue },
            { labelKey: 'staff.weeklyWage', value: formatMoneyAmount(staffMember.weeklyWage) },
          ]}
        />
        <div className="market-gladiator-summary__footer">
          <ActionButton
            icon={<GameIcon name="userMinus" size={18} />}
            label={t('market.sell')}
            testId={`market-sell-staff-${staffMember.id}`}
            onClick={() => onSellStaff(staffMember)}
          />
        </div>
      </div>
    </SectionCard>
  );
}

export function MarketContent({
  save,
  onBuy,
  onBuyStaff,
  onSell,
  onSellStaff,
}: MarketContentProps) {
  const { t } = useUiStore();
  const staffCapacity = getLudusStaffCapacity(save);

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
      <section className="market-candidates" data-testid="market-staff-candidates-section">
        <h2>{t('market.availableStaff')}</h2>
        <MetricList
          columns={2}
          items={[
            {
              labelKey: 'staff.capacity',
              value: t('staff.capacityValue', {
                current: save.staff.members.length,
                maximum: staffCapacity,
              }),
            },
            {
              labelKey: 'staff.capacitySource',
              value: t('staff.capacitySourceValue', { level: save.buildings.domus.level }),
            },
          ]}
        />
        {save.staff.marketCandidates.length > 0 ? (
          <div className="context-panel__list">
            {save.staff.marketCandidates.map((candidate) => (
              <StaffCandidateCard
                candidate={candidate}
                key={candidate.id}
                save={save}
                onBuyStaff={onBuyStaff}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            messageKey="market.noStaffCandidates"
            testId="market-empty-staff-candidates"
          />
        )}
      </section>
      <section className="market-candidates" data-testid="market-owned-staff-section">
        <h2>{t('market.ownedStaff')}</h2>
        {save.staff.members.length > 0 ? (
          <div className="context-panel__list">
            {save.staff.members.map((staffMember) => (
              <OwnedStaffCard
                key={staffMember.id}
                staffMember={staffMember}
                onSellStaff={onSellStaff}
              />
            ))}
          </div>
        ) : (
          <EmptyState messageKey="market.noOwnedStaff" testId="market-empty-owned-staff" />
        )}
      </section>
    </div>
  );
}
