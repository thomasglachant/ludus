import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { BuildingsSurface } from '@/ui/features/buildings/BuildingsSurface';
import { FinanceSurface } from '@/ui/features/finance/FinanceSurface';
import { RosterSurface } from '@/ui/features/gladiators/RosterSurface';
import { MarketSurface } from '@/ui/features/market/MarketSurface';
import { NotificationsSurface } from '@/ui/features/notifications/NotificationsSurface';
import { PlanningSurface } from '@/ui/features/planning/PlanningSurface';

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

  if (activeSurface.kind === 'notifications') {
    return <NotificationsSurface save={currentSave} />;
  }

  return null;
}
