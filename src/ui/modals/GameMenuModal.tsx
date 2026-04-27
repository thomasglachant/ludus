import { Copy, FolderOpen, LogOut, Save, Settings } from 'lucide-react';
import { useState } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppModal } from './AppModal';

interface GameMenuModalProps {
  isSaving: boolean;
  onBack?(): void;
  onClose(): void;
  onOpenLoadGame(): void;
  onQuit(): void;
  onSave(): void;
  onSaveAs(): void;
}

type GameMenuView = 'menu' | 'options';

export function GameMenuModal({
  isSaving,
  onBack,
  onClose,
  onOpenLoadGame,
  onQuit,
  onSave,
  onSaveAs,
}: GameMenuModalProps) {
  const { t } = useUiStore();
  const [view, setView] = useState<GameMenuView>('menu');
  const back = view === 'options' ? () => setView('menu') : onBack;

  return (
    <AppModal
      size="sm"
      testId="game-menu-modal"
      titleKey={view === 'options' ? 'options.title' : 'gameMenu.title'}
      onBack={back}
      onClose={onClose}
    >
      {view === 'menu' ? (
        <div className="game-menu">
          <div className="game-menu__actions">
            <ActionButton
              disabled={isSaving}
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
              onClick={() => setView('options')}
            />
            <ActionButton
              icon={<LogOut aria-hidden="true" size={18} />}
              label={t('gameMenu.quit')}
              variant="ghost"
              onClick={onQuit}
            />
          </div>
        </div>
      ) : (
        <div className="settings-panel settings-panel--menu">
          <LanguageSwitcher />
        </div>
      )}
    </AppModal>
  );
}
