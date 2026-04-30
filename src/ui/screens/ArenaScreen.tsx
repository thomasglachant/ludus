import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { ArenaRoute } from '../arena/ArenaRoute';

export function ArenaScreen() {
  const { completeSundayArenaDay, currentSave, errorKey, isLoading, markArenaCombatPresented } =
    useGameStore();
  const { navigate, t } = useUiStore();

  if (!currentSave) {
    return (
      <section className="arena-route arena-route--empty">
        <p className={errorKey ? 'form-error' : 'empty-state'}>
          {t(errorKey ?? (isLoading ? 'common.loading' : 'loadGame.error'))}
        </p>
      </section>
    );
  }

  return (
    <ArenaRoute
      save={currentSave}
      onCompleteArenaDay={completeSundayArenaDay}
      onMarkCombatPresented={markArenaCombatPresented}
      onReturnToLudus={() => navigate('ludus', { gameId: currentSave.gameId })}
    />
  );
}
