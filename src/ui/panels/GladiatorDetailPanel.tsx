import { getEffectiveSkillValue } from '../../domain/gladiators/skills';
import {
  getPlanningRecommendation,
  getRoutineForGladiator,
} from '../../domain/planning/planning-actions';
import type { GameSave, Gladiator, GladiatorLocationId } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { getMapLocation } from '../../game-data/map-layout';
import { useUiStore } from '../../state/ui-store-context';
import { PanelShell } from '../components/shared';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';

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

function getLocationName(
  t: (key: string, params?: Record<string, string | number>) => string,
  locationId?: GladiatorLocationId,
) {
  if (!locationId) {
    return t('weeklyPlan.noAssignment');
  }

  const location = getMapLocation(locationId);

  return location ? t(location.nameKey) : t('weeklyPlan.noAssignment');
}

export function GladiatorDetailPanel({ save, gladiator, onClose }: GladiatorDetailPanelProps) {
  const { t } = useUiStore();
  const routine = getRoutineForGladiator(save, gladiator.id);
  const recommendation = getPlanningRecommendation(save, gladiator, routine);
  const currentLocationName = getLocationName(
    t,
    gladiator.currentLocationId ?? gladiator.currentBuildingId,
  );
  const currentAssignmentName = gladiator.mapMovement
    ? t('gladiatorPanel.movingTo', {
        location: getLocationName(t, gladiator.mapMovement.targetLocation),
      })
    : currentLocationName;
  const recommendedBuildingName = recommendation.buildingId
    ? t(BUILDING_DEFINITIONS[recommendation.buildingId].nameKey)
    : t('weeklyPlan.noAssignment');
  const currentArenaRecord = getCurrentArenaRecord(save, gladiator);
  return (
    <PanelShell eyebrowKey="gladiatorPanel.eyebrow" title={gladiator.name} onClose={onClose}>
      <GladiatorSummary gladiator={gladiator} tone="light" />

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
            {t('gladiatorPanel.planning')}
          </h2>
          <dl>
            <div>
              <dt>{t('weeklyPlan.objective')}</dt>
              <dd>{t(`weeklyPlan.objectives.${routine.objective}`)}</dd>
            </div>
            <div>
              <dt>{t('weeklyPlan.intensity')}</dt>
              <dd>{t(`weeklyPlan.intensities.${routine.intensity}`)}</dd>
            </div>
          </dl>
        </section>

        <section className="gladiator-info-panel">
          <h2>
            <GameIcon name="assignment" size={18} />
            {t('gladiatorPanel.assignment')}
          </h2>
          <dl>
            <div>
              <dt>{t('gladiatorPanel.currentAssignment')}</dt>
              <dd>{currentAssignmentName}</dd>
            </div>
            <div>
              <dt>{t('weeklyPlan.suggestedAssignment')}</dt>
              <dd>{recommendedBuildingName}</dd>
            </div>
            <div>
              <dt>{t('weeklyPlan.automaticAssignment')}</dt>
              <dd>
                {routine.allowAutomaticAssignment
                  ? t('common.enabled')
                  : t('weeklyPlan.manualOverride')}
              </dd>
            </div>
          </dl>
        </section>

        {gladiator.trainingPlan ? (
          <section className="gladiator-info-panel gladiator-info-panel--wide">
            <h2>
              <GameIcon name="training" size={18} />
              {t('gladiatorPanel.trainingPlan')}
            </h2>
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
          </section>
        ) : null}
      </div>
    </PanelShell>
  );
}
