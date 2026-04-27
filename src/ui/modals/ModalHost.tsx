import { useState, type FormEvent } from 'react';
import { useGameStore } from '../../state/game-store';
import { useUiStore, type FormModalField, type UiModalState } from '../../state/ui-store';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { CombatScreen } from '../combat/CombatScreen';
import { ActionButton } from '../components/ActionButton';
import { ArenaPanel, ContractsPanel, EventsPanel } from '../panels/ActivityPanels';
import { BuildingPanel } from '../panels/BuildingPanel';
import { GladiatorDetailPanel } from '../panels/GladiatorDetailPanel';
import { WeeklyPlanningPanel } from '../panels/WeeklyPlanningPanel';
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
  modal,
  onBack,
}: {
  modal: Extract<UiModalState, { kind: 'confirm' }>;
  onBack?(): void;
}) {
  const { closeAllModals, closeModal, t } = useUiStore();

  const confirm = () => {
    const { onConfirm } = modal;

    closeModal();
    onConfirm();
  };

  return (
    <AppModal
      size={modal.size}
      testId={modal.testId ?? 'confirm-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onBack={onBack}
      onClose={closeAllModals}
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
  modal,
  onBack,
}: {
  modal: Extract<UiModalState, { kind: 'form' }>;
  onBack?(): void;
}) {
  const { closeAllModals, closeModal, t } = useUiStore();
  const [values, setValues] = useState(() => createInitialFormValues(modal.fields));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { onSubmit } = modal;

    closeModal();
    onSubmit(values);
  };

  return (
    <AppModal
      size={modal.size ?? 'md'}
      testId={modal.testId ?? 'form-dialog'}
      titleKey={modal.titleKey}
      titleParams={modal.titleParams}
      onBack={onBack}
      onClose={closeAllModals}
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
      <form className="form-panel form-panel--modal" data-modal-form="active" onSubmit={submit}>
        {modal.fields.map((field) => (
          <label key={field.id}>
            <span>{t(field.labelKey)}</span>
            <input
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

function GameModalRouter({ modal, onBack }: { modal: UiModalState; onBack?(): void }) {
  const [activeCombatId, setActiveCombatId] = useState<string | undefined>();
  const {
    acceptWeeklyContract,
    applyPlanningRecommendations,
    completeSundayArenaDay,
    currentSave,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    markArenaCombatPresented,
    purchaseBuilding,
    purchaseBuildingImprovement,
    resolveGameEventChoice,
    saveCurrentGame,
    saveCurrentGameAs,
    scoutOpponent,
    selectBuildingPolicy,
    setGameSpeed,
    showArenaDaySummary,
    startArenaDayCombats,
    updateGladiatorRoutine,
    upgradeBuilding,
  } = useGameStore();
  const { closeAllModals, navigate, openConfirmModal, pushModal } = useUiStore();
  const isDailyEventBlocking = currentSave ? currentSave.events.pendingEvents.length > 0 : false;
  const isArenaDayBlocking = Boolean(currentSave?.arena.arenaDay);

  const openSaveAsDialog = () => {
    if (!currentSave) {
      return;
    }

    pushModal({
      fields: [
        {
          defaultValue: currentSave.player.ludusName,
          id: 'ludusName',
          labelKey: 'newGame.ludusName',
          required: true,
        },
      ],
      kind: 'form',
      onSubmit: (values) => {
        void saveCurrentGameAs({ ludusName: values.ludusName });
      },
      submitLabelKey: 'gameMenu.saveAs',
      titleKey: 'gameMenu.saveAsTitle',
    });
  };

  const quitToMainMenu = () => {
    navigate('mainMenu');
  };

  const requestQuit = () => {
    if (!hasUnsavedChanges) {
      quitToMainMenu();
      return;
    }

    closeAllModals();
    openConfirmModal({
      confirmLabelKey: 'gameMenu.quit',
      kind: 'confirm',
      messageKey: 'gameMenu.quitUnsavedMessage',
      onConfirm: quitToMainMenu,
      testId: 'quit-unsaved-confirmation',
      titleKey: 'gameMenu.quitUnsavedTitle',
      tone: 'danger',
    });
  };

  if (modal.kind === 'gameMenu') {
    return (
      <GameMenuModal
        isSaving={isSaving || isLoading}
        onBack={onBack}
        onClose={closeAllModals}
        onOpenLoadGame={() => pushModal({ kind: 'loadGame' })}
        onQuit={requestQuit}
        onSave={() => void saveCurrentGame().then(closeAllModals)}
        onSaveAs={openSaveAsDialog}
      />
    );
  }

  if (modal.kind === 'options') {
    return <OptionsModal onBack={onBack} onClose={closeAllModals} />;
  }

  if (modal.kind === 'loadGame') {
    return <LoadGameModal onBack={onBack} onClose={closeAllModals} />;
  }

  if (modal.kind === 'newGame') {
    return <NewGameModal onBack={onBack} onClose={closeAllModals} />;
  }

  if (modal.kind === 'market') {
    return <MarketModal onBack={onBack} onClose={closeAllModals} />;
  }

  if (!currentSave) {
    return null;
  }

  if (modal.kind === 'building') {
    return (
      <AppModal
        size="lg"
        testId="building-modal"
        titleKey={BUILDING_DEFINITIONS[modal.buildingId].nameKey}
        onBack={onBack}
        onClose={closeAllModals}
      >
        <BuildingPanel
          buildingId={modal.buildingId}
          save={currentSave}
          onClose={closeAllModals}
          onPurchaseBuilding={purchaseBuilding}
          onPurchaseBuildingImprovement={purchaseBuildingImprovement}
          onSelectBuildingPolicy={selectBuildingPolicy}
          onUpgradeBuilding={upgradeBuilding}
        />
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
        size="lg"
        testId="gladiator-modal"
        title={gladiator.name}
        onBack={onBack}
        onClose={closeAllModals}
      >
        <GladiatorDetailPanel gladiator={gladiator} save={currentSave} onClose={closeAllModals} />
      </AppModal>
    );
  }

  if (modal.kind === 'weeklyPlanning') {
    return (
      <AppModal
        size="xl"
        testId="weekly-planning-modal"
        titleKey="weeklyPlan.dashboard"
        onBack={onBack}
        onClose={closeAllModals}
      >
        <WeeklyPlanningPanel
          save={currentSave}
          onApplyRecommendations={applyPlanningRecommendations}
          onClose={closeAllModals}
          onUpdateRoutine={updateGladiatorRoutine}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'contracts') {
    return (
      <AppModal
        size="lg"
        testId="contracts-modal"
        titleKey="contracts.title"
        onBack={onBack}
        onClose={closeAllModals}
      >
        <ContractsPanel
          save={currentSave}
          onAcceptContract={acceptWeeklyContract}
          onClose={closeAllModals}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'events') {
    return (
      <AppModal
        dismissible={!isDailyEventBlocking}
        size="lg"
        testId="events-modal"
        titleKey="events.title"
        onBack={onBack}
        onClose={closeAllModals}
      >
        <EventsPanel
          save={currentSave}
          onClose={closeAllModals}
          onResolveEventChoice={(eventId, choiceId) => {
            resolveGameEventChoice(eventId, choiceId);
            closeAllModals();
          }}
        />
      </AppModal>
    );
  }

  if (modal.kind === 'arena') {
    return (
      <>
        <AppModal
          dismissible={!isArenaDayBlocking}
          size="xl"
          testId="arena-panel"
          titleKey="arena.title"
          onBack={onBack}
          onClose={closeAllModals}
        >
          <ArenaPanel
            save={currentSave}
            onCompleteArenaDay={completeSundayArenaDay}
            onClose={closeAllModals}
            onOpenCombat={setActiveCombatId}
            onScoutOpponent={scoutOpponent}
            onShowArenaDaySummary={showArenaDaySummary}
            onStartArenaDayCombats={startArenaDayCombats}
          />
        </AppModal>
        {activeCombatId ? (
          <CombatScreen
            combatId={activeCombatId}
            isBlocking={isArenaDayBlocking}
            save={currentSave}
            onClose={() => {
              if (isArenaDayBlocking) {
                markArenaCombatPresented(activeCombatId);
              }

              setActiveCombatId(undefined);
            }}
            onOpenMenu={() => {
              if (!isArenaDayBlocking) {
                pushModal({ kind: 'gameMenu' });
              }
            }}
            onSpeedChange={setGameSpeed}
          />
        ) : null}
      </>
    );
  }

  return null;
}

export function ModalHost() {
  const { activeModal, backModal, modalStack } = useUiStore();

  if (!activeModal) {
    return null;
  }

  const onBack = modalStack.length > 1 ? backModal : undefined;

  if (activeModal.kind === 'confirm') {
    return <ConfirmDialog modal={activeModal} onBack={onBack} />;
  }

  if (activeModal.kind === 'form') {
    return <FormDialog modal={activeModal} onBack={onBack} />;
  }

  return <GameModalRouter modal={activeModal} onBack={onBack} />;
}
