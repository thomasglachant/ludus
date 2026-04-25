import { FolderOpen, Play, Settings } from 'lucide-react';
import { featureFlags } from '../../config/features';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';

export function MainMenuScreen() {
  const { refreshLocalSaves } = useGameStore();
  const { navigate, t } = useUiStore();

  const openLoadGame = () => {
    void refreshLocalSaves();
    navigate('loadGame');
  };

  return (
    <section className="main-menu-screen">
      <div className="main-menu-screen__art" aria-hidden="true" />
      <div className="main-menu-screen__content">
        <div className="main-menu-screen__brand">
          <p className="eyebrow">{t('app.subtitle')}</p>
          <h1>{t('app.title')}</h1>
          {featureFlags.enableDemoMode ? (
            <span className="main-menu-screen__demo">{t('mainMenu.demoMode')}</span>
          ) : null}
        </div>
        <div className="main-menu-screen__buttons">
          <button type="button" onClick={() => navigate('newGame')}>
            <Play aria-hidden="true" size={20} />
            <span>{t('mainMenu.newGame')}</span>
          </button>
          <button data-testid="main-menu-load-game" type="button" onClick={openLoadGame}>
            <FolderOpen aria-hidden="true" size={20} />
            <span>{t('mainMenu.loadGame')}</span>
          </button>
          <button type="button" onClick={() => navigate('options')}>
            <Settings aria-hidden="true" size={20} />
            <span>{t('mainMenu.options')}</span>
          </button>
        </div>
        <p className="main-menu-screen__status">{t('mainMenu.loginStatus')}</p>
      </div>
    </section>
  );
}
