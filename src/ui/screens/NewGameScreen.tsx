import { useState, type FormEvent } from 'react';
import { generateLudusName } from '../../domain/ludus/name-generator';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { GameIcon } from '../icons/GameIcon';
import { ScreenShell } from '../layout/ScreenShell';

interface NewGameFormProps {
  onBack?(): void;
  showBackAction?: boolean;
}

export function NewGameForm({ onBack, showBackAction = true }: NewGameFormProps) {
  const { createNewGame, isLoading } = useGameStore();
  const { navigate, t } = useUiStore();
  const [ludusName, setLudusName] = useState(() => generateLudusName(''));
  const [showValidation, setShowValidation] = useState(false);

  const updateLudusName = (nextLudusName: string) => {
    setLudusName(nextLudusName);
    setShowValidation(false);
  };

  const submitNewGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ludusName.trim()) {
      setShowValidation(true);
      return;
    }

    void createNewGame({ ludusName });
  };

  const goBack = onBack ?? (() => navigate('mainMenu'));

  return (
    <form className="form-panel" data-testid="new-game-screen" onSubmit={submitNewGame}>
      <label>
        <span>{t('newGame.ludusName')}</span>
        <div className="form-field-with-action">
          <input
            autoComplete="organization"
            data-testid="new-game-ludus-name"
            placeholder={t('newGame.ludusNamePlaceholder')}
            value={ludusName}
            onChange={(event) => updateLudusName(event.target.value)}
          />
          <button
            aria-label={t('newGame.randomLudusName')}
            className="form-random-button"
            data-testid="new-game-random-ludus-name"
            type="button"
            onClick={() => updateLudusName(generateLudusName(ludusName))}
          >
            <GameIcon name="dice" size={18} />
          </button>
        </div>
      </label>
      {showValidation ? <p className="form-error">{t('newGame.validation')}</p> : null}
      <div className="form-actions">
        {showBackAction ? (
          <ActionButton
            icon={<GameIcon name="back" size={18} />}
            label={t('common.back')}
            onClick={goBack}
          />
        ) : null}
        <ActionButton
          disabled={isLoading}
          icon={<GameIcon name="landmark" size={18} />}
          label={isLoading ? t('common.loading') : t('newGame.submit')}
          testId="new-game-submit"
          type="submit"
          variant="primary"
        />
      </div>
    </form>
  );
}

export function NewGameScreen() {
  return (
    <ScreenShell titleKey="newGame.title">
      <NewGameForm />
    </ScreenShell>
  );
}
