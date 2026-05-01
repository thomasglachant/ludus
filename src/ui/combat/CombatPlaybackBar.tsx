import { useUiStore } from '../../state/ui-store-context';
import { CardBlured } from '../components/CardBlured';
import { GameIcon } from '../icons/GameIcon';
import type { CombatReplayViewModel } from './combat-replay-view-model';

interface CombatPlaybackBarProps {
  isPlaying: boolean;
  viewModel: CombatReplayViewModel;
  onEnd(): void;
  onNext(): void;
  onPrevious(): void;
  onStart(): void;
  onTogglePlayback(): void;
}

export function CombatPlaybackBar({
  isPlaying,
  onEnd,
  onNext,
  onPrevious,
  onStart,
  onTogglePlayback,
  viewModel,
}: CombatPlaybackBarProps) {
  const { t } = useUiStore();
  const isAtStart = viewModel.visibleTurns.length === 0;
  const isAtEnd = viewModel.isComplete;

  return (
    <CardBlured as="section" className="combat-playback-bar" data-testid="combat-playback-bar">
      <button
        aria-label={t('combatScreen.playback.start')}
        className="combat-playback-bar__control"
        disabled={isAtStart}
        title={t('combatScreen.playback.start')}
        type="button"
        onClick={onStart}
      >
        <GameIcon name="skipBack" size={20} />
      </button>
      <button
        aria-label={t('combatScreen.playback.previous')}
        className="combat-playback-bar__control"
        disabled={isAtStart}
        title={t('combatScreen.playback.previous')}
        type="button"
        onClick={onPrevious}
      >
        <GameIcon name="back" size={20} />
      </button>
      <button
        aria-label={t(isPlaying ? 'combatScreen.playback.pause' : 'combatScreen.playback.play')}
        className="combat-playback-bar__control combat-playback-bar__control--primary"
        disabled={isAtEnd}
        title={t(isPlaying ? 'combatScreen.playback.pause' : 'combatScreen.playback.play')}
        type="button"
        onClick={onTogglePlayback}
      >
        <GameIcon name={isPlaying ? 'pause' : 'play'} size={24} />
      </button>
      <button
        aria-label={t('combatScreen.playback.next')}
        className="combat-playback-bar__control"
        disabled={isAtEnd}
        title={t('combatScreen.playback.next')}
        type="button"
        onClick={onNext}
      >
        <GameIcon name="arrowRight" size={20} />
      </button>
      <button
        aria-label={t('combatScreen.playback.end')}
        className="combat-playback-bar__control"
        disabled={isAtEnd}
        title={t('combatScreen.playback.end')}
        type="button"
        onClick={onEnd}
      >
        <GameIcon name="nextDay" size={20} />
      </button>
    </CardBlured>
  );
}
