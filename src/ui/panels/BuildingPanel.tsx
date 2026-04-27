import { Check, Hammer } from 'lucide-react';
import { useState } from 'react';
import type { BuildingId, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import {
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
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { formatMoneyAmount } from '../formatters/money';
import {
  createBuildingPanelViewModel,
  createDormitoryCapacityViewModel,
} from '../view-models/building-panel-view-model';

interface BuildingPanelProps {
  save: GameSave;
  buildingId: BuildingId;
  onClose(): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
  onPurchaseBuildingImprovement(buildingId: BuildingId, improvementId: string): void;
  onSelectBuildingPolicy(buildingId: BuildingId, policyId: string): void;
  onUpgradeBuilding(buildingId: BuildingId): void;
}

type BuildingPanelTab = 'overview' | 'improvements' | 'policy' | 'gladiators';

const tabs: { id: BuildingPanelTab; labelKey: string }[] = [
  { id: 'overview', labelKey: 'buildingPanel.tabs.overview' },
  { id: 'improvements', labelKey: 'buildingPanel.tabs.improvements' },
  { id: 'policy', labelKey: 'buildingPanel.tabs.policy' },
  { id: 'gladiators', labelKey: 'buildingPanel.tabs.gladiators' },
];

export function BuildingPanel({
  save,
  buildingId,
  onClose,
  onPurchaseBuilding,
  onPurchaseBuildingImprovement,
  onSelectBuildingPolicy,
  onUpgradeBuilding,
}: BuildingPanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<BuildingPanelTab>('overview');
  const viewModel = createBuildingPanelViewModel(save, buildingId, t);
  const dormitoryCapacity =
    buildingId === 'dormitory' ? createDormitoryCapacityViewModel(save) : null;

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
            ]}
          />
          <SectionCard titleKey="buildings.currentEffects">
            <EffectList effects={viewModel.effects} />
          </SectionCard>
          {dormitoryCapacity ? (
            <SectionCard titleKey="dormitoryBeds.title">
              <MetricList
                items={[
                  {
                    labelKey: 'dormitoryBeds.usedCapacity',
                    value: `${dormitoryCapacity.usedBeds}/${dormitoryCapacity.capacity}`,
                  },
                  {
                    labelKey: 'dormitoryBeds.availableCapacity',
                    value: dormitoryCapacity.availableBeds,
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
              <Hammer aria-hidden="true" size={17} />
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
                    <Hammer aria-hidden="true" size={17} />
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
                    <Check aria-hidden="true" size={17} />
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
      {activeTab === 'gladiators' ? (
        <div className="context-panel__list">
          {viewModel.assignedGladiators.length > 0 ? (
            viewModel.assignedGladiators.map((assignedGladiator) => {
              const gladiator = save.gladiators.find(
                (candidate) => candidate.id === assignedGladiator.id,
              );

              return (
                <SectionCard className="context-panel__portrait-row" key={assignedGladiator.id}>
                  {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                  <strong>{assignedGladiator.name}</strong>
                  <span>
                    {t('weeklyPlan.readinessValue', { score: assignedGladiator.readiness })}
                  </span>
                </SectionCard>
              );
            })
          ) : (
            <EmptyState messageKey="buildings.noAssignedGladiators" />
          )}
        </div>
      ) : null}
    </PanelShell>
  );
}
