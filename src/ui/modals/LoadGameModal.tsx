import { CloudOff, FolderOpen } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { featureFlags } from '../../config/features';
import type { GameSaveMetadata } from '../../domain/types';
import { DEMO_SAVE_DEFINITIONS } from '../../game-data/demo-saves';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { AppModal } from './AppModal';

interface LoadGameModalProps {
  onBack?(): void;
  onClose(): void;
}

interface LoadGameContentProps {
  onLoaded?(): void;
}

type LoadMode = 'normal' | 'demo';
interface SaveCardOpenAction {
  (): Promise<boolean>;
}

interface LocalSaveGroup {
  groupKey: string;
  latestSave: GameSaveMetadata;
  otherSaves: GameSaveMetadata[];
}

function getSaveTimeValue(save: GameSaveMetadata) {
  return new Date(save.updatedAt).getTime();
}

function getLocalSaveGroupKey(save: GameSaveMetadata) {
  return save.gameId;
}

function groupLocalSavesByGame(localSaves: GameSaveMetadata[]): LocalSaveGroup[] {
  const groupedSaves = new Map<string, GameSaveMetadata[]>();

  localSaves.forEach((save) => {
    const key = getLocalSaveGroupKey(save);
    groupedSaves.set(key, [...(groupedSaves.get(key) ?? []), save]);
  });

  return Array.from(groupedSaves.entries())
    .map(([groupKey, groupSaves]) => {
      const sortedSaves = [...groupSaves].sort((firstSave, secondSave) => {
        return getSaveTimeValue(secondSave) - getSaveTimeValue(firstSave);
      });

      return {
        groupKey,
        latestSave: sortedSaves[0],
        otherSaves: sortedSaves.slice(1),
      };
    })
    .sort((firstGroup, secondGroup) => {
      return getSaveTimeValue(secondGroup.latestSave) - getSaveTimeValue(firstGroup.latestSave);
    });
}

export function LoadGameContent({ onLoaded }: LoadGameContentProps) {
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
  const { t } = useUiStore();
  const [loadMode, setLoadMode] = useState<LoadMode>('normal');
  const [expandedSaveGroupKeys, setExpandedSaveGroupKeys] = useState<Set<string>>(new Set());
  const availableDemoSaveIds = new Set(demoSaves.map((save) => save.saveId));
  const demoDefinitions = DEMO_SAVE_DEFINITIONS.filter((definition) =>
    availableDemoSaveIds.has(definition.id),
  );
  const localSaveGroups = groupLocalSavesByGame(localSaves);

  const toggleExpandedSaveGroup = (groupKey: string) => {
    setExpandedSaveGroupKeys((currentGroupKeys) => {
      const nextGroupKeys = new Set(currentGroupKeys);

      if (nextGroupKeys.has(groupKey)) {
        nextGroupKeys.delete(groupKey);
      } else {
        nextGroupKeys.add(groupKey);
      }

      return nextGroupKeys;
    });
  };

  const renderSaveCard = (
    saveId: GameSaveMetadata['saveId'],
    displayName: string,
    testIdPrefix: 'local' | 'demo',
    openSave: SaveCardOpenAction,
    className = 'save-card',
    secondaryAction?: ReactNode,
  ) => (
    <article className={className} data-testid={`${testIdPrefix}-save-card-${saveId}`} key={saveId}>
      <div>
        <h2>{displayName}</h2>
      </div>
      <div className="save-card__actions">
        <ActionButton
          disabled={isLoading}
          icon={<FolderOpen aria-hidden="true" size={18} />}
          label={t('common.open')}
          testId={`${testIdPrefix}-load-button-${saveId}`}
          onClick={() => closeAfterSuccessfulLoad(openSave())}
        />
        {secondaryAction}
      </div>
    </article>
  );

  const closeAfterSuccessfulLoad = (loadPromise: Promise<boolean>) => {
    void loadPromise.then((didLoad) => {
      if (didLoad) {
        onLoaded?.();
      }
    });
  };

  useEffect(() => {
    void refreshLocalSaves();
    void refreshDemoSaves();
  }, [refreshDemoSaves, refreshLocalSaves]);

  return (
    <>
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
          {localSaveGroups.map((saveGroup) => {
            const isExpanded = expandedSaveGroupKeys.has(saveGroup.groupKey);

            return (
              <section className="local-save-group" key={saveGroup.groupKey}>
                {renderSaveCard(
                  saveGroup.latestSave.saveId,
                  saveGroup.latestSave.ludusName,
                  'local',
                  () => loadLocalSave(saveGroup.latestSave.saveId),
                  'save-card',
                  saveGroup.otherSaves.length > 0 ? (
                    <ActionButton
                      label={
                        isExpanded
                          ? t('loadGame.hideOtherSaves')
                          : t('loadGame.showOtherSaves', { count: saveGroup.otherSaves.length })
                      }
                      testId={`local-other-saves-button-${saveGroup.latestSave.saveId}`}
                      variant="ghost"
                      onClick={() => toggleExpandedSaveGroup(saveGroup.groupKey)}
                    />
                  ) : null,
                )}
                {isExpanded ? (
                  <div className="local-save-group__other-saves">
                    {saveGroup.otherSaves.map((save) =>
                      renderSaveCard(
                        save.saveId,
                        save.ludusName,
                        'local',
                        () => loadLocalSave(save.saveId),
                        'save-card save-card--secondary',
                      ),
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="save-list">
          {demoDefinitions.map((definition) =>
            renderSaveCard(definition.id, t(definition.nameKey), 'demo', () =>
              loadDemoSave(definition.id),
            ),
          )}
        </div>
      )}
    </>
  );
}

export function LoadGameModal({ onBack, onClose }: LoadGameModalProps) {
  return (
    <AppModal
      size="lg"
      testId="load-game-modal"
      titleKey="loadGame.title"
      onBack={onBack}
      onClose={onClose}
    >
      <LoadGameContent onLoaded={onClose} />
    </AppModal>
  );
}
