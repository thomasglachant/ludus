import {
  Activity,
  ArrowRight,
  Battery,
  Coins,
  Dumbbell,
  Gauge,
  HeartPulse,
  Shield,
  Smile,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { BuildingEffectType, BuildingId } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { formatMoneyAmount } from '../formatters/money';
import type { BuildingActionEffectPreview } from '../view-models/building-panel-view-model';

interface BuildingActionModalContentProps {
  buildingId: BuildingId;
  buildingNameKey: string;
  cost: number;
  costTitleKey: string;
  currentLevel: number;
  descriptionKey: string;
  effects: BuildingActionEffectPreview[];
  nextLevel: number;
}

const effectIcons: Record<BuildingEffectType, LucideIcon> = {
  decreaseEnergy: Battery,
  decreaseMorale: Smile,
  increaseAgility: Gauge,
  increaseCapacity: Users,
  increaseDefense: Shield,
  increaseEnergy: Battery,
  increaseHealth: HeartPulse,
  increaseMorale: Smile,
  increaseReadiness: Activity,
  increaseSatiety: Utensils,
  increaseStrength: Dumbbell,
  reduceInjuryRisk: Shield,
};

function getEffectValue(
  effect: BuildingActionEffectPreview,
  value: number | null,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (value === null) {
    return t('buildingActionModal.noEffectValue');
  }

  return t(`buildingEffects.${effect.type}`, { value });
}

export function BuildingActionModalContent({
  buildingNameKey,
  cost,
  costTitleKey,
  currentLevel,
  descriptionKey,
  effects,
  nextLevel,
}: BuildingActionModalContentProps) {
  const { t } = useUiStore();

  return (
    <div className="building-action-modal">
      <div className="building-action-modal__summary">
        <div className="building-action-modal__copy">
          <strong>{t(buildingNameKey)}</strong>
          <p>{t(descriptionKey)}</p>
          <div
            aria-label={t('buildingActionModal.levelComparison')}
            className="building-action-modal__levels"
          >
            <span>
              <small>{t('buildingActionModal.currentLevel')}</small>
              <strong>{currentLevel}</strong>
            </span>
            <ArrowRight aria-hidden="true" size={18} />
            <span>
              <small>{t('buildingActionModal.nextLevel')}</small>
              <strong>{nextLevel}</strong>
            </span>
          </div>
        </div>
      </div>

      <section className="building-action-modal__effects">
        <h2>{t('buildingActionModal.effectsTitle')}</h2>
        {effects.length > 0 ? (
          <ul>
            {effects.map((effect) => {
              const EffectIcon = effectIcons[effect.type];

              return (
                <li key={effect.id}>
                  <EffectIcon aria-hidden="true" size={19} />
                  <span className="building-action-modal__effect-label">
                    {t(`buildingEffectNames.${effect.type}`)}
                    {effect.isPerHour ? <small>{t('buildingEffects.perHour')}</small> : null}
                  </span>
                  <span>{getEffectValue(effect, effect.currentValue, t)}</span>
                  <ArrowRight aria-hidden="true" size={16} />
                  <strong>{getEffectValue(effect, effect.nextValue, t)}</strong>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">{t('buildingActionModal.noEffects')}</p>
        )}
      </section>

      <section className="building-action-modal__cost">
        <h2>{t(costTitleKey)}</h2>
        <div className="building-action-modal__resources">
          <span className="building-action-modal__resource-chip">
            <Coins aria-hidden="true" size={18} />
            <strong>{formatMoneyAmount(cost)}</strong>
          </span>
          <span className="building-action-modal__resource-slot" aria-hidden="true" />
          <span className="building-action-modal__resource-slot" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
