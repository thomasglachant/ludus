import { CloudOff, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { featureFlags } from '../../config/features';
import { formatClock } from '../../domain/time/format-time';
import type { GameSave } from '../../domain/types';
import { BUILDING_IDS } from '../../game-data/buildings';
import { DEMO_SAVE_DEFINITIONS } from '../../game-data/demo-saves';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { AppModal } from './AppModal';

interface LoadGameModalProps {
  onBack?(): void;
  onClose(): void;
}

type LoadMode = 'normal' | 'demo';

function getPurchasedBuildingLevelRange(save: GameSave) {
  const levels = BUILDING_IDS.map((buildingId) => save.buildings[buildingId])
    .filter((building) => building.isPurchased)
    .map((building) => building.level);

  return {
    minimum: Math.min(...levels),
    maximum: Math.max(...levels),
  };
}

export function LoadGameModal({ onBack, onClose }: LoadGameModalProps) {
  const {
    demoSaves,
    errorKey,
    isLoading,
    loadDemoSave,
    loadLocalSave,
    localSaves,
    refreshDemoSaves,
    refreshLocalSaves,
  } = useGameStore();
  const { language, t } = useUiStore();
  const [loadMode, setLoadMode] = useState<LoadMode>('normal');
  const availableDemoSaveIds = new Set(demoSaves.map((save) => save.saveId));
  const demoDefinitions = DEMO_SAVE_DEFINITIONS.filter((definition) =>
    availableDemoSaveIds.has(definition.id),
  );

  const closeAfterSuccessfulLoad = (loadPromise: Promise<boolean>) => {
    void loadPromise.then((didLoad) => {
      if (didLoad) {
        onClose();
      }
    });
  };

  useEffect(() => {
    void refreshLocalSaves();
    void refreshDemoSaves();
  }, [refreshDemoSaves, refreshLocalSaves]);

  return (
    <AppModal
      size="lg"
      testId="load-game-modal"
      titleKey="loadGame.title"
      onBack={onBack}
      onClose={onClose}
    >
      <div data-testid="load-game-screen" className="load-game-content">
        {featureFlags.enableDemoMode ? (
          <div className="segmented-control load-game-tabs">
            <button
              className={loadMode === 'normal' ? 'is-selected' : ''}
              data-testid="load-mode-normal"
              type="button"
              onClick={() => setLoadMode('normal')}
            >
              {t('loadGame.normalSaves')}
            </button>
            <button
              className={loadMode === 'demo' ? 'is-selected' : ''}
              data-testid="load-mode-demo"
              type="button"
              onClick={() => setLoadMode('demo')}
            >
              {t('loadGame.demoSaves')}
            </button>
          </div>
        ) : null}
        {loadMode === 'normal' ? (
          <div className="notice-row notice-row--warning">
            <CloudOff aria-hidden="true" size={18} />
            <span>{t('loadGame.cloudNotice')}</span>
          </div>
        ) : (
          <div className="notice-row">
            <CloudOff aria-hidden="true" size={18} />
            <span>{t('loadGame.demoModeNotice')}</span>
          </div>
        )}
      </div>
      {errorKey ? <p className="form-error">{t(errorKey)}</p> : null}
      {loadMode === 'normal' ? (
        <div className="save-list">
          {localSaves.length === 0 ? (
            <p className="empty-state" data-testid="load-game-empty">
              {t('loadGame.empty')}
            </p>
          ) : null}
          {localSaves.map((save) => (
            <article
              className="save-card"
              data-testid={`local-save-card-${save.saveId}`}
              key={save.saveId}
            >
              <div>
                <h2>{save.ludusName}</h2>
                <p>{t('loadGame.ownerLine', { owner: save.ownerName })}</p>
                <p>{new Date(save.updatedAt).toLocaleString(language)}</p>
              </div>
              <ActionButton
                disabled={isLoading}
                icon={<FolderOpen aria-hidden="true" size={18} />}
                label={t('loadGame.open')}
                testId={`local-load-button-${save.saveId}`}
                onClick={() => closeAfterSuccessfulLoad(loadLocalSave(save.saveId))}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="save-list">
          {demoDefinitions.map((definition) => {
            const levelRange = getPurchasedBuildingLevelRange(definition.save);
            const levelText =
              levelRange.minimum === levelRange.maximum
                ? t('loadGame.demoBuildingLevel', { level: levelRange.minimum })
                : t('loadGame.demoBuildingLevelRange', {
                    minimum: levelRange.minimum,
                    maximum: levelRange.maximum,
                  });

            return (
              <article
                className="save-card save-card--demo"
                data-testid={`demo-save-card-${definition.id}`}
                key={definition.id}
              >
                <div>
                  <p className="eyebrow">{t(definition.stageKey)}</p>
                  <h2>{t(definition.nameKey)}</h2>
                  <p>
                    {t('loadGame.demoTimeLine', {
                      day: t(`days.${definition.save.time.dayOfWeek}`),
                      week: definition.save.time.week,
                      year: definition.save.time.year,
                      time: formatClock(definition.save.time),
                    })}
                  </p>
                  <p>
                    {t('loadGame.demoRosterLine', {
                      buildings: levelText,
                      count: definition.save.gladiators.length,
                    })}
                  </p>
                  <p>{t(definition.descriptionKey)}</p>
                  <ul className="tag-list">
                    {definition.tags.map((tagKey) => (
                      <li key={tagKey}>{t(tagKey)}</li>
                    ))}
                  </ul>
                </div>
                <ActionButton
                  disabled={isLoading}
                  icon={<FolderOpen aria-hidden="true" size={18} />}
                  label={t('loadGame.loadDemoSave')}
                  testId={`demo-load-button-${definition.id}`}
                  onClick={() => closeAfterSuccessfulLoad(loadDemoSave(definition.id))}
                />
              </article>
            );
          })}
        </div>
      )}
    </AppModal>
  );
}
