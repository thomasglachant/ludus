import '@/ui/shared/components/form-controls.css';
import { useState, type FormEvent } from 'react';
import { generateLudusName } from '@/domain/ludus/name-generator';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { GameFieldError } from '@/ui/shared/ludus/GameFeedback';
import { Button } from '@/ui/shared/ludus/Button';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { Input } from '@/ui/shared/primitives/Input';
import { AppModal } from '@/ui/app-shell/modals/AppModal';

interface NewGameModalProps {
  isActive?: boolean;
  onBack?(): void;
  onClose(): void;
}

export function NewGameModal({ isActive = true, onBack, onClose }: NewGameModalProps) {
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
      isActive={isActive}
      size="md"
      testId="new-game-modal"
      titleKey="newGame.title"
      onBack={onBack}
      onClose={onClose}
      footer={
        <ActionBar>
          <Button onClick={onClose}>
            <span>{t('common.cancel')}</span>
          </Button>
          <PrimaryActionButton
            disabled={isLoading}
            icon={<GameIcon name="landmark" size={18} />}
            data-testid="new-game-submit"
            type="submit"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>('[data-new-game-form="active"]');
              form?.requestSubmit();
            }}
          >
            <span>{isLoading ? t('common.loading') : t('newGame.submit')}</span>
          </PrimaryActionButton>
        </ActionBar>
      }
    >
      <form
        className="form-panel form-panel--modal"
        data-new-game-form={isActive ? 'active' : 'inactive'}
        data-testid="new-game-screen"
        onSubmit={submitNewGame}
      >
        <label>
          <span>{t('newGame.ludusName')}</span>
          <div className="form-field-with-action">
            <Input
              autoComplete="organization"
              data-testid="new-game-ludus-name"
              placeholder={t('newGame.ludusNamePlaceholder')}
              value={ludusName}
              onChange={(event) => updateLudusName(event.target.value)}
            />
            <IconButton
              aria-label={t('newGame.randomLudusName')}
              className="form-field-with-action__button"
              data-testid="new-game-random-ludus-name"
              variant="ghost"
              type="button"
              onClick={() => updateLudusName(generateLudusName(ludusName))}
            >
              <GameIcon name="dice" size={18} />
            </IconButton>
          </div>
        </label>
        {showValidation ? <GameFieldError messageKey="newGame.validation" /> : null}
      </form>
    </AppModal>
  );
}
