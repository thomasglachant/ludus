import { AppModal } from '@/ui/app-shell/modals/AppModal';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { useUiStore } from '@/state/ui-store-context';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';

interface GameOverModalProps {
  isActive?: boolean;
  onNewGame(): void;
}

export function GameOverModal({ isActive = true, onNewGame }: GameOverModalProps) {
  const { t } = useUiStore();

  return (
    <AppModal
      dismissible={false}
      isActive={isActive}
      size="lg"
      testId="game-over-modal"
      titleKey="gameOver.title"
      onClose={() => undefined}
    >
      <section className="game-over-modal">
        <div className="game-over-modal__crest" aria-hidden="true">
          <GameIcon name="defeat" size={76} />
        </div>
        <div className="game-over-modal__copy">
          <p>{t('gameOver.subtitle')}</p>
          <strong>{t('gameOver.verdict')}</strong>
          <span>{t('gameOver.body')}</span>
        </div>
        <PrimaryActionButton className="game-over-modal__action" size="lg" onClick={onNewGame}>
          {t('gameOver.newGame')}
        </PrimaryActionButton>
      </section>
    </AppModal>
  );
}
