import './main-menu.css';
import { useUiStore } from '@/state/ui-store-context';
import { ScenicScreen } from '@/ui/app-shell/ScenicScreen';
import { Button } from '@/ui/shared/ludus/Button';
import { GameCard } from '@/ui/shared/ludus/GameCard';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';

export function MainMenuScreen() {
  const { openModal, t } = useUiStore();

  return (
    <ScenicScreen className="main-menu-screen">
      <GameCard className="main-menu__panel" aria-label={t('navigation.title')} surface="dark">
        <header className="main-menu__brand">
          <h1>{t('app.title')}</h1>
        </header>
        <nav className="main-menu__actions" aria-label={t('navigation.title')}>
          <PrimaryActionButton
            data-testid="main-menu-new-game"
            iconName="play"
            size="lg"
            onClick={() => openModal({ kind: 'newGame' })}
          >
            <span>{t('mainMenu.newGame')}</span>
          </PrimaryActionButton>
          <Button
            data-testid="main-menu-load-game"
            iconName="folderOpen"
            size="lg"
            onClick={() => openModal({ kind: 'loadGame' })}
          >
            <span>{t('mainMenu.loadGame')}</span>
          </Button>
          <Button iconName="settings" size="lg" onClick={() => openModal({ kind: 'options' })}>
            <span>{t('mainMenu.options')}</span>
          </Button>
        </nav>
      </GameCard>
    </ScenicScreen>
  );
}
