import { Coins, Flame, FolderOpen, Play, Settings, Shield, Trophy, Users } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { featureFlags } from '../../config/features';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { LoadGameModal } from '../modals/LoadGameModal';
import { OptionsModal } from '../modals/OptionsModal';

type MainMenuModal = 'loadGame' | 'options';

export function MainMenuScreen() {
  const { language, navigate, t } = useUiStore();
  const { currentSave, isLoading, loadLocalSave, localSaves, refreshLocalSaves } = useGameStore();
  const [activeModal, setActiveModal] = useState<MainMenuModal | null>(null);
  const latestSave = localSaves[0];
  const backgroundPath =
    VISUAL_ASSET_MANIFEST.homepage.backgrounds.day ??
    '/assets/pixel-art/homepage/homepage-background-day.svg';
  const mainMenuStyle = {
    '--main-menu-background': `url("${backgroundPath}")`,
  } as CSSProperties;

  const openLoadGame = () => {
    setActiveModal('loadGame');
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
      <div className="main-menu-screen__utility-bar">
        <div className="main-menu-screen__resource-capsule">
          {currentSave ? (
            <>
              <span aria-label={`${t('common.treasury')}: ${currentSave.ludus.treasury}`}>
                <Coins aria-hidden="true" size={18} />
                {currentSave.ludus.treasury}
              </span>
              <span aria-label={`${t('ludus.gladiators')}: ${currentSave.gladiators.length}`}>
                <Users aria-hidden="true" size={18} />
                {currentSave.gladiators.length}
              </span>
              <span aria-label={`${t('ludus.reputation')}: ${currentSave.ludus.reputation}`}>
                <Trophy aria-hidden="true" size={18} />
                {currentSave.ludus.reputation}
              </span>
            </>
          ) : (
            <span aria-label={t('mainMenu.resourceDefaultLabel')}>
              <Shield aria-hidden="true" size={18} />
              {t('common.local')}
            </span>
          )}
        </div>
        <button
          className="main-menu-screen__settings-button"
          type="button"
          aria-label={t('mainMenu.openOptions')}
          onClick={() => setActiveModal('options')}
        >
          <Settings aria-hidden="true" size={22} />
        </button>
      </div>

      <div className="main-menu-screen__content">
        <div className="main-menu-screen__brand">
          <div className="main-menu-screen__title-row">
            <img src={VISUAL_ASSET_MANIFEST.ui['laurel-left']} alt="" aria-hidden="true" />
            <h1>{t('app.title')}</h1>
            <img src={VISUAL_ASSET_MANIFEST.ui['laurel-right']} alt="" aria-hidden="true" />
          </div>
          <p>{t('app.subtitle')}</p>
          {featureFlags.enableDemoMode ? (
            <span className="main-menu-screen__demo">
              <Shield aria-hidden="true" size={18} />
              {t('mainMenu.demoMode')}
            </span>
          ) : null}
        </div>

        <nav className="main-menu-screen__buttons" aria-label={t('navigation.title')}>
          <button
            className="main-menu-screen__button--primary"
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

      {activeModal === 'loadGame' ? <LoadGameModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'options' ? <OptionsModal onClose={() => setActiveModal(null)} /> : null}
    </section>
  );
}
