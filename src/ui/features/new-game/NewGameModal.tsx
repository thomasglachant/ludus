import { useState, type FormEvent } from 'react';
import { generateLudusName } from '@/domain/ludus/name-generator';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { ModalForm, ModalFormTextField } from '@/ui/app-shell/modals/ModalForm';

interface NewGameModalProps {
  isActive?: boolean;
  onBack?(): void;
  onClose(): void;
}

const NON_BLANK_TEXT_PATTERN = '.*\\S.*';

export function NewGameModal({ isActive = true, onBack, onClose }: NewGameModalProps) {
  const { createNewGame, isLoading } = useGameStore();
  const { t } = useUiStore();
  const formId = 'new-game-modal-form';
  const [ludusName, setLudusName] = useState(() => generateLudusName(''));

  const submitNewGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void createNewGame({ ludusName: ludusName.trim() });
  };

  return (
    <ModalForm
      formId={formId}
      isActive={isActive}
      isSubmitting={isLoading}
      size="md"
      submitLabel={t(isLoading ? 'common.loading' : 'newGame.submit')}
      submitTestId="new-game-submit"
      testId="new-game-modal"
      titleKey="newGame.title"
      onBack={onBack}
      onClose={onClose}
      onSubmit={submitNewGame}
    >
      <ModalFormTextField
        actionLabel={t('newGame.randomLudusName')}
        actionTestId="new-game-random-ludus-name"
        autoComplete="organization"
        label={t('newGame.ludusName')}
        messages={[
          {
            content: t('newGame.validation'),
            match: 'valueMissing',
          },
          {
            content: t('newGame.validation'),
            match: 'patternMismatch',
          },
        ]}
        name="ludusName"
        pattern={NON_BLANK_TEXT_PATTERN}
        placeholder={t('newGame.ludusNamePlaceholder')}
        required
        testId="new-game-ludus-name"
        value={ludusName}
        onAction={() => setLudusName(generateLudusName(ludusName))}
        onValueChange={setLudusName}
      />
    </ModalForm>
  );
}
