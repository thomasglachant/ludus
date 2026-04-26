import { Flame, FolderOpen, Play, Settings } from 'lucide-react';
import { useEffect, type CSSProperties } from 'react';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';

export function MainMenuScreen() {
  const { language, openModal, t } = useUiStore();
  const { isLoading, loadLocalSave, localSaves, refreshLocalSaves } = useGameStore();
  const latestSave = localSaves[0];
  const backgroundPath =
    VISUAL_ASSET_MANIFEST.homepage.backgrounds.day ??
    '/assets/pixel-art/homepage/homepage-background-day.svg';
  const mainMenuStyle = {
    '--main-menu-background': `url("${backgroundPath}")`,
  } as CSSProperties;

  const openLoadGame = () => {
    openModal({ kind: 'loadGame' });
  };

  const continueLatestSave = () => {
    if (!latestSave) {
      return;
    }

    void loadLocalSave(latestSave.saveId);
  };

  useEffect(() => {
    void refreshLocalSaves();
  }, [refreshLocalSaves]);

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

        <aside className="main-menu-screen__tip">
          <Flame aria-hidden="true" size={28} />
          <div>
            <strong>{t('mainMenu.lanistaTipTitle')}</strong>
            <p>{t('mainMenu.lanistaTipBody')}</p>
          </div>
        </aside>
      </div>

      <aside className="main-menu-screen__last-save" data-testid="main-menu-last-save-card">
        <p className="main-menu-screen__card-title">{t('mainMenu.lastSaveTitle')}</p>
        <div className="main-menu-screen__last-save-body">
          <img
            className="main-menu-screen__last-save-thumbnail"
            src={VISUAL_ASSET_MANIFEST.homepage.lastSaveThumbnail}
            alt=""
            aria-hidden="true"
          />
          {latestSave ? (
            <div className="main-menu-screen__last-save-meta">
              <h2>{latestSave.ludusName}</h2>
              <p>{t('loadGame.ownerLine', { owner: latestSave.ownerName })}</p>
              <p>{new Date(latestSave.updatedAt).toLocaleString(language)}</p>
            </div>
          ) : (
            <p className="main-menu-screen__last-save-empty">
              {isLoading ? t('common.loading') : t('mainMenu.noLastSave')}
            </p>
          )}
        </div>
        {latestSave ? (
          <button
            data-testid="main-menu-continue-save"
            type="button"
            disabled={isLoading}
            onClick={continueLatestSave}
          >
            {t('mainMenu.continueLastSave')}
          </button>
        ) : null}
      </aside>
    </section>
  );
}
