import { CloudOff, FolderOpen } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { featureFlags } from '../../config/features';
import type { GameSave, GameSaveMetadata } from '../../domain/types';
import { BUILDING_IDS } from '../../game-data/buildings';
import { DEMO_SAVE_DEFINITIONS } from '../../game-data/demo-saves';
import { getTimeOfDayDefinition } from '../../game-data/time-of-day';
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

interface LocalSaveGroup {
  groupKey: string;
  latestSave: GameSaveMetadata;
  otherSaves: GameSaveMetadata[];
}

function getPurchasedBuildingLevelRange(save: GameSave) {
  const levels = BUILDING_IDS.map((buildingId) => save.buildings[buildingId])
    .filter((building) => building.isPurchased)
    .map((building) => building.level);

  return {
    minimum: Math.min(...levels),
    maximum: Math.max(...levels),
  };
}

function getSaveTimeValue(save: GameSaveMetadata) {
  return new Date(save.updatedAt).getTime();
}

function getLocalSaveGroupKey(save: GameSaveMetadata) {
  return [save.ludusName, save.ownerName]
    .map((value) => value.trim().toLocaleLowerCase())
    .join('\u0000');
}

function groupLocalSavesByLudusAndOwner(localSaves: GameSaveMetadata[]): LocalSaveGroup[] {
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
  const { language, t } = useUiStore();
  const [loadMode, setLoadMode] = useState<LoadMode>('normal');
  const [expandedSaveGroupKeys, setExpandedSaveGroupKeys] = useState<Set<string>>(new Set());
  const availableDemoSaveIds = new Set(demoSaves.map((save) => save.saveId));
  const demoDefinitions = DEMO_SAVE_DEFINITIONS.filter((definition) =>
    availableDemoSaveIds.has(definition.id),
  );
  const localSaveGroups = groupLocalSavesByLudusAndOwner(localSaves);

  const formatSaveDate = (updatedAt: string) => {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  };

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

  const renderLocalSaveCard = (
    save: GameSaveMetadata,
    className = 'save-card',
    secondaryAction?: ReactNode,
  ) => (
    <article className={className} data-testid={`local-save-card-${save.saveId}`} key={save.saveId}>
      <div>
        <h2>{save.ludusName}</h2>
        <p>{t('loadGame.ownerLine', { owner: save.ownerName })}</p>
        <p className="save-card__date">
          <time dateTime={save.updatedAt}>{formatSaveDate(save.updatedAt)}</time>
        </p>
      </div>
      <div className="save-card__actions">
        <ActionButton
          disabled={isLoading}
          icon={<FolderOpen aria-hidden="true" size={18} />}
          label={t('common.open')}
          testId={`local-load-button-${save.saveId}`}
          onClick={() => closeAfterSuccessfulLoad(loadLocalSave(save.saveId))}
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
                {renderLocalSaveCard(
                  saveGroup.latestSave,
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
                      renderLocalSaveCard(save, 'save-card save-card--secondary'),
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
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
                      phase: t(
                        `timeOfDay.${getTimeOfDayDefinition(definition.save.time.hour).phase}`,
                      ),
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
