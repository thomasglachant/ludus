import { Copy, FolderOpen, LogOut, Save, Settings } from 'lucide-react';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { AppModal } from './AppModal';

interface GameMenuModalProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isDemoSave: boolean;
  onClose(): void;
  onOpenLoadGame(): void;
  onOpenOptions(): void;
  onQuit(): void;
  onSave(): void;
  onSaveAs(): void;
}

export function GameMenuModal({
  hasUnsavedChanges,
  isDemoSave,
  isSaving,
  onClose,
  onOpenLoadGame,
  onOpenOptions,
  onQuit,
  onSave,
  onSaveAs,
}: GameMenuModalProps) {
  const { t } = useUiStore();
  const statusKey = isDemoSave
    ? 'gameMenu.demoSaveNotice'
    : hasUnsavedChanges
      ? 'gameMenu.unsavedNotice'
      : 'gameMenu.savedNotice';

  return (
    <AppModal testId="game-menu-modal" titleKey="gameMenu.title" onClose={onClose}>
      <div className="game-menu">
        <p className="notice-box">{t(statusKey)}</p>
        <div className="game-menu__actions">
          <ActionButton
            disabled={isSaving || isDemoSave}
            icon={<Save aria-hidden="true" size={18} />}
            label={t(isSaving ? 'ludus.saving' : 'common.save')}
            variant="primary"
            onClick={onSave}
          />
          <ActionButton
            disabled={isSaving}
            icon={<Copy aria-hidden="true" size={18} />}
            label={t('gameMenu.saveAs')}
            onClick={onSaveAs}
          />
          <ActionButton
            icon={<FolderOpen aria-hidden="true" size={18} />}
            label={t('mainMenu.loadGame')}
            testId="main-menu-load-game"
            onClick={onOpenLoadGame}
          />
          <ActionButton
            icon={<Settings aria-hidden="true" size={18} />}
            label={t('mainMenu.options')}
            onClick={onOpenOptions}
          />
          <ActionButton
            icon={<LogOut aria-hidden="true" size={18} />}
            label={t('gameMenu.quit')}
            variant="ghost"
            onClick={onQuit}
          />
        </div>
      </div>
    </AppModal>
  );
}
