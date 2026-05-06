import type { GameSave } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { GameSurface, SurfaceHeader } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { WeeklyPlanningPanel } from './WeeklyPlanningPanel';

export function PlanningSurface({ save }: { save: GameSave }) {
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
