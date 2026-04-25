import { ArrowLeft, Landmark } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { ScreenShell } from '../layout/ScreenShell';

export function NewGameScreen() {
  const { createNewGame, isLoading } = useGameStore();
  const { navigate, t } = useUiStore();
  const [ownerName, setOwnerName] = useState('');
  const [ludusName, setLudusName] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const submitNewGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ownerName.trim() || !ludusName.trim()) {
      setShowValidation(true);
      return;
    }

    void createNewGame({ ownerName, ludusName });
  };

  return (
    <ScreenShell titleKey="newGame.title">
      <form className="form-panel" data-testid="new-game-screen" onSubmit={submitNewGame}>
        <label>
          <span>{t('newGame.ownerName')}</span>
          <input
            autoComplete="name"
            data-testid="new-game-owner-name"
            placeholder={t('newGame.ownerNamePlaceholder')}
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
          />
        </label>
        <label>
          <span>{t('newGame.ludusName')}</span>
          <input
            autoComplete="organization"
            data-testid="new-game-ludus-name"
            placeholder={t('newGame.ludusNamePlaceholder')}
            value={ludusName}
            onChange={(event) => setLudusName(event.target.value)}
          />
        </label>
        {showValidation ? <p className="form-error">{t('newGame.validation')}</p> : null}
        <div className="form-actions">
          <ActionButton
            icon={<ArrowLeft aria-hidden="true" size={18} />}
            label={t('common.back')}
            onClick={() => navigate('mainMenu')}
          />
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
    </ScreenShell>
  );
}
