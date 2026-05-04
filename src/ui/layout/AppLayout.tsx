import type { CSSProperties, ReactNode } from 'react';
import { VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { ModalHost } from '../modals/ModalHost';
import type { ScreenName } from '../../app/routes';

function getSceneBackgroundPath(screen: ScreenName) {
  if (screen === 'ludus') {
    return VISUAL_ASSET_MANIFEST.ludus.background;
  }

  if (screen === 'arena') {
    return VISUAL_ASSET_MANIFEST.locations.arena.combatBackground;
  }

  return VISUAL_ASSET_MANIFEST.homepage.backgrounds.day;
}

function getAppLayoutStyle(screen: ScreenName): CSSProperties {
  const sceneBackgroundPath = getSceneBackgroundPath(screen);

  return {
    '--app-layout-scene-background': `url("${sceneBackgroundPath}")`,
  } as CSSProperties;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { screen } = useUiStore();
  const className = [
    'app-layout',
    screen === 'mainMenu' ? 'app-layout--main-menu' : '',
    screen === 'ludus' || screen === 'arena' ? 'app-layout--game-shell' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={className} style={getAppLayoutStyle(screen)}>
      <span aria-hidden="true" className="app-layout__scene" />
      {children}
      <ModalHost />
    </main>
  );
}
