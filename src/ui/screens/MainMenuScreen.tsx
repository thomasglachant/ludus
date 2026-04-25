import { FolderOpen, Play, Settings } from 'lucide-react';
import { useState } from 'react';
import { featureFlags } from '../../config/features';
import { useUiStore } from '../../state/ui-store';
import { LoadGameModal } from '../modals/LoadGameModal';
import { OptionsModal } from '../modals/OptionsModal';

type MainMenuModal = 'loadGame' | 'options';

export function MainMenuScreen() {
  const { navigate, t } = useUiStore();
  const [activeModal, setActiveModal] = useState<MainMenuModal | null>(null);

  const openLoadGame = () => {
    setActiveModal('loadGame');
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
          <button
            data-testid="main-menu-new-game"
            type="button"
            onClick={() => navigate('newGame')}
          >
            <Play aria-hidden="true" size={20} />
            <span>{t('mainMenu.newGame')}</span>
          </button>
          <button data-testid="main-menu-load-game" type="button" onClick={openLoadGame}>
            <FolderOpen aria-hidden="true" size={20} />
            <span>{t('mainMenu.loadGame')}</span>
          </button>
          <button type="button" onClick={() => setActiveModal('options')}>
            <Settings aria-hidden="true" size={20} />
            <span>{t('mainMenu.options')}</span>
          </button>
        </div>
        <p className="main-menu-screen__status">{t('mainMenu.loginStatus')}</p>
      </div>
      {activeModal === 'loadGame' ? <LoadGameModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'options' ? <OptionsModal onClose={() => setActiveModal(null)} /> : null}
    </section>
  );
}
