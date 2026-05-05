import { useMemo } from 'react';
import { getAvailableSkillPoints } from '../../domain/gladiators/progression';
import { getAvailableLudusGladiatorPlaces } from '../../domain/ludus/capacity';
import { calculateGladiatorSaleValue } from '../../domain/market/market-actions';
import type { GameSave, Gladiator, MarketGladiator } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useGameStore } from '../../state/game-store-context';
import {
  useUiStore,
  type BuildingSurfaceTab,
  type RosterFilter,
} from '../../state/ui-store-context';
import { BuildingsOverview } from '../buildings/BuildingsOverview';
import { UserAlert } from '../components/UserAlert';
import { EntityList } from '../components/EntityList';
import { formatMoneyAmount } from '../formatters/money';
import { GameIcon } from '../icons/GameIcon';
import { MarketContent } from '../market/MarketContent';
import { BuildingPanel } from '../panels/BuildingPanel';
import { FinancePanel } from '../panels/FinancePanel';
import { GladiatorDetailPanel } from '../panels/GladiatorDetailPanel';
import { WeeklyPlanningPanel } from '../panels/WeeklyPlanningPanel';
import { GladiatorAttributes } from '../gladiators/GladiatorAttributes';
import { GladiatorExperienceBar } from '../gladiators/GladiatorExperienceBar';
import { GladiatorListRow } from '../gladiators/GladiatorListRow';
import { GladiatorSkillBars } from '../gladiators/GladiatorSkillBars';
import { GladiatorStatusEffects } from '../gladiators/GladiatorStatusEffects';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { ContextSheet, GameSurface, SurfaceHeader, SurfaceTabs } from './SurfaceFrame';

const rosterFilters: RosterFilter[] = ['all', 'ready', 'injured', 'levelUp'];

function hasInjury(save: GameSave, gladiatorId: string) {
  return save.statusEffects.some(
    (effect) => effect.effectId === 'injury' && effect.target.id === gladiatorId,
  );
}

function getFilteredGladiators(save: GameSave, filter: RosterFilter) {
  if (filter === 'ready') {
    return save.gladiators.filter((gladiator) => !hasInjury(save, gladiator.id));
  }

  if (filter === 'injured') {
    return save.gladiators.filter((gladiator) => hasInjury(save, gladiator.id));
  }

  if (filter === 'levelUp') {
    return save.gladiators.filter((gladiator) => getAvailableSkillPoints(gladiator) > 0);
  }

  return save.gladiators;
}

function requestSellGladiator(
  gladiator: Gladiator,
  onSellGladiator: (gladiatorId: string) => void,
  openConfirmModal: ReturnType<typeof useUiStore>['openConfirmModal'],
) {
  openConfirmModal({
    kind: 'confirm',
    confirmLabelKey: 'market.sell',
    messageKey: 'market.sellConfirmation',
    messageParams: { name: gladiator.name },
    onConfirm: () => onSellGladiator(gladiator.id),
    testId: 'market-sell-confirm-dialog',
    titleKey: 'market.sellConfirmationTitle',
  });
}

function GladiatorContextSheet({ gladiator, save }: { gladiator: Gladiator; save: GameSave }) {
  const { closeContextSheet, openSurface, t } = useUiStore();

  return (
    <ContextSheet titleKey="surface.contextSheet.gladiatorTitle" onClose={closeContextSheet}>
      <div className="context-sheet__hero">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div>
          <span>{t('gladiatorPanel.eyebrow')}</span>
          <h3>{gladiator.name}</h3>
          <GladiatorAttributes gladiator={gladiator} />
        </div>
      </div>
      <GladiatorStatusEffects gladiator={gladiator} save={save} />
      <GladiatorSkillBars gladiator={gladiator} />
      <GladiatorExperienceBar gladiator={gladiator} />
      <div className="context-sheet__actions">
        <button
          type="button"
          onClick={() => {
            closeContextSheet();
            openSurface({ kind: 'gladiators', selectedGladiatorId: gladiator.id });
          }}
        >
          <GameIcon name="view" size={17} />
          <span>{t('surface.openFullGladiator')}</span>
        </button>
      </div>
    </ContextSheet>
  );
}

function SurfaceContextSheet({ save }: { save: GameSave }) {
  const { activeSurface } = useUiStore();

  if (!activeSurface.contextSheet) {
    return null;
  }

  if (activeSurface.contextSheet.kind === 'gladiator') {
    const gladiator = save.gladiators.find(
      (candidate) => candidate.id === activeSurface.contextSheet?.id,
    );

    return gladiator ? <GladiatorContextSheet gladiator={gladiator} save={save} /> : null;
  }

  return null;
}

function BuildingsSurface({ save }: { save: GameSave }) {
  const { activeSurface, openContextSheet, openSurface } = useUiStore();
  const {
    purchaseBuilding,
    purchaseBuildingImprovement,
    purchaseBuildingSkill,
    selectBuildingPolicy,
    upgradeBuilding,
  } = useGameStore();
  const selectedBuildingId = activeSurface.selectedBuildingId;
  const selectedBuilding =
    selectedBuildingId && save.buildings[selectedBuildingId]?.isPurchased
      ? save.buildings[selectedBuildingId]
      : null;
  const tab = activeSurface.selectedBuildingTab ?? 'overview';

  if (!selectedBuilding || !selectedBuildingId) {
    return (
      <GameSurface className="game-surface--buildings" testId="buildings-surface">
        <SurfaceHeader eyebrowKey="buildingsOverview.eyebrow" titleKey="buildingsOverview.title" />
        <div className="game-surface__body game-surface__body--list buildings-surface__body">
          <BuildingsOverview
            save={save}
            showHeader={false}
            variant="embedded"
            onOpenBuilding={(buildingId) =>
              openSurface({
                kind: 'buildings',
                selectedBuildingId: buildingId,
                selectedBuildingTab: 'overview',
              })
            }
          />
        </div>
      </GameSurface>
    );
  }

  const definition = BUILDING_DEFINITIONS[selectedBuildingId];

  return (
    <GameSurface className="game-surface--buildings" testId="buildings-surface">
      <SurfaceHeader
        backLabelKey="navigation.buildings"
        eyebrowKey="buildingsOverview.eyebrow"
        titleKey={definition.nameKey}
        onBack={() => openSurface({ kind: 'buildings' })}
      />
      <div className="game-surface__body game-surface__body--detail buildings-surface__body">
        <div className="buildings-surface__detail">
          <BuildingPanel
            activeTab={tab}
            buildingId={selectedBuildingId}
            save={save}
            onClose={() => openSurface({ kind: 'buildings' })}
            onOpenGladiator={(gladiatorId) =>
              openContextSheet({ id: gladiatorId, kind: 'gladiator', source: 'building' })
            }
            onPurchaseBuilding={purchaseBuilding}
            onPurchaseBuildingImprovement={purchaseBuildingImprovement}
            onPurchaseBuildingSkill={purchaseBuildingSkill}
            onSelectBuildingPolicy={selectBuildingPolicy}
            onTabChange={(nextTab: BuildingSurfaceTab) =>
              openSurface({
                ...activeSurface,
                kind: 'buildings',
                selectedBuildingId,
                selectedBuildingTab: nextTab,
              })
            }
            onUpgradeBuilding={upgradeBuilding}
          />
        </div>
      </div>
      <SurfaceContextSheet save={save} />
    </GameSurface>
  );
}

function RosterSurface({ save }: { save: GameSave }) {
  const { activeSurface, openConfirmModal, openSurface, t } = useUiStore();
  const { allocateGladiatorSkillPoint, sellGladiator } = useGameStore();
  const filter = activeSurface.rosterFilter ?? 'all';
  const gladiators = useMemo(() => getFilteredGladiators(save, filter), [filter, save]);
  const selectedGladiator = save.gladiators.find(
    (gladiator) => gladiator.id === activeSurface.selectedGladiatorId,
  );

  if (selectedGladiator) {
    return (
      <GameSurface className="game-surface--roster" testId="roster-surface">
        <SurfaceHeader
          backLabelKey="navigation.gladiators"
          eyebrowKey="roster.eyebrow"
          title={selectedGladiator.name}
          onBack={() => openSurface({ kind: 'gladiators', rosterFilter: filter })}
        />
        <div className="game-surface__body game-surface__body--detail roster-surface__body">
          <div className="roster-surface__detail">
            <GladiatorDetailPanel
              gladiator={selectedGladiator}
              save={save}
              onAllocateSkillPoint={allocateGladiatorSkillPoint}
              onClose={() => openSurface({ kind: 'gladiators', rosterFilter: filter })}
              onOpenPlanning={() => openSurface({ kind: 'planning' })}
            />
          </div>
        </div>
      </GameSurface>
    );
  }

  return (
    <GameSurface className="game-surface--roster" testId="roster-surface">
      <SurfaceHeader eyebrowKey="roster.eyebrow" titleKey="roster.title">
        <SurfaceTabs<RosterFilter>
          ariaLabelKey="surface.rosterFilters"
          items={rosterFilters.map((id) => ({
            count: getFilteredGladiators(save, id).length,
            id,
            labelKey: `surface.rosterFilter.${id}`,
          }))}
          selectedId={filter}
          onSelect={(rosterFilter) => openSurface({ kind: 'gladiators', rosterFilter })}
        />
      </SurfaceHeader>
      <div className="game-surface__body game-surface__body--list roster-surface__body">
        <div className="roster-surface__list">
          <EntityList emptyMessageKey="ludus.noGladiators">
            {gladiators.map((gladiator) => (
              <GladiatorListRow
                action={{
                  iconName: 'userMinus',
                  id: 'sell',
                  label: `${t('market.sell')} (${formatMoneyAmount(
                    calculateGladiatorSaleValue(gladiator),
                  )})`,
                  onClick: () => requestSellGladiator(gladiator, sellGladiator, openConfirmModal),
                  testId: `market-sell-${gladiator.id}`,
                }}
                gladiator={gladiator}
                key={gladiator.id}
                openLabel={t('roster.openGladiator', { name: gladiator.name })}
                testId={`roster-surface-row-${gladiator.id}`}
                onOpen={() =>
                  openSurface({
                    kind: 'gladiators',
                    rosterFilter: filter,
                    selectedGladiatorId: gladiator.id,
                  })
                }
              />
            ))}
          </EntityList>
        </div>
      </div>
    </GameSurface>
  );
}

function PlanningSurface({ save }: { save: GameSave }) {
  const { updateDailyPlan, updateDailyPlanBuildingActivitySelection } = useGameStore();

  return (
    <GameSurface className="game-surface--planning" testId="planning-surface">
      <SurfaceHeader eyebrowKey="navigation.weeklyPlanning" titleKey="weeklyPlan.title" />
      <div className="game-surface__body">
        <WeeklyPlanningPanel
          save={save}
          onUpdateDailyPlan={updateDailyPlan}
          onUpdateBuildingActivitySelection={updateDailyPlanBuildingActivitySelection}
        />
      </div>
    </GameSurface>
  );
}

function FinanceSurface({ save }: { save: GameSave }) {
  const { buyoutLoan, takeLoan } = useGameStore();

  return (
    <GameSurface className="game-surface--finance" testId="finance-surface">
      <SurfaceHeader eyebrowKey="finance.eyebrow" titleKey="finance.title" />
      <div className="game-surface__body">
        <FinancePanel save={save} onBuyoutLoan={buyoutLoan} onTakeLoan={takeLoan} />
      </div>
    </GameSurface>
  );
}

function MarketSurface({ save }: { save: GameSave }) {
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

export function SurfaceHost() {
  const { activeSurface } = useUiStore();
  const { currentSave } = useGameStore();

  if (!currentSave) {
    return null;
  }

  if (activeSurface.kind === 'buildings') {
    return <BuildingsSurface save={currentSave} />;
  }

  if (activeSurface.kind === 'gladiators') {
    return <RosterSurface save={currentSave} />;
  }

  if (activeSurface.kind === 'planning') {
    return <PlanningSurface save={currentSave} />;
  }

  if (activeSurface.kind === 'finance') {
    return <FinanceSurface save={currentSave} />;
  }

  if (activeSurface.kind === 'market') {
    return <MarketSurface save={currentSave} />;
  }

  return null;
}
