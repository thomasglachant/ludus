import { useGameStore } from '@/state/game-store-context';
import { useUiStore, type UiModalState } from '@/state/ui-store-context';
import { BUILDING_DEFINITIONS } from '@/game-data/buildings';
import { ArenaPanel } from '@/ui/features/arena/ArenaPanel';
import { EventDecisionPanel } from '@/ui/features/events/EventDecisionPanel';
import { BuildingPanel } from '@/ui/features/buildings/BuildingPanel';
import { BuildingsListPanel } from '@/ui/features/buildings/BuildingsListPanel';
import { FinancePanel } from '@/ui/features/finance/FinancePanel';
import { GladiatorsListPanel } from '@/ui/features/gladiators/GladiatorsListPanel';
import { GladiatorDetailPanel } from '@/ui/features/gladiators/GladiatorDetailPanel';
import { WeeklyPlanningPanel } from '@/ui/features/planning/WeeklyPlanningPanel';
import { GameMenuModal } from '@/ui/features/ludus/shell/GameMenuModal';
import { LoadGameModal } from '@/ui/features/main-menu/LoadGameModal';
import { MarketModal } from '@/ui/features/market/MarketModal';
import { NewGameModal } from '@/ui/features/new-game/NewGameModal';
import { OptionsModal } from '@/ui/features/main-menu/OptionsModal';
import { AppModal } from './AppModal';
import { ConfirmDialog } from './ConfirmDialog';
import { FormDialog } from './FormDialog';

function GameModalRouter({ isActive, modal }: { isActive: boolean; modal: UiModalState }) {
  const {
    currentSave,
    buyoutLoan,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    allocateGladiatorSkillPoint,
    purchaseBuilding,
    purchaseBuildingImprovement,
    purchaseBuildingSkill,
    resolveGameEventChoice,
    saveCurrentGame,
    selectBuildingPolicy,
    sellGladiator,
    takeLoan,
    updateDailyPlan,
    updateDailyPlanBuildingActivitySelection,
    upgradeBuilding,
  } = useGameStore();
  const { closeAllModals, closeModal, navigate, openConfirmModal, pushModal } = useUiStore();

  const quitToMainMenu = () => {
    navigate('mainMenu');
  };

  const requestSellGladiator = (gladiatorId: string) => {
    const gladiator = currentSave?.gladiators.find((candidate) => candidate.id === gladiatorId);

    if (!gladiator) {
      return;
    }

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

  if (modal.kind === 'gameMenu') {
    return (
      <GameMenuModal
        hasUnsavedChanges={hasUnsavedChanges}
        isActive={isActive}
        isSaving={isSaving || isLoading}
        onClose={closeModal}
        onQuit={quitToMainMenu}
        onSave={() => void saveCurrentGame().then(closeModal)}
      />
    );
  }

  if (modal.kind === 'options') {
    return <OptionsModal isActive={isActive} onClose={closeModal} />;
  }

  if (modal.kind === 'loadGame') {
    return <LoadGameModal isActive={isActive} onClose={closeModal} />;
  }

  if (modal.kind === 'newGame') {
    return <NewGameModal isActive={isActive} onClose={closeModal} />;
  }

  if (modal.kind === 'market') {
    return <MarketModal isActive={isActive} onClose={closeModal} />;
  }

  if (!currentSave) {
    return null;
  }

  if (modal.kind === 'building') {
    if (!currentSave.buildings[modal.buildingId].isPurchased) {
      return null;
    }

    return (
      <AppModal
        isActive={isActive}
        size="lg"
        testId="building-modal"
        titleKey={BUILDING_DEFINITIONS[modal.buildingId].nameKey}
        onClose={closeModal}
      >
        <BuildingPanel
          buildingId={modal.buildingId}
          save={currentSave}
          onClose={closeModal}
          onPurchaseBuilding={purchaseBuilding}
          onPurchaseBuildingImprovement={purchaseBuildingImprovement}
          onPurchaseBuildingSkill={purchaseBuildingSkill}
          onSelectBuildingPolicy={selectBuildingPolicy}
          onUpgradeBuilding={upgradeBuilding}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'buildingsList') {
    return (
      <AppModal
        isActive={isActive}
        size="xl"
        testId="buildings-list-modal"
        titleKey="navigation.buildings"
        onClose={closeModal}
      >
        <BuildingsListPanel
          save={currentSave}
          onClose={closeModal}
          onOpenBuilding={(buildingId) => {
            pushModal({ buildingId, kind: 'building' });
          }}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'gladiatorsList') {
    return (
      <AppModal
        isActive={isActive}
        size="lg"
        testId="gladiators-list-modal"
        titleKey="roster.title"
        onClose={closeModal}
      >
        <GladiatorsListPanel
          save={currentSave}
          onClose={closeModal}
          onOpenGladiator={(gladiatorId) => {
            pushModal({ gladiatorId, kind: 'gladiator' });
          }}
          onSellGladiator={requestSellGladiator}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'finance') {
    return (
      <AppModal
        isActive={isActive}
        size="xl"
        testId="finance-modal"
        titleKey="finance.title"
        onClose={closeModal}
      >
        <FinancePanel save={currentSave} onBuyoutLoan={buyoutLoan} onTakeLoan={takeLoan} />
      </AppModal>
    );
  }

  if (modal.kind === 'gladiator') {
    const gladiator = currentSave.gladiators.find(
      (candidate) => candidate.id === modal.gladiatorId,
    );

    if (!gladiator) {
      return null;
    }

    return (
      <AppModal
        isActive={isActive}
        size="lg"
        testId="gladiator-modal"
        title={gladiator.name}
        onClose={closeModal}
      >
        <GladiatorDetailPanel
          gladiator={gladiator}
          save={currentSave}
          onAllocateSkillPoint={allocateGladiatorSkillPoint}
          onClose={closeModal}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'weeklyPlanning') {
    return (
      <AppModal
        isActive={isActive}
        size="full"
        testId="weekly-planning-modal"
        titleKey="weeklyPlan.title"
        onClose={closeModal}
      >
        <WeeklyPlanningPanel
          save={currentSave}
          onUpdateDailyPlan={updateDailyPlan}
          onUpdateBuildingActivitySelection={updateDailyPlanBuildingActivitySelection}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'dailyEvent') {
    const event = currentSave.events.pendingEvents.find(
      (candidate) => candidate.id === modal.eventId,
    );

    if (!event) {
      return null;
    }

    return (
      <AppModal
        dismissible={false}
        isActive={isActive}
        size="lg"
        testId="daily-event-modal"
        titleKey="events.title"
        onClose={closeModal}
      >
        <EventDecisionPanel
          event={event}
          save={currentSave}
          onClose={closeModal}
          onOpenGladiator={(gladiatorId) => pushModal({ gladiatorId, kind: 'gladiator' })}
          onResolveEventChoice={(eventId, choiceId) => {
            resolveGameEventChoice(eventId, choiceId);
            closeModal();
          }}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'arena') {
    return (
      <AppModal
        isActive={isActive}
        size="md"
        testId="arena-panel"
        titleKey="arena.title"
        onClose={closeModal}
      >
        <ArenaPanel
          save={currentSave}
          onClose={closeModal}
          onOpenArenaRoute={() => {
            closeAllModals();
            navigate('arena', { gameId: currentSave.gameId });
          }}
        />
      </AppModal>
    );
  }

  return null;
}

export function ModalHost() {
  const { modalStack } = useUiStore();

  if (modalStack.length === 0) {
    return null;
  }

  return (
    <>
      {modalStack.map((modal, index) => {
        const isActive = index === modalStack.length - 1;

        if (modal.kind === 'confirm') {
          return <ConfirmDialog isActive={isActive} key={modal.id} modal={modal} />;
        }

        if (modal.kind === 'form') {
          return <FormDialog isActive={isActive} key={modal.id} modal={modal} />;
        }

        return <GameModalRouter isActive={isActive} key={modal.id} modal={modal} />;
      })}
    </>
  );
}
