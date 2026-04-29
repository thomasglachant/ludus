import type { CSSProperties } from 'react';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { MenuCardBrandTitle } from '../components/MenuCardFront';
import { ReversibleMenuCard } from '../components/ReversibleMenuCard';
import { GameIcon } from '../icons/GameIcon';
import { LoadGameContent } from '../modals/LoadGameModal';
import { NewGameForm } from './NewGameScreen';

type MainMenuPanel = 'newGame' | 'loadGame' | 'options';

export function MainMenuScreen() {
  const { t } = useUiStore();
  const backgroundPath = VISUAL_ASSET_MANIFEST.homepage.backgrounds.day;
  const mainMenuStyle = {
    '--main-menu-background': `url("${backgroundPath}")`,
  } as CSSProperties;

  return (
    <section className="main-menu-screen" style={mainMenuStyle}>
      <ReversibleMenuCard<MainMenuPanel>
        actions={[
          {
            icon: <GameIcon color="currentColor" name="play" size={20} />,
            key: 'newGame',
            label: t('mainMenu.newGame'),
            panelId: 'newGame',
            primary: true,
            testId: 'main-menu-new-game',
          },
          {
            icon: <GameIcon color="currentColor" name="folderOpen" size={20} />,
            key: 'loadGame',
            label: t('mainMenu.loadGame'),
            panelId: 'loadGame',
            testId: 'main-menu-load-game',
          },
          {
            icon: <GameIcon color="currentColor" name="settings" size={20} />,
            key: 'options',
            label: t('mainMenu.options'),
            panelId: 'options',
          },
        ]}
        panels={{
          newGame: {
            content: <NewGameForm showBackAction={false} />,
            size: 'md',
            title: t('newGame.title'),
          },
          loadGame: {
            content: <LoadGameContent />,
            size: 'lg',
            title: t('loadGame.title'),
          },
          options: {
            content: (
              <div className="settings-panel">
                <LanguageSwitcher />
              </div>
            ),
            size: 'sm',
            title: t('options.title'),
          },
        }}
        title={<MenuCardBrandTitle>{t('app.title')}</MenuCardBrandTitle>}
      />
    </section>
  );
}
