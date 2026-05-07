import './game-menu.css';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { AppModal } from '@/ui/app-shell/modals/AppModal';

interface GameMenuModalProps {
  isActive?: boolean;
  isSaving: boolean;
  onClose(): void;
  onOpenLoadGame(): void;
  onOpenOptions(): void;
  onRequestQuit(): void;
  onSave(): void;
}

export function GameMenuModal({
  isActive = true,
  isSaving,
  onClose,
  onOpenLoadGame,
  onOpenOptions,
  onRequestQuit,
  onSave,
}: GameMenuModalProps) {
  const { t } = useUiStore();

  return (
    <AppModal
      isActive={isActive}
      size="sm"
      testId="game-menu-modal"
      titleKey="gameMenu.title"
      onClose={onClose}
    >
      <nav className="game-menu-actions" aria-label={t('gameMenu.title')}>
        <PrimaryActionButton iconName="save" loading={isSaving} size="lg" onClick={onSave}>
          <span>{t(isSaving ? 'ludus.saving' : 'gameMenu.save')}</span>
        </PrimaryActionButton>
        <Button
          data-testid="main-menu-load-game"
          iconName="folderOpen"
          size="lg"
          onClick={onOpenLoadGame}
        >
          <span>{t('mainMenu.loadGame')}</span>
        </Button>
        <Button iconName="settings" size="lg" onClick={onOpenOptions}>
          <span>{t('mainMenu.options')}</span>
        </Button>
        <ActionBar align="center" className="game-menu-actions__danger">
          <Button iconName="logout" variant="danger" onClick={onRequestQuit}>
            <span>{t('gameMenu.quit')}</span>
          </Button>
        </ActionBar>
      </nav>
    </AppModal>
  );
}
