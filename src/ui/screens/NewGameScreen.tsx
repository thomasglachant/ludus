import { ArrowLeft, Dices, Landmark } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { generateLudusName, generateLudusOwnerName } from '../../domain/ludus/name-generator';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { ScreenShell } from '../layout/ScreenShell';

interface NewGameFormProps {
  onBack?(): void;
  showBackAction?: boolean;
}

export function NewGameForm({ onBack, showBackAction = true }: NewGameFormProps) {
  const { createNewGame, isLoading } = useGameStore();
  const { navigate, t } = useUiStore();
  const [ownerName, setOwnerName] = useState(() => generateLudusOwnerName(''));
  const [ludusName, setLudusName] = useState(() => generateLudusName(''));
  const [showValidation, setShowValidation] = useState(false);

  const updateOwnerName = (nextOwnerName: string) => {
    setOwnerName(nextOwnerName);
    setShowValidation(false);
  };

  const updateLudusName = (nextLudusName: string) => {
    setLudusName(nextLudusName);
    setShowValidation(false);
  };

  const submitNewGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ownerName.trim() || !ludusName.trim()) {
      setShowValidation(true);
      return;
    }

    void createNewGame({ ownerName, ludusName });
  };

  const goBack = onBack ?? (() => navigate('mainMenu'));

  return (
    <form className="form-panel" data-testid="new-game-screen" onSubmit={submitNewGame}>
      <label>
        <span>{t('newGame.ownerName')}</span>
        <div className="form-field-with-action">
          <input
            autoComplete="name"
            data-testid="new-game-owner-name"
            placeholder={t('newGame.ownerNamePlaceholder')}
            value={ownerName}
            onChange={(event) => updateOwnerName(event.target.value)}
          />
          <button
            aria-label={t('newGame.randomOwnerName')}
            className="form-random-button"
            data-testid="new-game-random-owner-name"
            type="button"
            onClick={() => updateOwnerName(generateLudusOwnerName(ownerName))}
          >
            <Dices aria-hidden="true" size={18} />
          </button>
        </div>
      </label>
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
            <Dices aria-hidden="true" size={18} />
          </button>
        </div>
      </label>
      {showValidation ? <p className="form-error">{t('newGame.validation')}</p> : null}
      <div className="form-actions">
        {showBackAction ? (
          <ActionButton
            icon={<ArrowLeft aria-hidden="true" size={18} />}
            label={t('common.back')}
            onClick={goBack}
          />
        ) : null}
        <ActionButton
          disabled={isLoading}
          icon={<Landmark aria-hidden="true" size={18} />}
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
