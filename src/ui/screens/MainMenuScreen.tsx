import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { MenuCard, MenuCardBrandTitle } from '../components/MenuCard';
import { GameIcon } from '../icons/GameIcon';
import { ScenicScreen } from '../layout/ScenicScreen';
import { LoadGameContent } from '../modals/LoadGameModal';
import { NewGameForm } from './NewGameScreen';

type MainMenuPanel = 'newGame' | 'loadGame' | 'options';

export function MainMenuScreen() {
  const { t } = useUiStore();
  const backgroundPath = VISUAL_ASSET_MANIFEST.homepage.backgrounds.day;

  return (
    <ScenicScreen backgroundPath={backgroundPath} className="main-menu-screen">
      <MenuCard<MainMenuPanel>
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
            title: t('newGame.title'),
          },
          loadGame: {
            content: <LoadGameContent />,
            title: t('loadGame.title'),
          },
          options: {
            content: (
              <div className="settings-panel">
                <LanguageSwitcher />
              </div>
            ),
            title: t('options.title'),
          },
        }}
        title={<MenuCardBrandTitle>{t('app.title')}</MenuCardBrandTitle>}
      />
    </ScenicScreen>
  );
}
