import './gladiators.css';
import { useState } from 'react';
import type { GladiatorSkillName } from '@/domain/gladiators/skills';
import { getAvailableSkillPoints, getGladiatorLevel } from '@/domain/gladiators/progression';
import type { GameSave, Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { GladiatorAttributes } from '@/ui/features/gladiators/GladiatorAttributes';
import { GladiatorExperienceBar } from '@/ui/features/gladiators/GladiatorExperienceBar';
import { GladiatorSkillBars } from '@/ui/features/gladiators/GladiatorSkillBars';
import { GladiatorTraits } from '@/ui/features/gladiators/GladiatorTraits';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { GameSection, GameStats } from '@/ui/shared/ludus/GameSection';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import {
  ModalContentFrame,
  ModalHeroCard,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '@/ui/app-shell/modals/ModalContentFrame';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';

interface GladiatorDetailPanelProps {
  save: GameSave;
  gladiator: Gladiator;
  onAllocateSkillPoint(gladiatorId: string, skill: GladiatorSkillName): void;
  onClose(): void;
  onOpenPlanning?(): void;
}

type GladiatorDetailTab = 'overview' | 'planning';

const gladiatorDetailTabs: ModalTabItem<GladiatorDetailTab>[] = [
  { id: 'overview', labelKey: 'gladiatorPanel.tabs.overview' },
  { id: 'planning', labelKey: 'gladiatorPanel.tabs.planning' },
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

export function GladiatorDetailPanel({
  gladiator,
  onAllocateSkillPoint,
  onOpenPlanning,
  save,
}: GladiatorDetailPanelProps) {
  const { pushModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<GladiatorDetailTab>('overview');
  const currentArenaRecord = getCurrentArenaRecord(save, gladiator);
  const tabItems = gladiatorDetailTabs;
  const selectedTab = tabItems.some((tab) => tab.id === activeTab) ? activeTab : 'overview';
  const availableSkillPoints = getAvailableSkillPoints(gladiator);

  return (
    <ModalContentFrame>
      <ModalHeroCard
        avatar={<GladiatorPortrait gladiator={gladiator} size="large" />}
        description={<span>{t('market.age', { age: gladiator.age })}</span>}
        descriptionContent={<GladiatorAttributes gladiator={gladiator} />}
        headingContent={<GladiatorTraits gladiator={gladiator} save={save} />}
        level={getGladiatorLevel(gladiator)}
        levelLabelKey="gladiatorPanel.level"
        title={gladiator.name}
      />

      <ModalTabs<GladiatorDetailTab>
        ariaLabelKey="gladiatorPanel.tabsLabel"
        items={tabItems}
        selectedId={selectedTab}
        onSelect={setActiveTab}
      >
        <ModalTabPanel tabId="overview">
          <div className="gladiator-info-grid">
            <section className="gladiator-info-panel gladiator-info-panel--progression">
              <h2>
                <GameIcon name="experience" size={18} />
                {t('gladiatorPanel.progression')}
              </h2>
              <GladiatorSkillBars
                gladiator={gladiator}
                mode="allocation"
                onAllocateSkillPoint={(skill) => onAllocateSkillPoint(gladiator.id, skill)}
              />
              <GladiatorExperienceBar gladiator={gladiator} />
              <p className="gladiator-info-panel__note">
                {availableSkillPoints > 0
                  ? t('gladiatorPanel.skillPointsAvailable', { count: availableSkillPoints })
                  : t('gladiatorPanel.noSkillPointsAvailable')}
              </p>
            </section>
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

        <ModalTabPanel tabId="planning">
          <GameSection titleKey="gladiatorPanel.planning">
            <GameStats
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
            <ActionBar>
              <Button
                type="button"
                onClick={() => {
                  if (onOpenPlanning) {
                    onOpenPlanning();
                    return;
                  }

                  pushModal({ kind: 'weeklyPlanning' });
                }}
              >
                <GameIcon name="weeklyPlanning" size={17} />
                <span>{t('navigation.weeklyPlanning')}</span>
              </Button>
            </ActionBar>
          </GameSection>
        </ModalTabPanel>
      </ModalTabs>
    </ModalContentFrame>
  );
}
