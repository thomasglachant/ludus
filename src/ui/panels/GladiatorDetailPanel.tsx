import { calculateEffectiveReadiness } from '../../domain/planning/readiness';
import { getEffectiveSkillValue, getSkillTrainingProgress } from '../../domain/gladiators/skills';
import {
  getPlanningRecommendation,
  getRoutineForGladiator,
} from '../../domain/planning/planning-actions';
import type { GameSave, Gladiator, GladiatorLocationId } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { getMapLocation } from '../../game-data/map-layout';
import { useUiStore } from '../../state/ui-store-context';
import { PanelShell } from '../components/shared';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { GladiatorClassLine } from '../roster/GladiatorClassLine';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

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

interface SkillChipProps extends StatChipProps {
  progress: number;
}

interface ResourceMeterProps {
  iconName: Extract<GameIconName, 'energy' | 'health' | 'morale' | 'satiety'>;
  label: string;
  tone: 'health' | 'energy' | 'morale' | 'satiety';
  value: number;
}

function clampMeterValue(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function StatChip({ iconName, label, value }: StatChipProps) {
  return (
    <div className="gladiator-stat-chip">
      <GameIcon name={iconName} size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SkillChip({ iconName, label, value, progress }: SkillChipProps) {
  const { t } = useUiStore();

  return (
    <div className="gladiator-stat-chip gladiator-stat-chip--skill">
      <GameIcon name={iconName} size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
      <span
        className="gladiator-skill-progress"
        aria-label={t('gladiatorPanel.skillProgress', { progress })}
      >
        <span className="gladiator-skill-progress__value" style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}

function ResourceMeter({ iconName, label, tone, value }: ResourceMeterProps) {
  const clampedValue = clampMeterValue(value);

  return (
    <div className={`gladiator-resource-meter gladiator-resource-meter--${tone}`}>
      <div className="gladiator-resource-meter__label">
        <GameIcon name={iconName} size={18} />
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <span className="gladiator-resource-meter__track" aria-hidden="true">
        <span className="gladiator-resource-meter__value" style={{ width: `${clampedValue}%` }} />
      </span>
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
  const readiness = calculateEffectiveReadiness(save, gladiator);
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
  const bettingOdds = save.arena.betting?.odds.find((odds) => odds.gladiatorId === gladiator.id);
  const skillStats = [
    {
      iconName: 'strength' as const,
      label: t('market.stats.strength'),
      value: getEffectiveSkillValue(gladiator.strength),
      progress: getSkillTrainingProgress(gladiator.strength),
    },
    {
      iconName: 'agility' as const,
      label: t('market.stats.agility'),
      value: getEffectiveSkillValue(gladiator.agility),
      progress: getSkillTrainingProgress(gladiator.agility),
    },
    {
      iconName: 'defense' as const,
      label: t('market.stats.defense'),
      value: getEffectiveSkillValue(gladiator.defense),
      progress: getSkillTrainingProgress(gladiator.defense),
    },
  ];
  const resourceStats = [
    {
      iconName: 'health' as const,
      label: t('market.stats.health'),
      tone: 'health' as const,
      value: gladiator.health,
    },
    {
      iconName: 'energy' as const,
      label: t('market.stats.energy'),
      tone: 'energy' as const,
      value: gladiator.energy,
    },
    {
      iconName: 'morale' as const,
      label: t('market.stats.morale'),
      tone: 'morale' as const,
      value: gladiator.morale,
    },
    {
      iconName: 'satiety' as const,
      label: t('market.stats.satiety'),
      tone: 'satiety' as const,
      value: gladiator.satiety,
    },
  ];

  return (
    <PanelShell eyebrowKey="gladiatorPanel.eyebrow" title={gladiator.name} onClose={onClose}>
      <div className="gladiator-profile-card">
        <div className="gladiator-profile-card__portrait">
          <GladiatorPortrait gladiator={gladiator} size="large" />
          {gladiator.traits.length > 0 ? (
            <ul className="trait-list trait-list--featured" aria-label={t('market.traits')}>
              {gladiator.traits.map((trait) => (
                <li key={trait}>{t(`traits.${trait}`)}</li>
              ))}
            </ul>
          ) : (
            <span className="gladiator-profile-card__empty-traits">
              {t('gladiatorPanel.noTraits')}
            </span>
          )}
        </div>

        <div className="gladiator-profile-card__main">
          <div className="gladiator-profile-card__identity">
            <h2>{gladiator.name}</h2>
            <GladiatorClassLine gladiator={gladiator} showDescription showEffect />
          </div>

          <div className="gladiator-profile-card__summary">
            <StatChip
              iconName="readiness"
              label={t('weeklyPlan.readiness')}
              value={t('weeklyPlan.readinessValue', { score: readiness })}
            />
            <StatChip iconName="age" label={t('gladiatorPanel.age')} value={gladiator.age} />
            <StatChip
              iconName="reputation"
              label={t('gladiatorPanel.reputation')}
              value={gladiator.reputation}
            />
          </div>

          <section className="gladiator-profile-section">
            <h2>{t('gladiatorPanel.combatSkills')}</h2>
            <div className="gladiator-skill-grid">
              {skillStats.map((stat) => (
                <SkillChip
                  key={stat.label}
                  iconName={stat.iconName}
                  label={stat.label}
                  value={stat.value}
                  progress={stat.progress}
                />
              ))}
            </div>
          </section>

          <section className="gladiator-profile-section">
            <h2>{t('gladiatorPanel.condition')}</h2>
            <div className="gladiator-resource-grid">
              {resourceStats.map((stat) => (
                <ResourceMeter
                  key={stat.label}
                  iconName={stat.iconName}
                  label={stat.label}
                  tone={stat.tone}
                  value={stat.value}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

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
            <div>
              <dt>{t('weeklyPlan.strategy')}</dt>
              <dd>{t(`combat.strategies.${routine.combatStrategy ?? 'balanced'}`)}</dd>
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

        {bettingOdds ? (
          <section className="gladiator-info-panel">
            <h2>
              <GameIcon name="arenaIntel" size={18} />
              {t('gladiatorPanel.arenaIntel')}
            </h2>
            <dl>
              <div>
                <dt>{t('gladiatorPanel.nextOpponent')}</dt>
                <dd>{bettingOdds.opponent.name}</dd>
              </div>
              <div>
                <dt>{t('arena.rank')}</dt>
                <dd>{t(`arena.ranks.${bettingOdds.rank}`)}</dd>
              </div>
              <div>
                <dt>{t('gladiatorPanel.winChance')}</dt>
                <dd>{Math.round(bettingOdds.playerWinChance * 100)}%</dd>
              </div>
            </dl>
          </section>
        ) : null}

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
