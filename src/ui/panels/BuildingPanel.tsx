import { Hammer } from 'lucide-react';
import { useState } from 'react';
import type { BuildingId, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';
import {
  EffectList,
  EmptyState,
  MetricList,
  NoticeBox,
  PanelShell,
  SectionCard,
  Tabs,
} from '../components/shared';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { createBuildingPanelViewModel } from '../view-models/building-panel-view-model';

interface BuildingPanelProps {
  save: GameSave;
  buildingId: BuildingId;
  onClose(): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
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
  onUpgradeBuilding,
}: BuildingPanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<BuildingPanelTab>('overview');
  const viewModel = createBuildingPanelViewModel(save, buildingId, t);

  const requestBuildingAction = () => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: viewModel.action.labelKey,
      messageKey: viewModel.isPurchased
        ? 'buildings.confirmUpgrade.message'
        : 'buildings.confirmPurchase.message',
      messageParams: {
        building: t(viewModel.nameKey),
        cost: viewModel.action.cost,
      },
      onConfirm: () =>
        viewModel.isPurchased ? onUpgradeBuilding(buildingId) : onPurchaseBuilding(buildingId),
      testId: 'building-action-confirm-dialog',
      titleKey: viewModel.isPurchased
        ? 'buildings.confirmUpgrade.title'
        : 'buildings.confirmPurchase.title',
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
                  ? t('buildings.purchaseCost', { cost: viewModel.action.cost })
                  : t('buildings.maxLevel'),
              },
            ]}
          />
          <SectionCard titleKey="buildings.currentEffects">
            <EffectList effects={viewModel.effects} />
          </SectionCard>
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
              <SectionCard key={improvement.id}>
                <strong>{t(improvement.nameKey)}</strong>
                <span>{t(improvement.descriptionKey)}</span>
                <small>{t('buildingPanel.improvementCost', { cost: improvement.cost })}</small>
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
              <SectionCard className={policy.isSelected ? 'is-selected' : ''} key={policy.id}>
                <strong>{t(policy.nameKey)}</strong>
                <span>{t(policy.descriptionKey)}</span>
                <small>
                  {policy.cost
                    ? t('buildingPanel.policyCost', { cost: policy.cost })
                    : t('common.empty')}
                </small>
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
