import { useState } from 'react';
import { getRequiredStaffCount } from '../../domain/buildings/building-staffing';
import type { BuildingId, GameSave } from '../../domain/types';
import { validateStaffAssignment } from '../../domain/staff/staff-actions';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import {
  Badge,
  EffectList,
  EmptyState,
  CostSummary,
  MetricList,
  NoticeBox,
  PanelShell,
  SectionCard,
  Tabs,
} from '../components/shared';
import { BuildingActionModalContent } from '../modals/BuildingActionModalContent';
import { GameIcon } from '../icons/GameIcon';
import { getLedgerEntryAmount, getLedgerEntryMeta } from '../formatters/ledger';
import { formatMoneyAmount } from '../formatters/money';
import { StaffPortrait } from '../staff/StaffPortrait';
import {
  type BuildingPanelViewModel,
  createBuildingPanelViewModel,
  createLudusCapacityViewModel,
} from '../view-models/building-panel-view-model';

interface BuildingPanelProps {
  save: GameSave;
  buildingId: BuildingId;
  onClose(): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
  onPurchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  onPurchaseBuildingSkill(buildingId: BuildingId, skillId: string): void;
  onAssignStaffToBuilding(staffId: string, buildingId?: BuildingId): void;
  onSelectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  onUpgradeBuilding(buildingId: BuildingId): void;
}

type BuildingPanelTab =
  | 'overview'
  | 'staff'
  | 'skills'
  | 'activities'
  | 'ledger'
  | 'improvements'
  | 'policy';

const tabs: { id: BuildingPanelTab; labelKey: string }[] = [
  { id: 'overview', labelKey: 'buildingPanel.tabs.overview' },
  { id: 'staff', labelKey: 'buildingPanel.tabs.staff' },
  { id: 'skills', labelKey: 'buildingPanel.tabs.skills' },
  { id: 'activities', labelKey: 'buildingPanel.tabs.activities' },
  { id: 'ledger', labelKey: 'buildingPanel.tabs.ledger' },
  { id: 'improvements', labelKey: 'buildingPanel.tabs.improvements' },
  { id: 'policy', labelKey: 'buildingPanel.tabs.policy' },
];

type BuildingPanelSkill = BuildingPanelViewModel['skills'][number];
type BuildingSkillState = 'purchased' | 'available' | 'locked';

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
  save,
  buildingId,
  onClose,
  onPurchaseBuilding,
  onPurchaseBuildingImprovement,
  onPurchaseBuildingSkill,
  onAssignStaffToBuilding,
  onSelectBuildingPolicy,
  onUpgradeBuilding,
}: BuildingPanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<BuildingPanelTab>('overview');
  const viewModel = createBuildingPanelViewModel(save, buildingId, t);
  const ludusCapacity = buildingId === 'dormitory' ? createLudusCapacityViewModel(save) : null;
  const requiredStaffCount = getRequiredStaffCount(save, buildingId);
  const assignedStaffCount = save.buildings[buildingId].staffAssignmentIds.length;
  const hasStaffRequirement = requiredStaffCount > 0;
  const buildingLedgerEntries = save.economy.ledgerEntries.filter(
    (entry) => entry.buildingId === buildingId,
  );
  const skillTiers = groupBuildingSkillsByTier(viewModel.skills);
  const purchasedSkillCount = viewModel.skills.filter((skill) => skill.isPurchased).length;
  const availableSkillCount = viewModel.skills.filter(
    (skill) => !skill.isPurchased && skill.canPurchase,
  ).length;
  const lockedSkillCount = viewModel.skills.length - purchasedSkillCount - availableSkillCount;

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
          costTitleKey={
            viewModel.isPurchased ? 'buildings.upgradeCost' : 'buildings.purchaseCostLabel'
          }
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

  return (
    <PanelShell
      descriptionKey={viewModel.descriptionKey}
      eyebrowKey="buildings.panelTitle"
      testId="building-modal"
      titleKey={viewModel.nameKey}
      titleTestId="building-modal-title"
      onClose={onClose}
    >
      <Tabs<BuildingPanelTab>
        ariaLabelKey="buildingPanel.tabsLabel"
        items={tabs}
        selectedId={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === 'overview' ? (
        <div className="context-panel__section">
          <MetricList
            items={[
              { labelKey: 'common.status', value: t(viewModel.statusKey) },
              { labelKey: 'buildingPanel.level', value: viewModel.level },
              {
                labelKey: viewModel.isPurchased
                  ? 'buildings.upgradeCost'
                  : 'buildings.purchaseCostLabel',
                value: viewModel.action.cost
                  ? t('buildings.purchaseCost', { cost: formatMoneyAmount(viewModel.action.cost) })
                  : t('buildings.maxLevel'),
              },
              {
                labelKey: 'buildingPanel.efficiency',
                value: `${save.buildings[buildingId].efficiency}%`,
              },
              ...(hasStaffRequirement
                ? [
                    {
                      labelKey: 'staff.assignmentCapacity',
                      value: t('staff.assignmentCapacityValue', {
                        current: assignedStaffCount,
                        required: requiredStaffCount,
                      }),
                    },
                  ]
                : []),
            ]}
          />
          {hasStaffRequirement && assignedStaffCount < requiredStaffCount ? (
            <NoticeBox tone="warning">
              {t('buildingPanel.staffShortageWarning', {
                current: assignedStaffCount,
                efficiency: save.buildings[buildingId].efficiency,
                required: requiredStaffCount,
              })}
            </NoticeBox>
          ) : null}
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
          <div className="context-panel__actions">
            <button
              disabled={!viewModel.action.isAllowed}
              type="button"
              onClick={requestBuildingAction}
            >
              <GameIcon name="hammer" size={17} />
              <span>{t(viewModel.action.labelKey)}</span>
            </button>
          </div>
        </div>
      ) : null}
      {activeTab === 'improvements' ? (
        <div className="context-panel__list">
          {viewModel.improvements.length > 0 ? (
            viewModel.improvements.map((improvement) => (
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
                  value={t('buildings.purchaseCost', { cost: formatMoneyAmount(improvement.cost) })}
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
            ))
          ) : (
            <EmptyState messageKey="buildingPanel.noImprovements" />
          )}
        </div>
      ) : null}
      {activeTab === 'staff' ? (
        <div className="context-panel__section">
          <MetricList
            items={[
              {
                labelKey: 'staff.assignmentCapacity',
                value: t('staff.assignmentCapacityValue', {
                  current: assignedStaffCount,
                  required: requiredStaffCount,
                }),
              },
            ]}
          />
          <div className="context-panel__list">
            {save.staff.members.length > 0 ? (
              save.staff.members.map((staffMember) => {
                const isAssignedHere = staffMember.assignedBuildingId === buildingId;
                const validation = validateStaffAssignment(save, staffMember.id, buildingId);
                const assignedBuildingName = staffMember.assignedBuildingId
                  ? t(BUILDING_DEFINITIONS[staffMember.assignedBuildingId].nameKey)
                  : t('staff.unassigned');

                return (
                  <SectionCard
                    className={['staff-card', isAssignedHere ? 'is-selected' : '']
                      .filter(Boolean)
                      .join(' ')}
                    key={staffMember.id}
                  >
                    <StaffPortrait staffMember={staffMember} />
                    <div className="staff-card__body">
                      <strong>{staffMember.name}</strong>
                      <MetricList
                        columns={3}
                        items={[
                          { labelKey: 'staff.type', value: t(`staff.types.${staffMember.type}`) },
                          {
                            labelKey: 'staff.weeklyWage',
                            value: formatMoneyAmount(staffMember.weeklyWage),
                          },
                          {
                            labelKey: 'staff.experience',
                            value: staffMember.buildingExperience[buildingId] ?? 0,
                          },
                          { labelKey: 'staff.assignment', value: assignedBuildingName },
                        ]}
                      />
                      {!isAssignedHere && validation.reason ? (
                        <NoticeBox tone="warning">
                          {t(`staff.assignmentValidation.${validation.reason}`)}
                        </NoticeBox>
                      ) : null}
                      <div className="context-panel__actions">
                        {isAssignedHere ? (
                          <button
                            type="button"
                            onClick={() => onAssignStaffToBuilding(staffMember.id)}
                          >
                            <GameIcon name="check" size={17} />
                            <span>{t('staff.unassign')}</span>
                          </button>
                        ) : (
                          <button
                            disabled={!validation.isAllowed}
                            type="button"
                            onClick={() => onAssignStaffToBuilding(staffMember.id, buildingId)}
                          >
                            <GameIcon name="workforce" size={17} />
                            <span>{t('staff.assignHere')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                );
              })
            ) : (
              <EmptyState messageKey="staff.empty" />
            )}
          </div>
        </div>
      ) : null}
      {activeTab === 'skills' ? (
        <div className="building-skill-tree">
          {viewModel.skills.length > 0 ? (
            <>
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
            </>
          ) : (
            <EmptyState messageKey="buildingPanel.noSkills" />
          )}
        </div>
      ) : null}
      {activeTab === 'activities' ? (
        <div className="context-panel__list">
          {viewModel.activities.length > 0 ? (
            viewModel.activities.map((activity) => (
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
            ))
          ) : (
            <EmptyState messageKey="buildingPanel.noSkillActivities" />
          )}
        </div>
      ) : null}
      {activeTab === 'ledger' ? (
        <div className="context-panel__list">
          {buildingLedgerEntries.length > 0 ? (
            buildingLedgerEntries.slice(0, 8).map((entry) => (
              <SectionCard className={`finance-entry finance-entry--${entry.kind}`} key={entry.id}>
                <div className="finance-entry__main">
                  <strong>{t(entry.labelKey)}</strong>
                  <span>{getLedgerEntryMeta(entry, t)}</span>
                </div>
                <strong className="finance-entry__amount">
                  {formatMoneyAmount(getLedgerEntryAmount(entry))}
                </strong>
              </SectionCard>
            ))
          ) : (
            <EmptyState messageKey="buildingPanel.noBuildingLedger" />
          )}
        </div>
      ) : null}
      {activeTab === 'policy' ? (
        <div className="context-panel__list">
          {viewModel.policies.length > 0 ? (
            viewModel.policies.map((policy) => (
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
            ))
          ) : (
            <EmptyState messageKey="buildingPanel.noPolicies" />
          )}
        </div>
      ) : null}
    </PanelShell>
  );
}
