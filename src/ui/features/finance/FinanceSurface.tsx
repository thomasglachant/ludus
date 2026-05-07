import type { GameSave } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { GameSurface, SurfaceBody, SurfaceHeader } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { FinancePanel } from './FinancePanel';

export function FinanceSurface({ save }: { save: GameSave }) {
  const { buyoutLoan, takeLoan } = useGameStore();

  return (
    <GameSurface className="game-surface--finance" testId="finance-surface">
      <SurfaceHeader eyebrowKey="finance.eyebrow" titleKey="finance.title" />
      <SurfaceBody>
        <FinancePanel save={save} onBuyoutLoan={buyoutLoan} onTakeLoan={takeLoan} />
      </SurfaceBody>
    </GameSurface>
  );
}
