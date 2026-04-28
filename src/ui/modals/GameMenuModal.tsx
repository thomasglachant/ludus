import { Copy, FolderOpen, LogOut, Save, Settings } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ReversibleMenuCard } from '../components/ReversibleMenuCard';
import { LoadGameContent } from './LoadGameModal';

interface GameMenuModalProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onBack?(): void;
  onClose(): void;
  onQuit(): void;
  onSave(): void;
  onSaveAs(): void;
}

type GameMenuPanel = 'loadGame' | 'options' | 'quit';

export function GameMenuModal({
  hasUnsavedChanges,
  isSaving,
  onBack,
  onClose,
  onQuit,
  onSave,
  onSaveAs,
}: GameMenuModalProps) {
  const { t } = useUiStore();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="app-modal-backdrop game-menu-modal-backdrop"
      data-testid="game-menu-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <ReversibleMenuCard<GameMenuPanel>
        ariaLabel={t('gameMenu.title')}
        ariaModal
        actions={[
          {
            disabled: isSaving,
            icon: <Save aria-hidden="true" size={18} />,
            key: 'save',
            label: t(isSaving ? 'ludus.saving' : 'gameMenu.save'),
            onClick: onSave,
            primary: true,
          },
          {
            disabled: isSaving,
            icon: <Copy aria-hidden="true" size={18} />,
            key: 'saveAs',
            label: t('gameMenu.saveAs'),
            onClick: onSaveAs,
          },
          {
            icon: <FolderOpen aria-hidden="true" size={18} />,
            key: 'loadGame',
            label: t('mainMenu.loadGame'),
            panelId: 'loadGame',
            testId: 'main-menu-load-game',
          },
          {
            icon: <Settings aria-hidden="true" size={18} />,
            key: 'options',
            label: t('mainMenu.options'),
            panelId: 'options',
          },
          {
            icon: <LogOut aria-hidden="true" size={18} />,
            key: 'quit',
            label: t('gameMenu.quit'),
            panelId: 'quit',
          },
        ]}
        className="game-menu-card"
        closeButtonRef={closeButtonRef}
        panels={{
          loadGame: {
            content: <LoadGameContent onLoaded={onClose} />,
            size: 'lg',
            title: t('loadGame.title'),
          },
          options: {
            content: (
              <div className="settings-panel settings-panel--menu">
                <LanguageSwitcher />
              </div>
            ),
            size: 'sm',
            title: t('options.title'),
          },
          quit: {
            content: ({ closePanel }) => (
              <div className="game-menu-card__confirm">
                <p>
                  {t(hasUnsavedChanges ? 'gameMenu.quitUnsavedMessage' : 'gameMenu.quitMessage')}
                </p>
                <div className="form-actions game-menu-card__confirm-actions">
                  <ActionButton label={t('common.cancel')} onClick={closePanel} />
                  <ActionButton
                    icon={<LogOut aria-hidden="true" size={18} />}
                    label={t('gameMenu.quit')}
                    variant="primary"
                    onClick={onQuit}
                  />
                </div>
              </div>
            ),
            size: 'sm',
            title: t('gameMenu.quitPrompt'),
          },
        }}
        role="dialog"
        title={<h1 className="game-menu-card__title">{t('gameMenu.title')}</h1>}
        onBack={onBack}
        onClose={onClose}
      />
    </div>
  );
}
