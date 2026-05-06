import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { ArenaRoute } from '@/ui/features/arena/ArenaRoute';
import { GameStatusMessage } from '@/ui/shared/ludus/GameFeedback';

export function ArenaScreen() {
  const { completeSundayArenaDay, currentSave, errorKey, isLoading } = useGameStore();
  const { navigate } = useUiStore();

  if (!currentSave) {
    return (
      <section className="arena-route arena-route--empty">
        <GameStatusMessage
          messageKey={errorKey ?? (isLoading ? 'common.loading' : 'loadGame.error')}
          surface="dark"
          tone={errorKey ? 'danger' : 'info'}
        />
      </section>
    );
  }

  return (
    <ArenaRoute
      save={currentSave}
      onCompleteArenaDay={completeSundayArenaDay}
      onReturnToLudus={() => navigate('ludus', { gameId: currentSave.gameId })}
    />
  );
}
