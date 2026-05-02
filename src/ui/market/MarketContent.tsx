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
import { EntityList, EntityListRow } from '../components/EntityList';
import { MetricList } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
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

function MarketRowSubtitle({ label, warning }: { label: string; warning?: string }) {
  return (
    <>
      <span>{label}</span>
      {warning ? <span className="entity-list-row__warning">{warning}</span> : null}
    </>
  );
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
    <EntityListRow
      actions={[
        {
          disabled: !validation.isAllowed,
          iconName: 'shoppingCart',
          id: 'buy',
          label: t('market.buy'),
          onClick: () => onBuy(candidate),
          testId: `market-buy-${candidate.id}`,
          variant: 'primary',
        },
      ]}
      avatar={<GladiatorPortrait gladiator={candidate} size="small" />}
      info={[
        {
          iconName: 'treasury',
          id: 'price',
          label: t('market.priceLabel'),
          tone: 'warning',
          value: formattedPrice,
        },
        {
          iconName: 'reputation',
          id: 'reputation',
          label: t('gladiatorPanel.reputation'),
          value: candidate.reputation,
        },
        {
          iconName: 'health',
          id: 'health',
          label: t('roster.healthShort'),
          value: candidate.health,
        },
      ]}
      testId={`market-candidate-${candidate.id}`}
      subtitle={
        <MarketRowSubtitle
          label={t('market.age', { age: candidate.age })}
          warning={validationMessageKey ? t(validationMessageKey) : undefined}
        />
      }
      title={candidate.name}
    />
  );
}

function OwnedGladiatorCard({
  gladiator,
  onSell,
}: {
  gladiator: Gladiator;
  onSell(gladiator: Gladiator): void;
}) {
  const { pushModal, t } = useUiStore();
  const formattedSaleValue = formatMoneyAmount(calculateGladiatorSaleValue(gladiator));

  return (
    <EntityListRow
      actions={[
        {
          iconName: 'userMinus',
          id: 'sell',
          label: t('market.sell'),
          onClick: () => onSell(gladiator),
          testId: `market-sell-${gladiator.id}`,
        },
      ]}
      avatar={<GladiatorPortrait gladiator={gladiator} size="small" />}
      info={[
        {
          iconName: 'treasury',
          id: 'sale-value',
          label: t('market.saleValueLabel'),
          value: formattedSaleValue,
        },
        {
          iconName: 'reputation',
          id: 'reputation',
          label: t('gladiatorPanel.reputation'),
          value: gladiator.reputation,
        },
        {
          iconName: 'morale',
          id: 'morale',
          label: t('roster.moraleShort'),
          value: gladiator.morale,
        },
      ]}
      openLabel={t('roster.openGladiator', { name: gladiator.name })}
      testId={`market-owned-${gladiator.id}`}
      subtitle={t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}
      title={gladiator.name}
      onOpen={() => pushModal({ gladiatorId: gladiator.id, kind: 'gladiator' })}
    />
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
    <EntityListRow
      actions={[
        {
          disabled: !validation.isAllowed,
          iconName: 'shoppingCart',
          id: 'buy',
          label: t('market.buy'),
          onClick: () => onBuyStaff(candidate),
          testId: `market-buy-staff-${candidate.id}`,
          variant: 'primary',
        },
      ]}
      avatar={<StaffPortrait staffMember={candidate} />}
      info={[
        {
          iconName: 'treasury',
          id: 'price',
          label: t('market.priceLabel'),
          tone: 'warning',
          value: formatMoneyAmount(candidate.price),
        },
        {
          iconName: 'treasury',
          id: 'weekly-wage',
          label: t('staff.weeklyWage'),
          value: formatMoneyAmount(candidate.weeklyWage),
        },
      ]}
      testId={`market-staff-candidate-${candidate.id}`}
      subtitle={
        <MarketRowSubtitle
          label={t(`staff.types.${candidate.type}`)}
          warning={validationMessageKey ? t(validationMessageKey) : undefined}
        />
      }
      title={candidate.name}
    />
  );
}

function OwnedStaffCard({
  onSellStaff,
  staffMember,
}: {
  onSellStaff(staffMember: StaffMember): void;
  staffMember: StaffMember;
}) {
  const { pushModal, t } = useUiStore();
  const formattedSaleValue = formatMoneyAmount(calculateStaffSaleValue(staffMember));

  return (
    <EntityListRow
      actions={[
        {
          iconName: 'userMinus',
          id: 'sell',
          label: t('market.sell'),
          onClick: () => onSellStaff(staffMember),
          testId: `market-sell-staff-${staffMember.id}`,
        },
      ]}
      avatar={<StaffPortrait staffMember={staffMember} />}
      info={[
        {
          iconName: 'treasury',
          id: 'sale-value',
          label: t('market.saleValueLabel'),
          value: formattedSaleValue,
        },
        {
          iconName: 'treasury',
          id: 'weekly-wage',
          label: t('staff.weeklyWage'),
          value: formatMoneyAmount(staffMember.weeklyWage),
        },
      ]}
      openLabel={t('staff.openDetailsFor', { name: staffMember.name })}
      testId={`market-owned-staff-${staffMember.id}`}
      subtitle={t(`staff.types.${staffMember.type}`)}
      title={staffMember.name}
      onOpen={() => pushModal({ kind: 'staff', staffId: staffMember.id })}
    />
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
        <EntityList emptyMessageKey="market.noCandidates" emptyTestId="market-empty-candidates">
          {save.market.availableGladiators.map((candidate) => (
            <MarketCandidateCard
              candidate={candidate}
              key={candidate.id}
              save={save}
              onBuy={onBuy}
            />
          ))}
        </EntityList>
      </section>
      <section className="market-candidates" data-testid="market-owned-section">
        <h2>{t('market.ownedGladiators')}</h2>
        <EntityList emptyMessageKey="market.noOwnedGladiators" emptyTestId="market-empty-owned">
          {save.gladiators.map((gladiator) => (
            <OwnedGladiatorCard gladiator={gladiator} key={gladiator.id} onSell={onSell} />
          ))}
        </EntityList>
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
        <EntityList
          emptyMessageKey="market.noStaffCandidates"
          emptyTestId="market-empty-staff-candidates"
        >
          {save.staff.marketCandidates.map((candidate) => (
            <StaffCandidateCard
              candidate={candidate}
              key={candidate.id}
              save={save}
              onBuyStaff={onBuyStaff}
            />
          ))}
        </EntityList>
      </section>
      <section className="market-candidates" data-testid="market-owned-staff-section">
        <h2>{t('market.ownedStaff')}</h2>
        <EntityList emptyMessageKey="market.noOwnedStaff" emptyTestId="market-empty-owned-staff">
          {save.staff.members.map((staffMember) => (
            <OwnedStaffCard
              key={staffMember.id}
              staffMember={staffMember}
              onSellStaff={onSellStaff}
            />
          ))}
        </EntityList>
      </section>
    </div>
  );
}
