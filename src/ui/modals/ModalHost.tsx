import { type FormEvent, useState } from 'react';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore, type FormModalField, type UiModalState } from '../../state/ui-store-context';
import { isWeeklyPlanningComplete } from '../../domain/planning/planning-actions';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { ActionButton } from '../components/ActionButton';
import { ArenaPanel, EventDecisionPanel } from '../panels/ActivityPanels';
import { BuildingPanel } from '../panels/BuildingPanel';
import { BuildingsListPanel } from '../panels/BuildingsListPanel';
import { FinancePanel } from '../panels/FinancePanel';
import { GladiatorsListPanel } from '../panels/GladiatorsListPanel';
import { GladiatorDetailPanel } from '../panels/GladiatorDetailPanel';
import { WeeklyPlanningPanel } from '../panels/WeeklyPlanningPanel';
import { Input } from '../primitives/Input';
import { AppModal } from './AppModal';
import { GameMenuModal } from './GameMenuModal';
import { LoadGameModal } from './LoadGameModal';
import { MarketModal } from './MarketModal';
import { NewGameModal } from './NewGameModal';
import { OptionsModal } from './OptionsModal';

function createInitialFormValues(fields: FormModalField[]) {
  return Object.fromEntries(fields.map((field) => [field.id, field.defaultValue ?? '']));
}

function ConfirmDialog({
  isActive,
  modal,
}: {
  isActive: boolean;
  modal: Extract<UiModalState, { kind: 'confirm' }>;
}) {
  const { closeModal, t } = useUiStore();

  const confirm = () => {
    const { onConfirm } = modal;

    closeModal();
    onConfirm();
  };

  return (
    <AppModal
      isActive={isActive}
      size={modal.size}
      testId={modal.testId ?? 'confirm-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onClose={closeModal}
      footer={
        <div className="form-actions confirm-dialog__actions">
          <ActionButton label={t(modal.cancelLabelKey ?? 'common.cancel')} onClick={closeModal} />
          <ActionButton
            label={t(modal.confirmLabelKey ?? 'common.confirm')}
            variant={modal.tone === 'danger' ? 'secondary' : 'primary'}
            onClick={confirm}
          />
        </div>
      }
    >
      <div
        className={[
          'confirm-dialog',
          `confirm-dialog--${modal.tone ?? 'default'}`,
          modal.content ? 'confirm-dialog--rich' : null,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {modal.content ?? <p>{t(modal.messageKey, modal.messageParams)}</p>}
      </div>
    </AppModal>
  );
}

function FormDialog({
  isActive,
  modal,
}: {
  isActive: boolean;
  modal: Extract<UiModalState, { kind: 'form' }>;
}) {
  const { closeModal, t } = useUiStore();
  const [values, setValues] = useState(() => createInitialFormValues(modal.fields));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { onSubmit } = modal;

    closeModal();
    onSubmit(values);
  };

  return (
    <AppModal
      isActive={isActive}
      size={modal.size ?? 'md'}
      testId={modal.testId ?? 'form-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onClose={closeModal}
      footer={
        <div className="form-actions">
          <ActionButton label={t(modal.cancelLabelKey ?? 'common.cancel')} onClick={closeModal} />
          <ActionButton
            label={t(modal.submitLabelKey ?? 'common.confirm')}
            type="submit"
            variant="primary"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>('[data-modal-form="active"]');
              form?.requestSubmit();
            }}
          />
        </div>
      }
    >
      <form
        className="form-panel form-panel--modal"
        data-modal-form={isActive ? 'active' : 'inactive'}
        onSubmit={submit}
      >
        {modal.fields.map((field) => (
          <label key={field.id}>
            <span>{t(field.labelKey)}</span>
            <Input
              autoComplete={field.autoComplete}
              placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
              required={field.required}
              value={values[field.id]}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  [field.id]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </form>
    </AppModal>
  );
}

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
    advanceWeekStep,
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
    const isPlanningComplete = isWeeklyPlanningComplete(currentSave);

    return (
      <AppModal
        dismissible={isPlanningComplete}
        isActive={isActive}
        size="full"
        testId="weekly-planning-modal"
        titleKey="weeklyPlan.title"
        onClose={closeModal}
      >
        <WeeklyPlanningPanel
          save={currentSave}
          onValidateAndStart={() => {
            advanceWeekStep({ ignoreModalPause: true });
            closeModal();
          }}
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
