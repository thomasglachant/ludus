import { Hammer, X } from 'lucide-react';
import { useState } from 'react';
import {
  validateBuildingPurchase,
  validateBuildingUpgrade,
} from '../../domain/buildings/building-actions';
import { calculateReadiness } from '../../domain/planning/readiness';
import type { BuildingId, GameSave } from '../../domain/types';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import {
  getBuildingActionMessageKey,
  getBuildingActionMessageParams,
  getBuildingEffects,
} from './panel-helpers';

interface BuildingPanelProps {
  save: GameSave;
  buildingId: BuildingId;
  onClose(): void;
  onPurchaseBuilding(buildingId: BuildingId): void;
  onUpgradeBuilding(buildingId: BuildingId): void;
}

type BuildingPanelTab = 'overview' | 'improvements' | 'policy' | 'gladiators';

const tabs: BuildingPanelTab[] = ['overview', 'improvements', 'policy', 'gladiators'];

export function BuildingPanel({
  save,
  buildingId,
  onClose,
  onPurchaseBuilding,
  onUpgradeBuilding,
}: BuildingPanelProps) {
  const { t } = useUiStore();
  const [activeTab, setActiveTab] = useState<BuildingPanelTab>('overview');
  const building = save.buildings[buildingId];
  const definition = BUILDING_DEFINITIONS[buildingId];
  const levelDefinition = definition.levels.find((level) => level.level === building.level);
  const purchaseValidation = validateBuildingPurchase(save, buildingId);
  const upgradeValidation = validateBuildingUpgrade(save, buildingId);
  const actionValidation = building.isPurchased ? upgradeValidation : purchaseValidation;
  const validationMessageKey = getBuildingActionMessageKey(actionValidation);
  const effects = getBuildingEffects(levelDefinition?.effects ?? [], t);
  const assignedGladiators = save.gladiators.filter(
    (gladiator) => gladiator.currentBuildingId === buildingId,
  );
  const improvements = BUILDING_IMPROVEMENTS.filter(
    (improvement) => improvement.buildingId === buildingId,
  );
  const policies = BUILDING_POLICIES.filter((policy) => policy.buildingId === buildingId);

  return (
    <section
      className="context-panel"
      data-testid="building-modal"
      aria-labelledby="building-panel-title"
    >
      <div className="context-panel__header">
        <div>
          <p className="eyebrow">{t('buildings.panelTitle')}</p>
          <h2 id="building-panel-title" data-testid="building-modal-title">
            {t(definition.nameKey)}
          </h2>
        </div>
        <button aria-label={t('common.close')} type="button" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <p className="context-panel__description">{t(definition.descriptionKey)}</p>
      <div className="context-panel__tabs" role="tablist" aria-label={t('buildingPanel.tabsLabel')}>
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'is-selected' : ''}
            key={tab}
            role="tab"
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {t(`buildingPanel.tabs.${tab}`)}
          </button>
        ))}
      </div>
      {activeTab === 'overview' ? (
        <div className="context-panel__section">
          <dl className="context-panel__stats">
            <div>
              <dt>{t('common.status')}</dt>
              <dd>{building.isPurchased ? t('common.purchased') : t('common.notPurchased')}</dd>
            </div>
            <div>
              <dt>{t('buildingPanel.level')}</dt>
              <dd>{building.level}</dd>
            </div>
            <div>
              <dt>
                {building.isPurchased
                  ? t('buildings.upgradeCost')
                  : t('buildings.purchaseCostLabel')}
              </dt>
              <dd>
                {building.isPurchased
                  ? actionValidation.cost || t('buildings.maxLevel')
                  : t('buildings.purchaseCost', { cost: actionValidation.cost })}
              </dd>
            </div>
          </dl>
          <div className="context-panel__callout">
            <strong>{t('buildings.currentEffects')}</strong>
            <ul>
              {effects.map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>
          </div>
          {validationMessageKey ? (
            <p className="building-panel__validation">
              {t(validationMessageKey, getBuildingActionMessageParams(actionValidation))}
            </p>
          ) : null}
          <div className="context-panel__actions">
            {building.isPurchased ? (
              <button
                disabled={!actionValidation.isAllowed}
                type="button"
                onClick={() => onUpgradeBuilding(buildingId)}
              >
                <Hammer aria-hidden="true" size={17} />
                <span>{t('buildings.upgrade')}</span>
              </button>
            ) : (
              <button
                disabled={!actionValidation.isAllowed}
                type="button"
                onClick={() => onPurchaseBuilding(buildingId)}
              >
                <Hammer aria-hidden="true" size={17} />
                <span>{t('buildings.purchase')}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
      {activeTab === 'improvements' ? (
        <div className="context-panel__list">
          {improvements.length > 0 ? (
            improvements.map((improvement) => (
              <article key={improvement.id}>
                <strong>{t(improvement.nameKey)}</strong>
                <span>{t(improvement.descriptionKey)}</span>
                <small>{t('buildingPanel.improvementCost', { cost: improvement.cost })}</small>
              </article>
            ))
          ) : (
            <p>{t('buildingPanel.noImprovements')}</p>
          )}
        </div>
      ) : null}
      {activeTab === 'policy' ? (
        <div className="context-panel__list">
          {policies.length > 0 ? (
            policies.map((policy) => (
              <article
                className={building.selectedPolicyId === policy.id ? 'is-selected' : ''}
                key={policy.id}
              >
                <strong>{t(policy.nameKey)}</strong>
                <span>{t(policy.descriptionKey)}</span>
                <small>
                  {policy.cost
                    ? t('buildingPanel.policyCost', { cost: policy.cost })
                    : t('common.empty')}
                </small>
              </article>
            ))
          ) : (
            <p>{t('buildingPanel.noPolicies')}</p>
          )}
        </div>
      ) : null}
      {activeTab === 'gladiators' ? (
        <div className="context-panel__list">
          {assignedGladiators.length > 0 ? (
            assignedGladiators.map((gladiator) => (
              <article className="context-panel__portrait-row" key={gladiator.id}>
                <GladiatorPortrait gladiator={gladiator} size="small" />
                <strong>{gladiator.name}</strong>
                <span>
                  {t('weeklyPlan.readinessValue', { score: calculateReadiness(gladiator) })}
                </span>
              </article>
            ))
          ) : (
            <p>{t('buildings.noAssignedGladiators')}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
