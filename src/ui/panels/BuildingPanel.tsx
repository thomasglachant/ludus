import { useState } from 'react';
import type { BuildingId, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingAvatar } from '../buildings/BuildingAvatar';
import { CTAButton } from '../components/CTAButton';
import { EntityList } from '../components/EntityList';
import { LedgerEntryList } from '../components/LedgerEntryList';
import {
  Badge,
  CostSummary,
  EffectList,
  MetricList,
  NoticeBox,
  SectionCard,
} from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { getLedgerEntryAmount } from '../formatters/ledger';
import { GameIcon } from '../icons/GameIcon';
import { GladiatorListRow } from '../gladiators/GladiatorListRow';
import { BuildingActionModalContent } from '../modals/BuildingActionModalContent';
import {
  ModalActionDock,
  ModalContentFrame,
  ModalHeroCard,
  ModalSection,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '../modals/ModalContentFrame';
import {
  type BuildingPanelViewModel,
  createBuildingPanelViewModel,
  createLudusCapacityViewModel,
} from '../view-models/building-panel-view-model';

interface BuildingPanelProps {
  save: GameSave;
  activeTab?: BuildingPanelTab;
  buildingId: BuildingId;
  onClose(): void;
  onOpenGladiator?(gladiatorId: string): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
  onPurchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  onPurchaseBuildingSkill(buildingId: BuildingId, skillId: string): void;
  onSelectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  onTabChange?(tab: BuildingPanelTab): void;
  onUpgradeBuilding(buildingId: BuildingId): void;
}

export type BuildingPanelTab = 'configuration' | 'finance' | 'gladiators' | 'overview' | 'upgrades';

type BuildingPanelSkill = BuildingPanelViewModel['skills'][number];
type BuildingSkillState = 'available' | 'locked' | 'purchased';

const BUILDING_LEDGER_ENTRY_LIMIT = 12;

function getBuildingSkillState(skill: BuildingPanelSkill): BuildingSkillState {
  if (skill.isPurchased) {
    return 'purchased';
  }

  return skill.canPurchase ? 'available' : 'locked';
}

function getBuildingSkillStateLabelKey(state: BuildingSkillState) {
  return `buildingPanel.skillState.${state}`;
}

function getBuildingSkillStateBadgeTone(state: BuildingSkillState) {
  if (state === 'purchased') {
    return 'success';
  }

  return state === 'available' ? 'warning' : 'neutral';
}

function groupBuildingSkillsByTier(skills: BuildingPanelViewModel['skills']) {
  return Array.from(
    skills.reduce<Map<number, BuildingPanelSkill[]>>((groups, skill) => {
      const tierSkills = groups.get(skill.tier) ?? [];

      tierSkills.push(skill);
      groups.set(skill.tier, tierSkills);

      return groups;
    }, new Map()),
  ).sort(([leftTier], [rightTier]) => leftTier - rightTier);
}

export function BuildingPanel({
  activeTab,
  save,
  buildingId,
  onOpenGladiator,
  onPurchaseBuilding,
  onPurchaseBuildingImprovement,
  onPurchaseBuildingSkill,
  onSelectBuildingPolicy,
  onTabChange,
  onUpgradeBuilding,
}: BuildingPanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const [internalActiveTab, setInternalActiveTab] = useState<BuildingPanelTab>('overview');
  const viewModel = createBuildingPanelViewModel(save, buildingId, t);
  const ludusCapacity = buildingId === 'dormitory' ? createLudusCapacityViewModel(save) : null;
  const buildingLedgerEntries = save.economy.ledgerEntries.filter(
    (entry) => entry.buildingId === buildingId,
  );
  const buildingIncomeEntries = buildingLedgerEntries.filter((entry) => entry.kind === 'income');
  const buildingExpenseEntries = buildingLedgerEntries.filter((entry) => entry.kind === 'expense');
  const visibleBuildingIncomeEntries = buildingIncomeEntries.slice(0, BUILDING_LEDGER_ENTRY_LIMIT);
  const visibleBuildingExpenseEntries = buildingExpenseEntries.slice(
    0,
    BUILDING_LEDGER_ENTRY_LIMIT,
  );
  const buildingIncomeTotal = buildingIncomeEntries.reduce(
    (total, entry) => total + entry.amount,
    0,
  );
  const buildingExpenseTotal = buildingExpenseEntries.reduce(
    (total, entry) => total + entry.amount,
    0,
  );
  const buildingNetTotal = buildingLedgerEntries.reduce(
    (total, entry) => total + getLedgerEntryAmount(entry),
    0,
  );
  const skillTiers = groupBuildingSkillsByTier(viewModel.skills);
  const purchasedSkillCount = viewModel.skills.filter((skill) => skill.isPurchased).length;
  const availableSkillCount = viewModel.skills.filter(
    (skill) => !skill.isPurchased && skill.canPurchase,
  ).length;
  const lockedSkillCount = viewModel.skills.length - purchasedSkillCount - availableSkillCount;
  const purchasedImprovementCount = viewModel.improvements.filter(
    (improvement) => improvement.isPurchased,
  ).length;
  const hasConfiguration = viewModel.policies.length > 0 || viewModel.activities.length > 0;
  const hasUpgrades = viewModel.improvements.length > 0 || viewModel.skills.length > 0;
  const tabItems: ModalTabItem<BuildingPanelTab>[] = [
    { id: 'overview', labelKey: 'buildingPanel.tabs.overview' },
    ...(onOpenGladiator
      ? [{ id: 'gladiators' as const, labelKey: 'buildingPanel.tabs.gladiators' }]
      : []),
    ...(hasConfiguration
      ? [{ id: 'configuration' as const, labelKey: 'buildingPanel.tabs.configuration' }]
      : []),
    ...(hasUpgrades
      ? [
          {
            count: purchasedImprovementCount + purchasedSkillCount,
            countMax: viewModel.improvements.length + viewModel.skills.length,
            id: 'upgrades' as const,
            labelKey: 'buildingPanel.tabs.upgrades',
          },
        ]
      : []),
    { count: buildingLedgerEntries.length, id: 'finance', labelKey: 'buildingPanel.tabs.finance' },
  ];
  const currentActiveTab = activeTab ?? internalActiveTab;
  const selectedTab = tabItems.some((item) => item.id === currentActiveTab)
    ? currentActiveTab
    : 'overview';
  const actionCostLabelKey = viewModel.isPurchased
    ? 'buildings.upgradeCost'
    : 'buildings.purchaseCostLabel';
  const actionCostLabel = viewModel.action.cost
    ? formatMoneyAmount(viewModel.action.cost)
    : t('buildings.maxLevel');

  const requestBuildingAction = () => {
    const actionPreview = viewModel.action.preview;

    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: viewModel.action.labelKey,
      content: actionPreview ? (
        <BuildingActionModalContent
          buildingId={buildingId}
          buildingNameKey={viewModel.nameKey}
          cost={viewModel.action.cost}
          costTitleKey={actionCostLabelKey}
          currentLevel={actionPreview.currentLevel}
          descriptionKey={viewModel.descriptionKey}
          effects={actionPreview.effects}
          nextLevel={actionPreview.nextLevel}
        />
      ) : undefined,
      messageKey: viewModel.isPurchased
        ? 'buildings.confirmUpgrade.message'
        : 'buildings.confirmPurchase.message',
      messageParams: {
        building: t(viewModel.nameKey),
        cost: formatMoneyAmount(viewModel.action.cost),
      },
      onConfirm: () =>
        viewModel.isPurchased ? onUpgradeBuilding(buildingId) : onPurchaseBuilding(buildingId),
      size: actionPreview ? 'lg' : undefined,
      testId: 'building-action-confirm-dialog',
      titleKey: viewModel.isPurchased
        ? 'buildings.confirmUpgrade.modalTitle'
        : 'buildings.confirmPurchase.modalTitle',
      titleParams: {
        building: t(viewModel.nameKey),
      },
    });
  };

  const requestImprovementPurchase = (improvement: (typeof viewModel.improvements)[number]) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'buildingPanel.purchaseImprovement',
      messageKey: 'buildingPanel.confirmImprovementPurchase.message',
      messageParams: {
        cost: formatMoneyAmount(improvement.cost),
        improvement: t(improvement.nameKey),
      },
      onConfirm: () => onPurchaseBuildingImprovement(buildingId, improvement.id),
      testId: 'building-improvement-purchase-confirm-dialog',
      titleKey: 'buildingPanel.confirmImprovementPurchase.title',
    });
  };

  const requestPolicySelection = (policy: (typeof viewModel.policies)[number]) => {
    if (!policy.cost) {
      onSelectBuildingPolicy(buildingId, policy.id);
      return;
    }

    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'buildingPanel.selectPolicy',
      messageKey: 'buildingPanel.confirmPolicySelection.message',
      messageParams: {
        cost: formatMoneyAmount(policy.cost),
        policy: t(policy.nameKey),
      },
      onConfirm: () => onSelectBuildingPolicy(buildingId, policy.id),
      testId: 'building-policy-selection-confirm-dialog',
      titleKey: 'buildingPanel.confirmPolicySelection.title',
    });
  };

  const requestSkillPurchase = (skill: (typeof viewModel.skills)[number]) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'buildingPanel.purchaseSkill',
      messageKey: 'buildingPanel.confirmSkillPurchase.message',
      messageParams: {
        cost: formatMoneyAmount(skill.cost),
        skill: t(skill.nameKey, { name: skill.name }),
      },
      onConfirm: () => onPurchaseBuildingSkill(buildingId, skill.id),
      testId: 'building-skill-purchase-confirm-dialog',
      titleKey: 'buildingPanel.confirmSkillPurchase.title',
    });
  };

  const selectTab = (tab: BuildingPanelTab) => {
    if (!activeTab) {
      setInternalActiveTab(tab);
    }

    onTabChange?.(tab);
  };

  return (
    <ModalContentFrame>
      <ModalHeroCard
        avatar={<BuildingAvatar buildingId={buildingId} level={viewModel.level} />}
        descriptionKey={viewModel.descriptionKey}
        eyebrowKey="buildings.panelTitle"
        level={viewModel.level}
        levelLabelKey="buildingPanel.level"
        metrics={[
          {
            iconName: 'treasury',
            id: 'action-cost',
            labelKey: actionCostLabelKey,
            value: actionCostLabel,
          },
        ]}
        titleKey={viewModel.nameKey}
      />

      <ModalTabs<BuildingPanelTab>
        ariaLabelKey="buildingPanel.tabsLabel"
        items={tabItems}
        selectedId={selectedTab}
        onSelect={selectTab}
      />

      {selectedTab === 'overview' ? (
        <ModalTabPanel>
          <SectionCard titleKey="buildings.currentEffects">
            <EffectList effects={viewModel.effects} />
          </SectionCard>
          {ludusCapacity ? (
            <SectionCard titleKey="ludusCapacity.title">
              <MetricList
                items={[
                  {
                    labelKey: 'ludusCapacity.usedCapacity',
                    value: `${ludusCapacity.usedPlaces}/${ludusCapacity.capacity}`,
                  },
                  {
                    labelKey: 'ludusCapacity.availableCapacity',
                    value: ludusCapacity.availablePlaces,
                  },
                ]}
              />
            </SectionCard>
          ) : null}
          {viewModel.action.validationMessageKey ? (
            <NoticeBox tone="warning">
              {t(viewModel.action.validationMessageKey, viewModel.action.validationMessageParams)}
            </NoticeBox>
          ) : null}
          <ModalActionDock>
            <CTAButton
              amountMoney={
                viewModel.action.cost > 0 ? formatMoneyAmount(viewModel.action.cost) : undefined
              }
              disabled={!viewModel.action.isAllowed}
              onClick={requestBuildingAction}
            >
              <GameIcon name="hammer" size={17} />
              <span>{t(viewModel.action.labelKey)}</span>
            </CTAButton>
          </ModalActionDock>
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'gladiators' && onOpenGladiator ? (
        <ModalTabPanel>
          <ModalSection titleKey="buildingPanel.tabs.gladiators">
            <EntityList emptyMessageKey="ludus.noGladiators">
              {save.gladiators.map((gladiator) => (
                <GladiatorListRow
                  gladiator={gladiator}
                  key={gladiator.id}
                  openLabel={t('roster.openGladiator', { name: gladiator.name })}
                  testId={`building-gladiator-${gladiator.id}`}
                  onOpen={() => onOpenGladiator(gladiator.id)}
                />
              ))}
            </EntityList>
          </ModalSection>
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'configuration' ? (
        <ModalTabPanel>
          {viewModel.policies.length > 0 ? (
            <ModalSection titleKey="buildingPanel.tabs.policy">
              <div className="context-panel__list">
                {viewModel.policies.map((policy) => (
                  <SectionCard
                    className={policy.isSelected ? 'is-selected' : ''}
                    key={policy.id}
                    testId={`building-policy-${policy.id}`}
                  >
                    <strong>{t(policy.nameKey)}</strong>
                    <span>{t(policy.descriptionKey)}</span>
                    <MetricList
                      columns={2}
                      items={[
                        {
                          labelKey: 'buildingPanel.requiredLevel',
                          value: t('common.level', { level: policy.requiredBuildingLevel }),
                        },
                        {
                          labelKey: 'buildingPanel.policyStatus',
                          value: t(policy.isSelected ? 'common.selected' : 'common.notSelected'),
                        },
                      ]}
                    />
                    <CostSummary
                      labelKey="buildingPanel.policyCost"
                      value={
                        policy.cost
                          ? t('buildings.purchaseCost', { cost: formatMoneyAmount(policy.cost) })
                          : t('common.empty')
                      }
                    />
                    <EffectList effects={policy.effects} />
                    {policy.validationMessageKey ? (
                      <NoticeBox tone={policy.isSelected ? 'info' : 'warning'}>
                        {t(policy.validationMessageKey, policy.validationMessageParams)}
                      </NoticeBox>
                    ) : null}
                    <div className="context-panel__actions">
                      <button
                        disabled={!policy.canSelect}
                        type="button"
                        onClick={() => requestPolicySelection(policy)}
                      >
                        <GameIcon name="check" size={17} />
                        <span>{t(policy.actionLabelKey)}</span>
                      </button>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {viewModel.activities.length > 0 ? (
            <ModalSection titleKey="buildingPanel.tabs.activities">
              <div className="context-panel__list">
                {viewModel.activities.map((activity) => (
                  <SectionCard
                    className={activity.isUnlocked ? 'is-selected' : 'is-locked'}
                    key={activity.id}
                    testId={`building-activity-${activity.id}`}
                  >
                    <div className="building-activity-card__header">
                      <strong>{activity.name}</strong>
                      <Badge
                        label={t(
                          activity.isUnlocked
                            ? 'buildingPanel.activityUnlocked'
                            : 'buildingPanel.activityLocked',
                        )}
                        tone={activity.isUnlocked ? 'success' : 'warning'}
                      />
                    </div>
                    <span>{activity.description}</span>
                    <MetricList
                      columns={3}
                      items={[
                        {
                          labelKey: 'buildingPanel.activitySourceSkill',
                          value: activity.sourceSkillName,
                        },
                        { labelKey: 'buildingPanel.skillTier', value: activity.tier },
                        {
                          labelKey: 'buildingPanel.requiredLevel',
                          value: t('common.level', { level: activity.requiredBuildingLevel }),
                        },
                      ]}
                    />
                    <NoticeBox tone={activity.isUnlocked ? 'info' : 'warning'}>
                      {t(
                        activity.isUnlocked
                          ? 'buildingPanel.activityUnlockedBySkill'
                          : 'buildingPanel.activityLockedBySkill',
                        { skill: activity.sourceSkillName },
                      )}
                    </NoticeBox>
                  </SectionCard>
                ))}
              </div>
            </ModalSection>
          ) : null}
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'upgrades' ? (
        <ModalTabPanel>
          {viewModel.improvements.length > 0 ? (
            <ModalSection titleKey="buildingPanel.tabs.improvements">
              <div className="context-panel__list">
                {viewModel.improvements.map((improvement) => (
                  <SectionCard
                    className={improvement.isPurchased ? 'is-selected' : ''}
                    key={improvement.id}
                    testId={`building-improvement-${improvement.id}`}
                  >
                    <strong>{t(improvement.nameKey)}</strong>
                    <span>{t(improvement.descriptionKey)}</span>
                    <MetricList
                      columns={2}
                      items={[
                        {
                          labelKey: 'buildingPanel.requiredLevel',
                          value: t('common.level', { level: improvement.requiredBuildingLevel }),
                        },
                        {
                          labelKey: 'buildingPanel.requiredImprovements',
                          value:
                            improvement.requiredImprovementNames.length > 0
                              ? improvement.requiredImprovementNames.join(', ')
                              : t('common.empty'),
                        },
                      ]}
                    />
                    <CostSummary
                      labelKey="buildingPanel.improvementCost"
                      value={t('buildings.purchaseCost', {
                        cost: formatMoneyAmount(improvement.cost),
                      })}
                    />
                    <EffectList effects={improvement.effects} />
                    {improvement.validationMessageKey ? (
                      <NoticeBox tone={improvement.isPurchased ? 'info' : 'warning'}>
                        {t(improvement.validationMessageKey, improvement.validationMessageParams)}
                      </NoticeBox>
                    ) : null}
                    <div className="context-panel__actions">
                      <button
                        disabled={!improvement.canPurchase}
                        type="button"
                        onClick={() => requestImprovementPurchase(improvement)}
                      >
                        <GameIcon name="hammer" size={17} />
                        <span>{t(improvement.actionLabelKey)}</span>
                      </button>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </ModalSection>
          ) : null}

          {viewModel.skills.length > 0 ? (
            <ModalSection titleKey="buildingPanel.tabs.skills">
              <div className="building-skill-tree">
                <SectionCard className="building-skill-tree__summary">
                  <MetricList
                    columns={3}
                    items={[
                      {
                        labelKey: 'buildingPanel.skillState.purchased',
                        value: purchasedSkillCount,
                      },
                      {
                        labelKey: 'buildingPanel.skillState.available',
                        value: availableSkillCount,
                      },
                      {
                        labelKey: 'buildingPanel.skillState.locked',
                        value: lockedSkillCount,
                      },
                    ]}
                  />
                </SectionCard>
                {skillTiers.map(([tier, skills]) => {
                  const tierPurchasedCount = skills.filter((skill) => skill.isPurchased).length;
                  const tierTitleId = `building-skill-tree-tier-${buildingId}-${tier}`;

                  return (
                    <section
                      aria-labelledby={tierTitleId}
                      className="building-skill-tree__tier"
                      key={tier}
                    >
                      <div className="building-skill-tree__tier-header">
                        <h3 id={tierTitleId}>{t('buildingPanel.skillTierTitle', { tier })}</h3>
                        <span>
                          {t('buildingPanel.skillTierProgress', {
                            purchased: tierPurchasedCount,
                            total: skills.length,
                          })}
                        </span>
                      </div>
                      <div className="building-skill-tree__nodes">
                        {skills.map((skill) => {
                          const skillState = getBuildingSkillState(skill);
                          const requiredLevelIsMet = viewModel.level >= skill.requiredBuildingLevel;
                          const requiredSkillsAreMet =
                            skillState !== 'locked' ||
                            skill.validationMessageKey !==
                              'buildings.validation.missingSkillPrerequisite';

                          return (
                            <SectionCard
                              className={`building-skill-tree__node building-skill-tree__node--${skillState}`}
                              key={skill.id}
                            >
                              <div className="building-skill-tree__node-header">
                                <div className="building-skill-tree__node-title">
                                  <strong>{t(skill.nameKey, { name: skill.name })}</strong>
                                  <span>{t(skill.descriptionKey, { name: skill.name })}</span>
                                </div>
                                <Badge
                                  label={t(getBuildingSkillStateLabelKey(skillState))}
                                  tone={getBuildingSkillStateBadgeTone(skillState)}
                                />
                              </div>
                              <MetricList
                                columns={3}
                                items={[
                                  { labelKey: 'buildingPanel.skillTier', value: skill.tier },
                                  {
                                    labelKey: 'buildingPanel.skillCost',
                                    value: formatMoneyAmount(skill.cost),
                                  },
                                  {
                                    labelKey: 'buildingPanel.requiredSkills',
                                    value: skill.requiredSkillNames.length,
                                  },
                                ]}
                              />
                              <div className="building-skill-tree__details">
                                <div className="building-skill-tree__detail-block">
                                  <strong>{t('buildingPanel.skillPrerequisites')}</strong>
                                  <ul className="building-skill-tree__requirement-list">
                                    <li
                                      className={
                                        requiredLevelIsMet
                                          ? 'building-skill-tree__requirement building-skill-tree__requirement--met'
                                          : 'building-skill-tree__requirement building-skill-tree__requirement--missing'
                                      }
                                    >
                                      <GameIcon
                                        name={requiredLevelIsMet ? 'check' : 'warning'}
                                        size={14}
                                      />
                                      <span>
                                        {t('buildingPanel.skillRequiredLevelValue', {
                                          level: skill.requiredBuildingLevel,
                                        })}
                                      </span>
                                    </li>
                                    {skill.requiredSkillNames.length > 0 ? (
                                      skill.requiredSkillNames.map((requiredSkillName) => (
                                        <li
                                          className={
                                            requiredSkillsAreMet
                                              ? 'building-skill-tree__requirement building-skill-tree__requirement--met'
                                              : 'building-skill-tree__requirement building-skill-tree__requirement--missing'
                                          }
                                          key={requiredSkillName}
                                        >
                                          <GameIcon
                                            name={requiredSkillsAreMet ? 'check' : 'warning'}
                                            size={14}
                                          />
                                          <span>{requiredSkillName}</span>
                                        </li>
                                      ))
                                    ) : (
                                      <li className="building-skill-tree__requirement building-skill-tree__requirement--met">
                                        <GameIcon name="check" size={14} />
                                        <span>{t('buildingPanel.skillNoRequiredSkills')}</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                                <div className="building-skill-tree__detail-block">
                                  <strong>{t('buildingPanel.skillUnlockedActivities')}</strong>
                                  {skill.unlockedActivities.length > 0 ? (
                                    <ul className="building-skill-tree__activity-list">
                                      {skill.unlockedActivities.map((activity) => (
                                        <li key={activity.id}>
                                          <GameIcon
                                            name={skill.isPurchased ? 'check' : 'arrowRight'}
                                            size={14}
                                          />
                                          <span>{activity.name}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="building-skill-tree__empty">
                                      {t('buildingPanel.skillNoUnlockedActivities')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <EffectList effects={skill.effects} />
                              {skill.validationMessageKey ? (
                                <NoticeBox tone={skill.isPurchased ? 'info' : 'warning'}>
                                  {t(skill.validationMessageKey, skill.validationMessageParams)}
                                </NoticeBox>
                              ) : null}
                              <div className="context-panel__actions">
                                <button
                                  disabled={!skill.canPurchase}
                                  type="button"
                                  onClick={() => requestSkillPurchase(skill)}
                                >
                                  <GameIcon name="hammer" size={17} />
                                  <span>{t(skill.actionLabelKey)}</span>
                                </button>
                              </div>
                            </SectionCard>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </ModalSection>
          ) : null}
        </ModalTabPanel>
      ) : null}

      {selectedTab === 'finance' ? (
        <ModalTabPanel>
          <MetricList
            columns={3}
            items={[
              { labelKey: 'finance.reportIncome', value: formatMoneyAmount(buildingIncomeTotal) },
              {
                labelKey: 'finance.reportExpenses',
                value: formatMoneyAmount(buildingExpenseTotal),
              },
              { labelKey: 'finance.reportNet', value: formatMoneyAmount(buildingNetTotal) },
            ]}
          />
          <ModalSection titleKey="buildingPanel.financeIncomeTitle">
            <LedgerEntryList
              entries={visibleBuildingIncomeEntries}
              emptyMessageKey="buildingPanel.noBuildingIncome"
              variant="compact"
            />
          </ModalSection>
          <ModalSection titleKey="buildingPanel.financeExpenseTitle">
            <LedgerEntryList
              entries={visibleBuildingExpenseEntries}
              emptyMessageKey="buildingPanel.noBuildingExpenses"
              variant="compact"
            />
          </ModalSection>
        </ModalTabPanel>
      ) : null}
    </ModalContentFrame>
  );
}
