import { useState } from 'react';
import { getEffectiveSkillValue } from '../../domain/gladiators/skills';
import { getPlanningRecommendation } from '../../domain/planning/planning-actions';
import type { GameSave, Gladiator } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingAvatar } from '../buildings/BuildingAvatar';
import { EntityList, EntityListRow } from '../components/EntityList';
import { MetricList, SectionCard } from '../components/shared';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import {
  ModalContentFrame,
  ModalHeroCard,
  ModalSection,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '../modals/ModalContentFrame';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface GladiatorDetailPanelProps {
  save: GameSave;
  gladiator: Gladiator;
  onClose(): void;
}

interface StatChipProps {
  iconName: GameIconName;
  label: string;
  value: number | string;
}

type GladiatorDetailTab = 'overview' | 'planning' | 'training';

const gladiatorDetailTabs: ModalTabItem<GladiatorDetailTab>[] = [
  { id: 'overview', labelKey: 'gladiatorPanel.tabs.overview' },
  { id: 'planning', labelKey: 'gladiatorPanel.tabs.planning' },
  { id: 'training', labelKey: 'gladiatorPanel.tabs.training' },
];

function StatChip({ iconName, label, value }: StatChipProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className="gladiator-stat-chip">
      <GameIcon name={iconName} size={19} />
      <span>{label}</span>
      <strong>{formattedValue}</strong>
    </div>
  );
}

function getCurrentArenaRecord(save: GameSave, gladiator: Gladiator) {
  const combatIdPrefix = `combat-${save.time.year}-${save.time.week}-`;
  const combats = save.arena.resolvedCombats.filter(
    (combat) => combat.id.startsWith(combatIdPrefix) && combat.gladiator.id === gladiator.id,
  );

  return {
    losses: combats.filter((combat) => combat.loserId === gladiator.id).length,
    wins: combats.filter((combat) => combat.winnerId === gladiator.id).length,
  };
}

export function GladiatorDetailPanel({ save, gladiator }: GladiatorDetailPanelProps) {
  const { pushModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<GladiatorDetailTab>('overview');
  const recommendation = getPlanningRecommendation(save, gladiator);
  const recommendedBuildingId = recommendation.buildingId;
  const recommendedBuildingName = recommendation.buildingId
    ? t(BUILDING_DEFINITIONS[recommendation.buildingId].nameKey)
    : t('weeklyPlan.noAssignment');
  const currentArenaRecord = getCurrentArenaRecord(save, gladiator);
  const tabItems = gladiator.trainingPlan
    ? gladiatorDetailTabs
    : gladiatorDetailTabs.filter((tab) => tab.id !== 'training');
  const selectedTab = tabItems.some((tab) => tab.id === activeTab) ? activeTab : 'overview';

  return (
    <ModalContentFrame>
      <ModalHeroCard
        avatar={<GladiatorPortrait gladiator={gladiator} size="large" />}
        description={t('gladiatorPanel.detailDescription', { age: gladiator.age })}
        metrics={[
          {
            iconName: 'reputation',
            id: 'reputation',
            labelKey: 'gladiatorPanel.reputation',
            value: gladiator.reputation,
          },
          {
            iconName: 'health',
            id: 'health',
            labelKey: 'roster.healthShort',
            value: gladiator.health,
          },
          {
            iconName: 'energy',
            id: 'energy',
            labelKey: 'roster.energyShort',
            value: gladiator.energy,
          },
          {
            iconName: 'morale',
            id: 'morale',
            labelKey: 'roster.moraleShort',
            value: gladiator.morale,
          },
        ]}
        title={gladiator.name}
      />

      <ModalTabs<GladiatorDetailTab>
        ariaLabelKey="gladiatorPanel.tabsLabel"
        items={tabItems}
        selectedId={selectedTab}
        onSelect={setActiveTab}
      />

      {selectedTab === 'overview' ? (
        <ModalTabPanel>
          <div className="gladiator-info-grid">
            <section className="gladiator-info-panel">
              <h2>
                <GameIcon name="record" size={18} />
                {t('gladiatorPanel.record')}
              </h2>
              <dl>
                <div>
                  <dt>{t('gladiatorPanel.careerRecord')}</dt>
                  <dd>
                    <GameIcon name="victory" size={16} />
                    {t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}
                  </dd>
                </div>
                <div>
                  <dt>{t('gladiatorPanel.todayRecord')}</dt>
                  <dd>
                    <GameIcon name="victory" size={16} />
                    {t('market.record', {
                      wins: currentArenaRecord.wins,
                      losses: currentArenaRecord.losses,
                    })}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="gladiator-info-panel">
              <h2>
                <GameIcon name="combatPressure" size={18} />
                {t('gladiatorPanel.stats')}
              </h2>
              <div className="gladiator-skill-grid">
                <StatChip
                  iconName="strength"
                  label={t('market.stats.strength')}
                  value={gladiator.strength}
                />
                <StatChip
                  iconName="agility"
                  label={t('market.stats.agility')}
                  value={gladiator.agility}
                />
                <StatChip
                  iconName="defense"
                  label={t('market.stats.defense')}
                  value={gladiator.defense}
                />
              </div>
            </section>
          </div>
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'planning' ? (
        <ModalTabPanel>
          {recommendedBuildingId && recommendation.isAvailable ? (
            <ModalSection titleKey="gladiatorPanel.planning">
              <EntityList>
                <EntityListRow
                  avatar={<BuildingAvatar buildingId={recommendedBuildingId} size="small" />}
                  info={[
                    {
                      iconName: 'assignment',
                      id: 'focus',
                      label: t('weeklyPlan.recommendedFocus'),
                      value: t(recommendation.reasonKey),
                    },
                    {
                      iconName: 'workforce',
                      id: 'efficiency',
                      label: t('buildingPanel.efficiency'),
                      value: `${save.buildings[recommendedBuildingId].efficiency}%`,
                    },
                  ]}
                  openLabel={t('map.openLocation', { name: recommendedBuildingName })}
                  subtitle={t(BUILDING_DEFINITIONS[recommendedBuildingId].descriptionKey)}
                  title={recommendedBuildingName}
                  onOpen={() => pushModal({ buildingId: recommendedBuildingId, kind: 'building' })}
                />
              </EntityList>
            </ModalSection>
          ) : (
            <SectionCard titleKey="gladiatorPanel.planning">
              <MetricList
                columns={2}
                items={[
                  {
                    labelKey: 'weeklyPlan.suggestedAssignment',
                    value: recommendation.isAvailable
                      ? recommendedBuildingName
                      : t('weeklyPlan.buildingUnavailable'),
                  },
                  { labelKey: 'weeklyPlan.recommendedFocus', value: t(recommendation.reasonKey) },
                ]}
              />
            </SectionCard>
          )}
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'training' && gladiator.trainingPlan ? (
        <ModalTabPanel>
          <ModalSection titleKey="gladiatorPanel.trainingPlan">
            <div className="gladiator-skill-grid">
              <StatChip
                iconName="strength"
                label={t('market.stats.strength')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.strength)}
              />
              <StatChip
                iconName="agility"
                label={t('market.stats.agility')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.agility)}
              />
              <StatChip
                iconName="defense"
                label={t('market.stats.defense')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.defense)}
              />
            </div>
          </ModalSection>
        </ModalTabPanel>
      ) : null}
    </ModalContentFrame>
  );
}
