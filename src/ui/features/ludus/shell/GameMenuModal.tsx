import './game-menu.css';
import '@/ui/shared/components/form-controls.css';
import { useId, useRef } from 'react';
import { useUiStore } from '@/state/ui-store-context';
import { LanguageSwitcher } from '@/ui/shared/components/LanguageSwitcher';
import { MenuCard, MenuCardBrandTitle } from '@/ui/shared/components/MenuCard';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { LoadGameContent } from '@/ui/features/main-menu/LoadGameModal';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/ui/shared/primitives/Dialog';

interface GameMenuModalProps {
  hasUnsavedChanges: boolean;
  isActive?: boolean;
  isSaving: boolean;
  onBack?(): void;
  onClose(): void;
  onQuit(): void;
  onSave(): void;
}

type GameMenuPanel = 'loadGame' | 'options' | 'quit';

export function GameMenuModal({
  hasUnsavedChanges,
  isActive = true,
  isSaving,
  onBack,
  onClose,
  onQuit,
  onSave,
}: GameMenuModalProps) {
  const { t } = useUiStore();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Dialog
      open={isActive}
      onOpenChange={(isOpen) => {
        if (!isOpen && isActive) {
          onClose();
        }
      }}
    >
      <DialogPortal forceMount>
        <DialogOverlay
          aria-hidden={isActive ? undefined : true}
          className={[
            'app-modal-backdrop',
            'game-menu-modal-backdrop',
            isActive ? null : 'app-modal-backdrop--inactive',
          ]
            .filter(Boolean)
            .join(' ')}
          data-testid="game-menu-modal"
          forceMount
        >
          <DialogContent
            aria-labelledby={titleId}
            className="game-menu-dialog"
            forceMount
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              closeButtonRef.current?.focus();
            }}
          >
            <MenuCard<GameMenuPanel>
              ariaLabel={t('gameMenu.title')}
              actions={[
                {
                  disabled: isSaving,
                  icon: <GameIcon color="currentColor" name="save" size={18} />,
                  key: 'save',
                  label: t(isSaving ? 'ludus.saving' : 'gameMenu.save'),
                  onClick: onSave,
                  primary: true,
                },
                {
                  icon: <GameIcon color="currentColor" name="folderOpen" size={18} />,
                  key: 'loadGame',
                  label: t('mainMenu.loadGame'),
                  panelId: 'loadGame',
                  testId: 'main-menu-load-game',
                },
                {
                  icon: <GameIcon color="currentColor" name="settings" size={18} />,
                  key: 'options',
                  label: t('mainMenu.options'),
                  panelId: 'options',
                },
                {
                  icon: <GameIcon color="currentColor" name="logout" size={18} />,
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
                  title: t('loadGame.title'),
                },
                options: {
                  content: (
                    <div className="settings-panel settings-panel--menu">
                      <LanguageSwitcher />
                    </div>
                  ),
                  title: t('options.title'),
                },
                quit: {
                  content: ({ closePanel }) => (
                    <div className="game-menu-card__confirm">
                      <p>
                        {t(
                          hasUnsavedChanges
                            ? 'gameMenu.quitUnsavedMessage'
                            : 'gameMenu.quitMessage',
                        )}
                      </p>
                      <ActionBar className="game-menu-card__confirm-actions">
                        <Button onClick={closePanel}>
                          <span>{t('common.cancel')}</span>
                        </Button>
                        <Button
                          icon={<GameIcon color="currentColor" name="logout" size={18} />}
                          variant="danger"
                          onClick={onQuit}
                        >
                          <span>{t('gameMenu.quit')}</span>
                        </Button>
                      </ActionBar>
                    </div>
                  ),
                  title: t('gameMenu.quitPrompt'),
                },
              }}
              title={
                <DialogTitle asChild>
                  <MenuCardBrandTitle id={titleId}>{t('app.title')}</MenuCardBrandTitle>
                </DialogTitle>
              }
              onBack={onBack}
              onClose={onClose}
            />
          </DialogContent>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}
