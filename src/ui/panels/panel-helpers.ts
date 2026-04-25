import type { BuildingActionValidation, BuildingEffect } from '../../domain/types';

export function getBuildingActionMessageKey(validation: BuildingActionValidation) {
  return validation.reason ? `buildings.validation.${validation.reason}` : null;
}

export function getBuildingActionMessageParams(validation: BuildingActionValidation) {
  return {
    cost: validation.cost,
    level: validation.requiredDomusLevel ?? validation.targetLevel ?? 0,
  };
}

export function getBuildingEffects(
  effects: BuildingEffect[],
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (effects.length === 0) {
    return [t('buildings.noActiveEffects')];
  }

  return effects.map((effect) => {
    const effectText = t(`buildingEffects.${effect.type}`, { value: effect.value });

    return effect.perHour ? `${effectText} ${t('buildingEffects.perHour')}` : effectText;
  });
}

export function formatOdds(value: number) {
  return value.toFixed(2);
}

export function getWinChancePercent(value: number) {
  return Math.round(value * 100);
}
