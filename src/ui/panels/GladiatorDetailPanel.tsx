import { useState } from 'react';
import { getEffectiveSkillValue } from '../../domain/gladiators/skills';
import type { GameSave, Gladiator } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { IconValueStat } from '../components/IconValueStat';
import { MetricList, SectionCard } from '../components/shared';
import { GladiatorAttributes } from '../gladiators/GladiatorAttributes';
import { GameIcon } from '../icons/GameIcon';
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

type GladiatorDetailTab = 'overview' | 'planning' | 'training';

const gladiatorDetailTabs: ModalTabItem<GladiatorDetailTab>[] = [
  { id: 'overview', labelKey: 'gladiatorPanel.tabs.overview' },
  { id: 'planning', labelKey: 'gladiatorPanel.tabs.planning' },
  { id: 'training', labelKey: 'gladiatorPanel.tabs.training' },
];

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
  const currentArenaRecord = getCurrentArenaRecord(save, gladiator);
  const tabItems = gladiator.trainingPlan
    ? gladiatorDetailTabs
    : gladiatorDetailTabs.filter((tab) => tab.id !== 'training');
  const selectedTab = tabItems.some((tab) => tab.id === activeTab) ? activeTab : 'overview';

  return (
    <ModalContentFrame>
      <ModalHeroCard
        avatar={<GladiatorPortrait gladiator={gladiator} size="large" />}
        description={
          <span>
            {t('market.age', { age: gladiator.age })} -{' '}
            {gladiator.traits.length > 0 ? <>{t(`traits.${gladiator.traits[0]}`)}</> : null}
          </span>
        }
        descriptionContent={<GladiatorAttributes gladiator={gladiator} />}
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
          </div>
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'planning' ? (
        <ModalTabPanel>
          <SectionCard titleKey="gladiatorPanel.planning">
            <MetricList
              columns={2}
              items={[
                {
                  labelKey: 'weeklyPlan.manualMode',
                  value: t('weeklyPlan.manualModeValue'),
                },
                {
                  labelKey: 'weeklyPlan.currentWeek',
                  value: t('weeklyPlan.weekLabel', {
                    week: save.time.week,
                    year: save.time.year,
                  }),
                },
              ]}
            />
            <button type="button" onClick={() => pushModal({ kind: 'weeklyPlanning' })}>
              <GameIcon name="weeklyPlanning" size={17} />
              <span>{t('navigation.weeklyPlanning')}</span>
            </button>
          </SectionCard>
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'training' && gladiator.trainingPlan ? (
        <ModalTabPanel>
          <ModalSection titleKey="gladiatorPanel.trainingPlan">
            <div className="gladiator-skill-grid">
              <IconValueStat
                iconName="strength"
                label={t('market.stats.strength')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.strength)}
              />
              <IconValueStat
                iconName="agility"
                label={t('market.stats.agility')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.agility)}
              />
              <IconValueStat
                iconName="defense"
                label={t('market.stats.defense')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.defense)}
              />
              <IconValueStat
                iconName="health"
                label={t('market.stats.life')}
                value={getEffectiveSkillValue(gladiator.trainingPlan.life)}
              />
            </div>
          </ModalSection>
        </ModalTabPanel>
      ) : null}
    </ModalContentFrame>
  );
}
