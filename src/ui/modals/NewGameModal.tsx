import { Dices, Landmark } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { generateLudusName } from '../../domain/ludus/name-generator';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { AppModal } from './AppModal';

interface NewGameModalProps {
  onBack?(): void;
  onClose(): void;
}

export function NewGameModal({ onBack, onClose }: NewGameModalProps) {
  const { createNewGame, isLoading } = useGameStore();
  const { t } = useUiStore();
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

  return (
    <AppModal
      size="md"
      testId="new-game-modal"
      titleKey="newGame.title"
      onBack={onBack}
      onClose={onClose}
      footer={
        <div className="form-actions">
          <ActionButton label={t('common.cancel')} onClick={onClose} />
          <ActionButton
            disabled={isLoading}
            icon={<Landmark aria-hidden="true" size={18} />}
            label={isLoading ? t('common.loading') : t('newGame.submit')}
            testId="new-game-submit"
            type="submit"
            variant="primary"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>('[data-new-game-form="active"]');
              form?.requestSubmit();
            }}
          />
        </div>
      }
    >
      <form
        className="form-panel form-panel--modal"
        data-new-game-form="active"
        data-testid="new-game-screen"
        onSubmit={submitNewGame}
      >
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
      </form>
    </AppModal>
  );
}
