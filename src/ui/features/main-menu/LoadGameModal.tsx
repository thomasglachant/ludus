import './load-game.css';
import { useEffect, useState, type ReactNode } from 'react';
import { featureFlags } from '@/config/features';
import type { GameSaveMetadata } from '@/domain/types';
import { DEMO_SAVE_DEFINITIONS } from '@/game-data/demo-saves';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameEmptyState, GameFieldError, GameNotice } from '@/ui/shared/ludus/GameFeedback';
import { SegmentedControl } from '@/ui/shared/ludus/SegmentedControl';
import { Expandable, ExpandableContent, ExpandableTrigger } from '@/ui/shared/ludus/Expandable';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { AppModal } from '@/ui/app-shell/modals/AppModal';

interface LoadGameModalProps {
  isActive?: boolean;
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
      <ActionBar className="save-card__actions">
        <Button
          disabled={isLoading}
          icon={<GameIcon name="folderOpen" size={18} />}
          data-testid={`${testIdPrefix}-load-button-${saveId}`}
          onClick={() => closeAfterSuccessfulLoad(openSave())}
        >
          <span>{t('common.open')}</span>
        </Button>
        {secondaryAction}
      </ActionBar>
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
          <SegmentedControl<LoadMode>
            ariaLabel={t('loadGame.title')}
            className="load-game-tabs"
            items={[
              {
                label: t('loadGame.normalSaves'),
                testId: 'load-mode-normal',
                value: 'normal',
              },
              {
                label: t('loadGame.demoSaves'),
                testId: 'load-mode-demo',
                value: 'demo',
              },
            ]}
            value={loadMode}
            onValueChange={setLoadMode}
          />
        ) : null}
        {loadMode === 'normal' ? (
          <GameNotice tone="warning">{t('loadGame.cloudNotice')}</GameNotice>
        ) : (
          <GameNotice>{t('loadGame.demoModeNotice')}</GameNotice>
        )}
      </div>
      {errorKey ? <GameFieldError messageKey={errorKey} /> : null}
      {loadMode === 'normal' ? (
        <div className="save-list">
          {localSaves.length === 0 ? (
            <GameEmptyState
              density="compact"
              messageKey="loadGame.empty"
              testId="load-game-empty"
            />
          ) : null}
          {localSaveGroups.map((saveGroup) => {
            const isExpanded = expandedSaveGroupKeys.has(saveGroup.groupKey);

            return (
              <Expandable
                className="local-save-group"
                key={saveGroup.groupKey}
                open={isExpanded}
                onOpenChange={() => toggleExpandedSaveGroup(saveGroup.groupKey)}
              >
                {renderSaveCard(
                  saveGroup.latestSave.saveId,
                  saveGroup.latestSave.ludusName,
                  'local',
                  () => loadLocalSave(saveGroup.latestSave.saveId),
                  'save-card',
                  saveGroup.otherSaves.length > 0 ? (
                    <ExpandableTrigger asChild>
                      <Button
                        data-testid={`local-other-saves-button-${saveGroup.latestSave.saveId}`}
                        variant="ghost"
                      >
                        <span>
                          {isExpanded
                            ? t('loadGame.hideOtherSaves')
                            : t('loadGame.showOtherSaves', { count: saveGroup.otherSaves.length })}
                        </span>
                      </Button>
                    </ExpandableTrigger>
                  ) : null,
                )}
                <ExpandableContent className="local-save-group__other-saves">
                  {saveGroup.otherSaves.map((save) =>
                    renderSaveCard(
                      save.saveId,
                      save.ludusName,
                      'local',
                      () => loadLocalSave(save.saveId),
                      'save-card save-card--secondary',
                    ),
                  )}
                </ExpandableContent>
              </Expandable>
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

export function LoadGameModal({ isActive, onBack, onClose }: LoadGameModalProps) {
  return (
    <AppModal
      isActive={isActive}
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
