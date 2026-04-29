import { featureFlags } from '../config/features';
import { demoEarlyLudus } from '../game-data/demo-saves/demo-early-ludus';
import type { PixiSceneContext } from '../renderer/pixi/PixiScene';
import { PixiSceneViewport } from '../renderer/pixi/PixiSceneViewport';
import { LudusMapScene } from '../renderer/scenes/ludus-map/LudusMapScene';
import { createLudusMapSceneViewModel } from '../renderer/scenes/ludus-map/createLudusMapSceneViewModel';
import { useUiStore } from '../state/ui-store-context';
import { ActionButton } from '../ui/components/ActionButton';
import { GameIcon } from '../ui/icons/GameIcon';
import { ScreenShell } from '../ui/layout/ScreenShell';

function createDebugMapScene(context: PixiSceneContext) {
  return new LudusMapScene(context);
}

export function DevDebugDashboardRoute() {
  const { navigate, t } = useUiStore();
  const pixiMapViewModel = createLudusMapSceneViewModel(demoEarlyLudus.save);

  return (
    <ScreenShell titleKey="debugDashboard.title">
      <p
        className={featureFlags.enableDebugUi ? 'empty-state' : 'form-error'}
        data-testid={featureFlags.enableDebugUi ? 'debug-dashboard' : 'debug-dashboard-unavailable'}
      >
        {t(featureFlags.enableDebugUi ? 'debugDashboard.enabled' : 'debugDashboard.unavailable')}
      </p>
      {featureFlags.enableDebugUi ? (
        <section aria-label={t('debugDashboard.pixiSceneLabel')}>
          <p className="empty-state">{t('debugDashboard.pixiSceneReady')}</p>
          <div style={{ border: '1px solid rgba(214, 165, 87, 0.5)', height: 360 }}>
            <PixiSceneViewport
              createScene={createDebugMapScene}
              debugMode={featureFlags.enableDebugUi}
              sceneLabel={t('debugDashboard.pixiSceneLabel')}
              snapshot={pixiMapViewModel}
            />
          </div>
        </section>
      ) : null}
      <div className="form-actions">
        <ActionButton
          icon={<GameIcon name="back" size={18} />}
          label={t('common.back')}
          onClick={() => {
            window.history.replaceState(null, '', '/');
            navigate('mainMenu');
          }}
        />
      </div>
    </ScreenShell>
  );
}
