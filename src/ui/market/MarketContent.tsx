import {
  validateMarketPurchase,
  type MarketActionValidation,
} from '../../domain/market/market-actions';
import { getLudusGladiatorCapacity, getLudusStaffCapacity } from '../../domain/ludus/capacity';
import { validateStaffMarketPurchase } from '../../domain/staff/staff-actions';
import type {
  GameSave,
  MarketGladiator,
  StaffMarketCandidate,
  StaffType,
} from '../../domain/types';
import { useState } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { EntityList, EntityListRow } from '../components/EntityList';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorListRow } from '../gladiators/GladiatorListRow';
import { GameIcon } from '../icons/GameIcon';
import {
  ModalContentFrame,
  ModalHeroCard,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '../modals/ModalContentFrame';
import { StaffPortrait } from '../staff/StaffPortrait';

interface MarketContentProps {
  save: GameSave;
  onBuy(candidate: MarketGladiator): void;
  onBuyStaff(candidate: StaffMarketCandidate): void;
}

type MarketTab = 'gladiators' | StaffType;

const marketTabs: ModalTabItem<MarketTab>[] = [
  { id: 'gladiators', labelKey: 'market.tabs.gladiators' },
  { id: 'slave', labelKey: 'market.tabs.slaves' },
  { id: 'trainer', labelKey: 'market.tabs.trainers' },
  { id: 'guard', labelKey: 'market.tabs.guards' },
];

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
          amountMoney: formatMoneyAmount(candidate.price),
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

export function MarketContent({ save, onBuy, onBuyStaff }: MarketContentProps) {
  const { t } = useUiStore();
  const [activeTab, setActiveTab] = useState<MarketTab>('gladiators');
  const gladiatorCapacity = getLudusGladiatorCapacity(save);
  const staffCapacity = getLudusStaffCapacity(save);
  const activeStaffCandidates =
    activeTab === 'gladiators'
      ? []
      : save.staff.marketCandidates.filter((candidate) => candidate.type === activeTab);
  const ownedCapacityValue =
    activeTab === 'gladiators'
      ? t('staff.capacityValue', {
          current: save.gladiators.length,
          maximum: gladiatorCapacity,
        })
      : t('staff.capacityValue', {
          current: save.staff.members.length,
          maximum: staffCapacity,
        });

  return (
    <ModalContentFrame className="market-content">
      <ModalHeroCard
        avatar={<MarketAvatar />}
        descriptionKey="market.subtitle"
        eyebrowKey="market.eyebrow"
        titleKey="market.title"
      />
      <ModalTabs<MarketTab>
        ariaLabelKey="market.tabsLabel"
        items={marketTabs}
        selectedId={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === 'gladiators' ? (
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
      ) : (
        <ModalTabPanel>
          <div className="market-candidates" data-testid={`market-${activeTab}-candidates-section`}>
            <p className="market-candidates__owned-capacity">
              {t('market.currentlyOwned')} {ownedCapacityValue}
            </p>
            <EntityList
              emptyMessageKey={`market.noStaffCandidatesByType.${activeTab}`}
              emptyTestId="market-empty-staff-candidates"
            >
              {activeStaffCandidates.map((candidate) => (
                <StaffCandidateCard
                  candidate={candidate}
                  key={candidate.id}
                  save={save}
                  onBuyStaff={onBuyStaff}
                />
              ))}
            </EntityList>
          </div>
        </ModalTabPanel>
      )}
    </ModalContentFrame>
  );
}
