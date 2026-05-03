import { useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import {
  getDailyPlanBucketBudget,
  getDailyPlanBucketTotal,
  isPastPlanningDay,
  validateDailyPlan,
  validateWeeklyPlanning,
} from '../../domain/planning/planning-actions';
import { getSelectableBuildingActivities } from '../../domain/buildings/building-activities';
import {
  projectDailyPlan,
  projectRemainingWeeklyPlan,
} from '../../domain/weekly-simulation/weekly-simulation-actions';
import type {
  BuildingActivityId,
  DailyPlanActivity,
  DailyPlanBucket,
  DailySimulationSummary,
  DayOfWeek,
  GameSave,
} from '../../domain/types';
import { PLANNING_ACTIVITY_DEFINITIONS } from '../../game-data/planning';
import { GAME_BALANCE } from '../../game-data/balance';
import { DAYS_OF_WEEK } from '../../game-data/time';
import { useUiStore } from '../../state/ui-store-context';
import { CTAButton } from '../components/CTAButton';
import {
  ImpactIndicator,
  type ImpactIndicatorKind,
  type ImpactIndicatorSize,
  type ImpactIndicatorTone,
} from '../components/ImpactIndicator';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface WeeklyPlanningPanelProps {
  save: GameSave;
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

type PlanningTaskDefinition = (typeof PLANNING_ACTIVITY_DEFINITIONS)[number];
type Translate = (key: string, params?: Record<string, string | number>) => string;

interface DraggedPlanningTask {
  activity: DailyPlanActivity;
  fromDay?: DayOfWeek;
  points?: number;
}

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

interface ProjectionMetricStripProps {
  metrics: ProjectionMetric[];
  size?: ImpactIndicatorSize;
  t: Translate;
}

const playableDays = DAYS_OF_WEEK.filter((dayOfWeek) => dayOfWeek !== GAME_BALANCE.arena.dayOfWeek);

const activityIcons = {
  strengthTraining: 'strength',
  agilityTraining: 'agility',
  defenseTraining: 'defense',
  lifeTraining: 'health',
  meals: 'happiness',
  sleep: 'timeNight',
  leisure: 'dice',
  care: 'health',
  production: 'hammer',
  security: 'security',
} satisfies Record<DailyPlanActivity, GameIconName>;

const planningTaskGroups = [
  {
    bucket: 'gladiatorTimePoints',
    iconName: 'training',
    labelKey: 'weeklyPlan.buckets.gladiatorTimePoints',
  },
  {
    bucket: 'laborPoints',
    iconName: 'workforce',
    labelKey: 'weeklyPlan.buckets.laborPoints',
  },
] satisfies readonly {
  bucket: DailyPlanBucket;
  iconName: GameIconName;
  labelKey: string;
}[];

function parseDraggedTask(event: DragEvent<HTMLElement>, fallback: DraggedPlanningTask | null) {
  const serializedTask = event.dataTransfer.getData('application/x-ludus-planning-task');

  if (!serializedTask) {
    return fallback;
  }

  try {
    return JSON.parse(serializedTask) as DraggedPlanningTask;
  } catch {
    return fallback;
  }
}

function getTaskStyle(task: PlanningTaskDefinition): CSSProperties & Record<string, string> {
  return {
    '--planning-task-color': task.color,
  };
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

function ProjectionMetricStrip({ metrics, size = 'sm', t }: ProjectionMetricStripProps) {
  return (
    <div className="planning-projection-strip weekly-planner-summary-strip">
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

function getRemainingProjectionMetrics(
  projection: ReturnType<typeof projectRemainingWeeklyPlan>,
): ProjectionMetric[] {
  return [
    {
      amount: projection.income,
      id: 'income',
      kind: 'treasury',
      labelKey: 'weeklyPlan.projection.weekIncome',
    },
    {
      amount: -projection.expense,
      id: 'expense',
      kind: 'treasury',
      labelKey: 'weeklyPlan.projection.weekExpense',
    },
    {
      amount: projection.net,
      id: 'net',
      kind: 'treasury',
      labelKey: 'weeklyPlan.projection.weekTreasury',
    },
    {
      amount: projection.report.reputationDelta,
      id: 'reputation',
      kind: 'reputation',
      labelKey: 'weeklyPlan.projection.weekReputation',
    },
    {
      amount: projection.report.happinessDelta,
      id: 'happiness',
      kind: 'morale',
      labelKey: 'weeklyPlan.projection.happiness',
    },
    {
      amount: projection.report.rebellionDelta,
      id: 'rebellion',
      inverseTone: true,
      kind: 'warning',
      labelKey: 'weeklyPlan.projection.weekRebellion',
    },
  ];
}

function getActivityTotals(save: GameSave, remainingDays: DayOfWeek[]) {
  return Object.fromEntries(
    PLANNING_ACTIVITY_DEFINITIONS.map((task) => [
      task.activity,
      remainingDays.reduce(
        (total, dayOfWeek) => total + save.planning.days[dayOfWeek][task.bucket][task.activity],
        0,
      ),
    ]),
  ) as Record<PlanningTaskDefinition['activity'], number>;
}

export function WeeklyPlanningPanel({
  save,
  onClose,
  onUpdateBuildingActivitySelection,
  onUpdateDailyPlan,
}: WeeklyPlanningPanelProps) {
  const { t } = useUiStore();
  const weeklyValidation = validateWeeklyPlanning(save);
  const remainingProjection = projectRemainingWeeklyPlan(save);
  const visibleTaskGroups = planningTaskGroups.filter(
    (group) => getDailyPlanBucketBudget(save, group.bucket) > 0,
  );
  const activityTotals = useMemo(
    () => getActivityTotals(save, weeklyValidation.remainingDays),
    [save, weeklyValidation.remainingDays],
  );
  const firstEditableDay = weeklyValidation.remainingDays[0] ?? 'monday';
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(firstEditableDay);
  const [draggedTask, setDraggedTask] = useState<DraggedPlanningTask | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [isPaletteDropTarget, setIsPaletteDropTarget] = useState(false);
  const activeDay = weeklyValidation.remainingDays.includes(selectedDay)
    ? selectedDay
    : firstEditableDay;

  const taskByActivity = (activity: DailyPlanActivity) =>
    PLANNING_ACTIVITY_DEFINITIONS.find((task) => task.activity === activity);

  const changeTaskPoints = (dayOfWeek: DayOfWeek, task: PlanningTaskDefinition, points: number) => {
    onUpdateDailyPlan({
      activity: task.activity,
      bucket: task.bucket,
      dayOfWeek,
      points,
    });
  };

  const addTaskPoints = (dayOfWeek: DayOfWeek, task: PlanningTaskDefinition) => {
    if (isPastPlanningDay(save, dayOfWeek) || dayOfWeek === GAME_BALANCE.arena.dayOfWeek) {
      return;
    }

    const currentPoints = save.planning.days[dayOfWeek][task.bucket][task.activity];
    changeTaskPoints(dayOfWeek, task, currentPoints + task.defaultPoints);
    setSelectedDay(dayOfWeek);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, dayOfWeek: DayOfWeek) => {
    event.preventDefault();
    setDragOverDay(null);

    const dragged = parseDraggedTask(event, draggedTask);
    const task = dragged ? taskByActivity(dragged.activity) : undefined;

    if (!task) {
      return;
    }

    if (dragged?.fromDay) {
      const movedPoints = Math.max(0, dragged.points ?? 0);

      if (movedPoints <= 0) {
        return;
      }

      if (dragged.fromDay === dayOfWeek) {
        setSelectedDay(dayOfWeek);
        return;
      }

      changeTaskPoints(dragged.fromDay, task, 0);

      const currentPoints = save.planning.days[dayOfWeek][task.bucket][task.activity];
      changeTaskPoints(dayOfWeek, task, currentPoints + movedPoints);

      setSelectedDay(dayOfWeek);
      return;
    }

    addTaskPoints(dayOfWeek, task);
  };

  const handlePaletteDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsPaletteDropTarget(false);

    const dragged = parseDraggedTask(event, draggedTask);
    const task = dragged ? taskByActivity(dragged.activity) : undefined;

    if (!task || !dragged?.fromDay) {
      return;
    }

    changeTaskPoints(dragged.fromDay, task, 0);
  };

  return (
    <section className="weekly-planner" data-testid="weekly-planning-panel">
      <header className="weekly-planner__hero">
        <div className="weekly-planner__hero-copy">
          <h2>{t('weeklyPlan.manualTitle')}</h2>
          <p>{t('weeklyPlan.manualDescription')}</p>
        </div>
        <div className="weekly-planner__hero-actions">
          <div className="weekly-planner__status-chip">
            <GameIcon name={weeklyValidation.isComplete ? 'check' : 'alert'} size={18} />
            <span>
              {weeklyValidation.isComplete
                ? t('weeklyPlan.validation.ready')
                : t('weeklyPlan.validation.incomplete', {
                    days: weeklyValidation.incompleteDayCount,
                    points: weeklyValidation.missingPoints,
                  })}
            </span>
          </div>
          <CTAButton
            disabled={!weeklyValidation.isComplete}
            onClick={() => {
              onClose();
            }}
          >
            <GameIcon name="play" size={18} />
            <span>{t('weeklyPlan.validateAndStart')}</span>
          </CTAButton>
        </div>
      </header>

      <section className="weekly-planner__summary" aria-label={t('weeklyPlan.weekProjectionTitle')}>
        <div className="weekly-planner__summary-heading">
          <div>
            <strong>
              {t('weeklyPlan.remainingWeekTitle', {
                days: weeklyValidation.remainingDays.length,
                week: save.time.week,
                year: save.time.year,
              })}
            </strong>
          </div>
        </div>
        <ProjectionMetricStrip
          metrics={getRemainingProjectionMetrics(remainingProjection)}
          size="md"
          t={t}
        />
        <div className="weekly-planner__activity-totals">
          {PLANNING_ACTIVITY_DEFINITIONS.map((task) => (
            <span
              className="weekly-planner__activity-total"
              key={task.activity}
              style={getTaskStyle(task)}
            >
              <GameIcon name={activityIcons[task.activity]} size={15} />
              <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
              <strong>{formatNumber(activityTotals[task.activity])}</strong>
            </span>
          ))}
        </div>
      </section>

      <div className="weekly-planner__workspace">
        <aside
          className={[
            'weekly-planner__palette',
            isPaletteDropTarget ? 'weekly-planner__palette--drop-target' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={t('weeklyPlan.paletteTitle')}
          onDragLeave={() => setIsPaletteDropTarget(false)}
          onDragOver={(event) => {
            if (draggedTask?.fromDay) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setIsPaletteDropTarget(true);
            }
          }}
          onDrop={handlePaletteDrop}
        >
          {visibleTaskGroups.map((group) => {
            const tasks = PLANNING_ACTIVITY_DEFINITIONS.filter(
              (task) => task.bucket === group.bucket,
            );
            const budget = getDailyPlanBucketBudget(save, group.bucket);

            return (
              <section className="weekly-planner__task-group" key={group.bucket}>
                <header>
                  <GameIcon name={group.iconName} size={18} />
                  <strong>{t(group.labelKey)}</strong>
                  <span>{t('weeklyPlan.pointsPerDay', { points: budget })}</span>
                </header>
                <div className="weekly-planner__task-list">
                  {tasks.map((task) => (
                    <button
                      className="weekly-planner__task-card"
                      draggable
                      key={task.activity}
                      style={getTaskStyle(task)}
                      type="button"
                      onClick={() => addTaskPoints(activeDay, task)}
                      onDragEnd={() => setDraggedTask(null)}
                      onDragStart={(event) => {
                        const payload: DraggedPlanningTask = { activity: task.activity };

                        event.dataTransfer.setData(
                          'application/x-ludus-planning-task',
                          JSON.stringify(payload),
                        );
                        event.dataTransfer.effectAllowed = 'copy';
                        setDraggedTask(payload);
                      }}
                    >
                      <GameIcon name={activityIcons[task.activity]} size={20} />
                      <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
                      <strong>{t('weeklyPlan.taskCost', { points: task.defaultPoints })}</strong>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </aside>

        <div className="weekly-planner__days" aria-label={t('weeklyPlan.daysGridLabel')}>
          {playableDays.map((dayOfWeek) => {
            const dayPlan = save.planning.days[dayOfWeek];
            const dayValidation = validateDailyPlan(save, dayPlan);
            const dayProjection = projectDailyPlan(save, dayPlan);
            const isPast = dayValidation.isPast;
            const isSelected = activeDay === dayOfWeek;
            const isDropTarget = dragOverDay === dayOfWeek && !isPast;

            return (
              <article
                className={[
                  'weekly-planner__day',
                  isPast ? 'weekly-planner__day--past' : null,
                  isSelected ? 'weekly-planner__day--selected' : null,
                  isDropTarget ? 'weekly-planner__day--drop-target' : null,
                  dayValidation.isComplete
                    ? 'weekly-planner__day--complete'
                    : 'weekly-planner__day--incomplete',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={dayOfWeek}
                onClick={() => {
                  if (!isPast) {
                    setSelectedDay(dayOfWeek);
                  }
                }}
                onDragLeave={() => setDragOverDay(null)}
                onDragOver={(event) => {
                  if (!isPast) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = draggedTask?.fromDay ? 'move' : 'copy';
                    setDragOverDay(dayOfWeek);
                  }
                }}
                onDrop={(event) => handleDrop(event, dayOfWeek)}
              >
                <header className="weekly-planner__day-header">
                  <div>
                    {isPast ? <span>{t('weeklyPlan.dayPassed')}</span> : null}
                    <h3>{t(`days.${dayOfWeek}`)}</h3>
                  </div>
                  <GameIcon name={dayValidation.isComplete ? 'check' : 'alert'} size={18} />
                </header>

                <ProjectionMetricStrip metrics={getDailyProjectionMetrics(dayProjection)} t={t} />

                <div className="weekly-planner__constraints">
                  {dayValidation.buckets.flatMap((bucketValidation) =>
                    bucketValidation.constraints
                      .filter((constraint) => !constraint.isSatisfied)
                      .map((constraint) => (
                        <div
                          className={[
                            'weekly-planner__constraint',
                            constraint.isSatisfied ? null : 'weekly-planner__constraint--invalid',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          key={`${dayOfWeek}-${constraint.activity}`}
                        >
                          <GameIcon name={activityIcons[constraint.activity]} size={15} />
                          <span>
                            {t('weeklyPlan.constraintRange', {
                              activity: t(`weeklyPlan.activities.${constraint.activity}`),
                              current: constraint.points,
                              max: constraint.maximum,
                              min: constraint.minimum,
                            })}
                          </span>
                        </div>
                      )),
                  )}
                </div>

                <div className="weekly-planner__day-buckets">
                  {visibleTaskGroups.map((group) => {
                    const bucketValidation = dayValidation.buckets.find(
                      (bucket) => bucket.bucket === group.bucket,
                    );
                    const budget = bucketValidation?.budget ?? 0;
                    const used = getDailyPlanBucketTotal(dayPlan[group.bucket]);
                    const progress = budget === 0 ? 100 : Math.min(100, (used / budget) * 100);
                    const bucketTasks = PLANNING_ACTIVITY_DEFINITIONS.filter(
                      (task) =>
                        task.bucket === group.bucket && dayPlan[task.bucket][task.activity] > 0,
                    );

                    return (
                      <section className="weekly-planner__bucket" key={group.bucket}>
                        <header>
                          <span>{t(group.labelKey)}</span>
                          <strong>
                            {t('weeklyPlan.pointsSummary', {
                              total: budget,
                              used,
                            })}
                          </strong>
                        </header>
                        <div className="weekly-planner__bucket-track">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className="weekly-planner__assignments">
                          {bucketTasks.length === 0 ? (
                            <div className="weekly-planner__empty-bucket">
                              <GameIcon name="assignment" size={16} />
                              <span>{t('weeklyPlan.emptyBucketHint')}</span>
                            </div>
                          ) : null}
                          {bucketTasks.map((task) => {
                            const value = dayPlan[task.bucket][task.activity];
                            const unitCount = Math.floor(value / task.defaultPoints);
                            const specializedActivities = getSelectableBuildingActivities(
                              save,
                              task.activity,
                            );

                            return (
                              <div
                                className="weekly-planner__assignment"
                                draggable={!isPast && value > 0}
                                key={`${dayOfWeek}-${task.activity}`}
                                style={getTaskStyle(task)}
                                onDragEnd={() => setDraggedTask(null)}
                                onDragStart={(event) => {
                                  const payload: DraggedPlanningTask = {
                                    activity: task.activity,
                                    fromDay: dayOfWeek,
                                    points: value,
                                  };

                                  event.dataTransfer.setData(
                                    'application/x-ludus-planning-task',
                                    JSON.stringify(payload),
                                  );
                                  event.dataTransfer.effectAllowed = 'move';
                                  setDraggedTask(payload);
                                }}
                              >
                                <div className="weekly-planner__assignment-label">
                                  <GameIcon name={activityIcons[task.activity]} size={17} />
                                  <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
                                </div>
                                <div className="weekly-planner__assignment-controls">
                                  <button
                                    aria-label={t('weeklyPlan.decreaseTask', {
                                      activity: t(`weeklyPlan.activities.${task.activity}`),
                                    })}
                                    disabled={isPast || value <= 0}
                                    type="button"
                                    onClick={() =>
                                      changeTaskPoints(dayOfWeek, task, value - task.defaultPoints)
                                    }
                                  >
                                    -
                                  </button>
                                  <strong className="weekly-planner__assignment-points">
                                    {formatNumber(unitCount)}
                                  </strong>
                                  <button
                                    aria-label={t('weeklyPlan.increaseTask', {
                                      activity: t(`weeklyPlan.activities.${task.activity}`),
                                    })}
                                    disabled={isPast}
                                    type="button"
                                    onClick={() => addTaskPoints(dayOfWeek, task)}
                                  >
                                    +
                                  </button>
                                </div>
                                {specializedActivities.length > 0 ? (
                                  <label className="weekly-planner__specialty">
                                    <span>{t('weeklyPlan.specializedActivity')}</span>
                                    <select
                                      disabled={isPast}
                                      value={
                                        dayPlan.buildingActivitySelections?.[task.activity] ?? ''
                                      }
                                      onChange={(event) =>
                                        onUpdateBuildingActivitySelection({
                                          activity: task.activity,
                                          activityId: event.target.value
                                            ? (event.target.value as BuildingActivityId)
                                            : undefined,
                                          dayOfWeek,
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
                                  </label>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}

          <article className="weekly-planner__day weekly-planner__day--arena">
            <header className="weekly-planner__day-header">
              <div>
                <span>{t('weeklyPlan.arenaDayEyebrow')}</span>
                <h3>{t('days.sunday')}</h3>
              </div>
              <GameIcon name="victory" size={18} />
            </header>
            <p>{t('weeklyPlan.arenaDayDescription')}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
