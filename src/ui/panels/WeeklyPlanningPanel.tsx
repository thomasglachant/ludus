import {
  getDailyPlanBucketBudget,
  getDailyPlanBucketRemaining,
  getDailyPlanBucketTotal,
  getGladiatorPlanningStatuses,
} from '../../domain/planning/planning-actions';
import { getSelectableBuildingActivities } from '../../domain/buildings/building-activities';
import {
  projectDailyPlan,
  projectWeeklyPlan,
} from '../../domain/weekly-simulation/weekly-simulation-actions';
import type {
  BuildingActivityId,
  DailySimulationSummary,
  DailyPlanActivity,
  DailyPlanBucket,
  GameSave,
  WeeklyReport,
} from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import {
  ImpactIndicator,
  type ImpactIndicatorKind,
  type ImpactIndicatorSize,
  type ImpactIndicatorTone,
} from '../components/ImpactIndicator';
import { EmptyState, MetricList, PanelShell, SectionCard } from '../components/shared';
import { GameIcon } from '../icons/GameIcon';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface WeeklyPlanningPanelProps {
  save: GameSave;
  onAdvanceWeekStep(): void;
  onApplyRecommendations(): void;
  onClose(): void;
  onUpdateDailyPlan(input: {
    activity: DailyPlanActivity;
    bucket: DailyPlanBucket;
    dayOfWeek: GameSave['time']['dayOfWeek'];
    points: number;
  }): void;
  onUpdateBuildingActivitySelection(input: {
    activity: DailyPlanActivity;
    activityId?: BuildingActivityId;
    dayOfWeek: GameSave['time']['dayOfWeek'];
  }): void;
}

const dailyPlanGroups = [
  {
    bucket: 'gladiatorTimePoints',
    labelKey: 'weeklyPlan.buckets.gladiatorTimePoints',
    activities: ['training', 'meals', 'sleep', 'leisure', 'care'],
  },
  {
    bucket: 'laborPoints',
    labelKey: 'weeklyPlan.buckets.laborPoints',
    activities: ['production', 'security', 'maintenance'],
  },
  {
    bucket: 'adminPoints',
    labelKey: 'weeklyPlan.buckets.adminPoints',
    activities: ['contracts', 'events', 'maintenance'],
  },
] satisfies readonly {
  bucket: DailyPlanBucket;
  labelKey: string;
  activities: readonly DailyPlanActivity[];
}[];

interface ProjectionMetric {
  amount: number;
  id: string;
  inverseTone?: boolean;
  kind: ImpactIndicatorKind;
  labelKey: string;
}

interface ProjectionImpactProps {
  amount: number;
  inverseTone?: boolean;
  kind: ImpactIndicatorKind;
  label: string;
  size?: ImpactIndicatorSize;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface ProjectionMetricStripProps {
  className?: string;
  metrics: ProjectionMetric[];
  size?: ImpactIndicatorSize;
  t: Translate;
}

function getProjectionTone(amount: number, inverseTone?: boolean): ImpactIndicatorTone {
  if (amount === 0) {
    return 'neutral';
  }

  if (inverseTone) {
    return amount > 0 ? 'negative' : 'positive';
  }

  return amount > 0 ? 'positive' : 'negative';
}

function ProjectionImpact({
  amount,
  inverseTone,
  kind,
  label,
  size = 'sm',
}: ProjectionImpactProps) {
  return (
    <ImpactIndicator
      amount={amount}
      kind={kind}
      label={label}
      size={size}
      tone={getProjectionTone(amount, inverseTone)}
    />
  );
}

function ProjectionMetricStrip({ className, metrics, size = 'sm', t }: ProjectionMetricStripProps) {
  return (
    <div className={['planning-projection-strip', className].filter(Boolean).join(' ')}>
      {metrics.map((metric) => (
        <div className="planning-projection-metric" key={metric.id}>
          <span className="planning-projection-metric__label">{t(metric.labelKey)}</span>
          <ProjectionImpact
            amount={metric.amount}
            inverseTone={metric.inverseTone}
            kind={metric.kind}
            label={t(metric.labelKey)}
            size={size}
          />
        </div>
      ))}
    </div>
  );
}

function getDailyProjectionMetrics(projection: DailySimulationSummary): ProjectionMetric[] {
  return [
    {
      amount: projection.treasuryDelta,
      id: 'treasury',
      kind: 'treasury',
      labelKey: 'weeklyPlan.projection.treasury',
    },
    {
      amount: projection.happinessDelta,
      id: 'happiness',
      kind: 'morale',
      labelKey: 'weeklyPlan.projection.happiness',
    },
    {
      amount: projection.securityDelta,
      id: 'security',
      kind: 'defense',
      labelKey: 'weeklyPlan.projection.security',
    },
    {
      amount: projection.rebellionDelta,
      id: 'rebellion',
      inverseTone: true,
      kind: 'warning',
      labelKey: 'weeklyPlan.projection.rebellion',
    },
  ];
}

function getWeeklyProjectionMetrics(report: WeeklyReport): ProjectionMetric[] {
  return [
    {
      amount: report.treasuryDelta,
      id: 'treasury',
      kind: 'treasury',
      labelKey: 'weeklyPlan.projection.weekTreasury',
    },
    {
      amount: report.reputationDelta,
      id: 'reputation',
      kind: 'reputation',
      labelKey: 'weeklyPlan.projection.weekReputation',
    },
    {
      amount: report.happinessDelta,
      id: 'happiness',
      kind: 'morale',
      labelKey: 'weeklyPlan.projection.happiness',
    },
    {
      amount: report.securityDelta,
      id: 'security',
      kind: 'defense',
      labelKey: 'weeklyPlan.projection.security',
    },
    {
      amount: report.rebellionDelta,
      id: 'rebellion',
      inverseTone: true,
      kind: 'warning',
      labelKey: 'weeklyPlan.projection.weekRebellion',
    },
    {
      amount: report.injuries,
      id: 'injuries',
      inverseTone: true,
      kind: 'health',
      labelKey: 'weeklyPlan.projection.injuries',
    },
  ];
}

function getReportEventCount(report: WeeklyReport) {
  return report.days.reduce((total, day) => total + day.eventIds.length, 0);
}

function getLatestCompletedReport(save: GameSave) {
  return save.planning.reports.find((report) => !report.id.startsWith('running-'));
}

export function WeeklyPlanningPanel({
  save,
  onAdvanceWeekStep,
  onApplyRecommendations,
  onClose,
  onUpdateBuildingActivitySelection,
  onUpdateDailyPlan,
}: WeeklyPlanningPanelProps) {
  const { t } = useUiStore();
  const statuses = getGladiatorPlanningStatuses(save);
  const atRiskStatuses = statuses.filter((status) => status.gladiator.weeklyInjury);
  const weeklyProjection = projectWeeklyPlan(save);
  const latestCompletedReport =
    save.time.phase === 'report' ? getLatestCompletedReport(save) : null;
  const visibleReports = save.planning.reports.slice(0, 3);

  return (
    <PanelShell
      descriptionKey="weeklyPlan.dailyPlanDescription"
      eyebrowKey="weeklyPlan.eyebrow"
      titleKey="weeklyPlan.title"
      testId="weekly-planning-panel"
      wide
      onClose={onClose}
    >
      <div className="context-panel__actions">
        <button type="button" onClick={onAdvanceWeekStep}>
          <GameIcon name="nextDay" size={17} />
          <span>{t('weeklyPlan.resolveNextStep')}</span>
        </button>
        <button type="button" onClick={onApplyRecommendations}>
          <GameIcon name="warning" size={17} />
          <span>{t('weeklyPlan.applyRecommendations')}</span>
        </button>
      </div>
      {latestCompletedReport ? (
        <SectionCard className="weekly-report-spotlight" titleKey="weeklyPlan.finalReport.title">
          <div className="weekly-report-spotlight__header">
            <div>
              <strong>
                {t('weeklyPlan.finalReport.weekLabel', {
                  week: latestCompletedReport.week,
                  year: latestCompletedReport.year,
                })}
              </strong>
              <span>
                {t('weeklyPlan.finalReport.summary', {
                  days: latestCompletedReport.days.length,
                  events: getReportEventCount(latestCompletedReport),
                })}
              </span>
            </div>
          </div>
          <ProjectionMetricStrip
            className="planning-projection-strip--final-report"
            metrics={getWeeklyProjectionMetrics(latestCompletedReport)}
            size="md"
            t={t}
          />
          <div className="weekly-report-day-list">
            {latestCompletedReport.days.map((day) => (
              <article className="weekly-report-day" key={day.dayOfWeek}>
                <strong>{t(`days.${day.dayOfWeek}`)}</strong>
                <ProjectionMetricStrip
                  className="planning-projection-strip--report-day"
                  metrics={getDailyProjectionMetrics(day)}
                  t={t}
                />
              </article>
            ))}
          </div>
        </SectionCard>
      ) : null}
      <MetricList
        columns={3}
        items={[
          { labelKey: 'weeklyPlan.gladiators', value: statuses.length },
          { labelKey: 'weeklyPlan.alerts', value: save.planning.alerts.length },
          { labelKey: 'weeklyPlan.atRisk', value: atRiskStatuses.length },
        ]}
      />
      <SectionCard className="weekly-projection-card" titleKey="weeklyPlan.weekProjectionTitle">
        <ProjectionMetricStrip
          className="planning-projection-strip--weekly"
          metrics={getWeeklyProjectionMetrics(weeklyProjection)}
          size="md"
          t={t}
        />
      </SectionCard>
      <SectionCard className="weekly-report-section" titleKey="weeklyPlan.reports.title">
        {visibleReports.length > 0 ? (
          <div className="weekly-report-list">
            {visibleReports.map((report) => {
              const isCurrentReport =
                report.year === save.time.year && report.week === save.time.week;
              const titleKey = isCurrentReport
                ? 'weeklyPlan.reports.currentWeek'
                : 'weeklyPlan.reports.week';

              return (
                <article className="weekly-report-card" key={report.id}>
                  <div className="weekly-report-card__header">
                    <strong>
                      {t(titleKey, {
                        week: report.week,
                        year: report.year,
                      })}
                    </strong>
                    <span>
                      {t('weeklyPlan.reports.daysResolved', { count: report.days.length })}
                    </span>
                  </div>
                  <ProjectionMetricStrip
                    className="planning-projection-strip--report"
                    metrics={getWeeklyProjectionMetrics(report)}
                    t={t}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState messageKey="weeklyPlan.reports.empty" />
        )}
      </SectionCard>
      <div className="context-panel__list">
        {Object.values(save.planning.days).map((dayPlan) => {
          const projection = projectDailyPlan(save, dayPlan);

          return (
            <details
              className="planning-card planning-card--shell planning-day-card"
              key={dayPlan.dayOfWeek}
              open={dayPlan.dayOfWeek === save.time.dayOfWeek}
            >
              <summary className="planning-day-card__summary">
                <h3>{t(`days.${dayPlan.dayOfWeek}`)}</h3>
                <ProjectionMetricStrip
                  className="planning-projection-strip--daily"
                  metrics={getDailyProjectionMetrics(projection)}
                  t={t}
                />
              </summary>
              <div className="planning-controls planning-controls--macro">
                {dailyPlanGroups.map((group) => {
                  const usedPoints = getDailyPlanBucketTotal(dayPlan[group.bucket]);
                  const remainingPoints = getDailyPlanBucketRemaining(dayPlan, group.bucket);
                  const budget = getDailyPlanBucketBudget(group.bucket);

                  return (
                    <fieldset className="planning-control-group" key={group.bucket}>
                      <legend>
                        <span>{t(group.labelKey)}</span>
                        <strong>
                          {t('weeklyPlan.pointsSummary', {
                            used: usedPoints,
                            total: budget,
                          })}
                        </strong>
                      </legend>
                      <div className="planning-control-group__grid">
                        {group.activities.map((activity) => {
                          const value = dayPlan[group.bucket][activity];
                          const specializedActivities = getSelectableBuildingActivities(
                            save,
                            activity,
                          );

                          return (
                            <label key={`${group.bucket}-${activity}`}>
                              <span>{t(`weeklyPlan.activities.${activity}`)}</span>
                              <input
                                max={value + remainingPoints}
                                min={0}
                                type="number"
                                value={value}
                                onChange={(event) =>
                                  onUpdateDailyPlan({
                                    activity,
                                    bucket: group.bucket,
                                    dayOfWeek: dayPlan.dayOfWeek,
                                    points: Number(event.target.value),
                                  })
                                }
                              />
                              {specializedActivities.length > 0 ? (
                                <>
                                  <span className="planning-control-specialty-label">
                                    {t('weeklyPlan.specializedActivity')}
                                  </span>
                                  <select
                                    value={dayPlan.buildingActivitySelections?.[activity] ?? ''}
                                    onChange={(event) =>
                                      onUpdateBuildingActivitySelection({
                                        activity,
                                        activityId: event.target.value
                                          ? (event.target.value as BuildingActivityId)
                                          : undefined,
                                        dayOfWeek: dayPlan.dayOfWeek,
                                      })
                                    }
                                  >
                                    <option value="">
                                      {t('weeklyPlan.noSpecializedActivity')}
                                    </option>
                                    {specializedActivities.map((specializedActivity) => (
                                      <option
                                        key={specializedActivity.id}
                                        value={specializedActivity.id}
                                      >
                                        {t(specializedActivity.nameKey)}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
      {save.planning.alerts.length > 0 ? (
        <ul className="alert-list">
          {save.planning.alerts.slice(0, 4).map((alert) => (
            <li className={`alert-list__item alert-list__item--${alert.severity}`} key={alert.id}>
              <strong>{t(alert.titleKey)}</strong>
              <span>{t(alert.descriptionKey)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="context-panel__muted">{t('weeklyPlan.noAlerts')}</p>
      )}
      <div className="planning-card-grid">
        {statuses.map((status) => {
          const recommendedBuildingName = status.recommendation.buildingId
            ? t(BUILDING_DEFINITIONS[status.recommendation.buildingId].nameKey)
            : t('weeklyPlan.noAssignment');

          return (
            <article className="planning-card planning-card--shell" key={status.gladiator.id}>
              <div className="planning-card__header">
                <div className="context-panel__portrait-row">
                  <GladiatorPortrait gladiator={status.gladiator} size="small" />
                  <div>
                    <h3>{status.gladiator.name}</h3>
                    <p>{t(status.recommendation.reasonKey)}</p>
                  </div>
                </div>
              </div>
              <dl className="planning-projection">
                <div>
                  <dt>{t('market.stats.life')}</dt>
                  <dd>{Math.floor(status.gladiator.life)}</dd>
                </div>
                <div>
                  <dt>{t('weeklyPlan.suggestedAssignment')}</dt>
                  <dd>
                    {status.recommendation.isAvailable
                      ? recommendedBuildingName
                      : t('weeklyPlan.buildingUnavailable')}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </PanelShell>
  );
}
