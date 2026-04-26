import type { BuildingId, GameSave, GladiatorRoutineUpdate } from '../../domain/types';
import type { ContextPanelKind } from '../game-shell/game-shell-types';
import { ArenaPanel, ContractsPanel, EventsPanel, MarketPreviewPanel } from './ActivityPanels';
import { BuildingPanel } from './BuildingPanel';
import { GladiatorDetailPanel } from './GladiatorDetailPanel';
import { WeeklyPlanningPanel } from './WeeklyPlanningPanel';

interface ContextualPanelHostProps {
  save: GameSave;
  activePanelKind: ContextPanelKind | null;
  selectedBuildingId: BuildingId | null;
  selectedGladiatorId: string | null;
  onAcceptContract(contractId: string): void;
  onApplyPlanningRecommendations(): void;
  onClose(): void;
  onOpenArenaCombat(combatId: string): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
  onPurchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  onResolveEventChoice(eventId: string, choiceId: string): void;
  onScoutOpponent(gladiatorId: string): void;
  onSelectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  onUpdateGladiatorRoutine(gladiatorId: string, update: GladiatorRoutineUpdate): void;
  onUpgradeBuilding(buildingId: BuildingId): void;
}

export function ContextualPanelHost({
  save,
  activePanelKind,
  selectedBuildingId,
  selectedGladiatorId,
  onAcceptContract,
  onApplyPlanningRecommendations,
  onClose,
  onOpenArenaCombat,
  onPurchaseBuilding,
  onPurchaseBuildingImprovement,
  onResolveEventChoice,
  onScoutOpponent,
  onSelectBuildingPolicy,
  onUpdateGladiatorRoutine,
  onUpgradeBuilding,
}: ContextualPanelHostProps) {
  const selectedGladiator = selectedGladiatorId
    ? save.gladiators.find((gladiator) => gladiator.id === selectedGladiatorId)
    : undefined;

  if (!activePanelKind) {
    return null;
  }

  return (
    <aside className="contextual-panel-host">
      {activePanelKind === 'building' && selectedBuildingId ? (
        <BuildingPanel
          buildingId={selectedBuildingId}
          save={save}
          onClose={onClose}
          onPurchaseBuilding={onPurchaseBuilding}
          onPurchaseBuildingImprovement={onPurchaseBuildingImprovement}
          onSelectBuildingPolicy={onSelectBuildingPolicy}
          onUpgradeBuilding={onUpgradeBuilding}
        />
      ) : null}
      {activePanelKind === 'gladiator' && selectedGladiator ? (
        <GladiatorDetailPanel gladiator={selectedGladiator} save={save} onClose={onClose} />
      ) : null}
      {activePanelKind === 'weeklyPlanning' ? (
        <WeeklyPlanningPanel
          save={save}
          onApplyRecommendations={onApplyPlanningRecommendations}
          onClose={onClose}
          onUpdateRoutine={onUpdateGladiatorRoutine}
        />
      ) : null}
      {activePanelKind === 'contracts' ? (
        <ContractsPanel save={save} onAcceptContract={onAcceptContract} onClose={onClose} />
      ) : null}
      {activePanelKind === 'events' ? (
        <EventsPanel save={save} onClose={onClose} onResolveEventChoice={onResolveEventChoice} />
      ) : null}
      {activePanelKind === 'market' ? <MarketPreviewPanel save={save} onClose={onClose} /> : null}
      {activePanelKind === 'arena' ? (
        <ArenaPanel
          save={save}
          onClose={onClose}
          onOpenCombat={onOpenArenaCombat}
          onScoutOpponent={onScoutOpponent}
        />
      ) : null}
    </aside>
  );
}
