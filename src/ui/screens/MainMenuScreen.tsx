import { FolderOpen, Play, Settings } from 'lucide-react';
import type { CSSProperties } from 'react';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';

export function MainMenuScreen() {
  const { openModal, t } = useUiStore();
  const backgroundPath = VISUAL_ASSET_MANIFEST.homepage.backgrounds.day;
  const mainMenuStyle = {
    '--main-menu-background': `url("${backgroundPath}")`,
  } as CSSProperties;

  const openLoadGame = () => {
    openModal({ kind: 'loadGame' });
  };

  return (
    <section className="main-menu-screen" style={mainMenuStyle}>
      <div className="main-menu-screen__content">
        <div className="main-menu-screen__brand">
          <div className="main-menu-screen__title-row">
            <img src={VISUAL_ASSET_MANIFEST.ui['laurel-left']} alt="" aria-hidden="true" />
            <h1>{t('app.title')}</h1>
            <img src={VISUAL_ASSET_MANIFEST.ui['laurel-right']} alt="" aria-hidden="true" />
          </div>
        </div>

        <nav className="main-menu-screen__buttons" aria-label={t('navigation.title')}>
          <button
            className="main-menu-screen__button--primary"
            data-testid="main-menu-new-game"
            type="button"
            onClick={() => openModal({ kind: 'newGame' })}
          >
            <Play aria-hidden="true" size={20} />
            <span>{t('mainMenu.newGame')}</span>
          </button>
          <button data-testid="main-menu-load-game" type="button" onClick={openLoadGame}>
            <FolderOpen aria-hidden="true" size={20} />
            <span>{t('mainMenu.loadGame')}</span>
          </button>
          <button type="button" onClick={() => openModal({ kind: 'options' })}>
            <Settings aria-hidden="true" size={20} />
            <span>{t('mainMenu.options')}</span>
          </button>
        </nav>
      </div>
    </section>
  );
}
