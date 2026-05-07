import './planning.css';
import { useMemo, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import {
  getAvailablePlanningActivityDefinitions,
  getDailyPlanBucketBudget,
  getDailyPlanBucketTotal,
  isPastPlanningDay,
  validateDailyPlan,
  validateWeeklyPlanning,
} from '@/domain/planning/planning-actions';
import { getSelectableBuildingActivities } from '@/domain/buildings/building-activities';
import {
  projectDailyPlan,
  projectRemainingWeeklyPlan,
} from '@/domain/weekly-simulation/weekly-simulation-actions';
import type {
  BuildingActivityId,
  DailyPlanActivity,
  DailyPlanBucket,
  DailySimulationSummary,
  DayOfWeek,
  GameSave,
} from '@/domain/types';
import type { PlanningActivityDefinition } from '@/game-data/planning';
import { GAME_BALANCE } from '@/game-data/balance';
import { DAYS_OF_WEEK } from '@/game-data/time';
import { useUiStore } from '@/state/ui-store-context';
import { InfoHoverCard } from '@/ui/shared/components/InfoHoverCard';
import { ImpactList, type ImpactListItem } from '@/ui/shared/components/ImpactList';
import {
  ImpactIndicator,
  type ImpactIndicatorKind,
  type ImpactIndicatorSize,
  type ImpactIndicatorTone,
} from '@/ui/shared/components/ImpactIndicator';
import { formatNumber } from '@/ui/shared/formatters/number';
import { GameEmptyState, GameInlineHint } from '@/ui/shared/ludus/GameFeedback';
import { GameScrollArea } from '@/ui/shared/ludus/GameCard';
import { DarkPanel, LightPanel } from '@/ui/shared/ludus/GamePanel';
import { Button } from '@/ui/shared/ludus/Button';
import { GameProgress } from '@/ui/shared/ludus/GameProgress';
import { SelectField } from '@/ui/shared/ludus/SelectField';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

interface WeeklyPlanningPanelProps {
  save: GameSave;
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

type PlanningTaskDefinition = PlanningActivityDefinition;
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

const planningTaskDragMimeType = 'application/x-ludus-planning-task';
const playableDays = DAYS_OF_WEEK.filter((dayOfWeek) => dayOfWeek !== GAME_BALANCE.arena.dayOfWeek);

const activityIcons: Partial<Record<DailyPlanActivity, GameIconName>> = {
  training: 'training',
  meals: 'happiness',
  sleep: 'energy',
};

function getActivityIcon(activity: DailyPlanActivity): GameIconName {
  return activityIcons[activity] ?? 'assignment';
}

const planningTaskGroups = [
  {
    bucket: 'gladiatorTimePoints',
    iconName: 'training',
    labelKey: 'weeklyPlan.buckets.gladiatorTimePoints',
  },
] satisfies readonly {
  bucket: DailyPlanBucket;
  iconName: GameIconName;
  labelKey: string;
}[];

function parseDraggedTask(event: DragEvent<HTMLElement>, fallback: DraggedPlanningTask | null) {
  const serializedTask =
    event.dataTransfer.getData(planningTaskDragMimeType) ||
    event.dataTransfer.getData('text/plain');

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

function getTaskImpactItems(task: PlanningTaskDefinition, t: Translate): ImpactListItem[] {
  return task.impacts.map((impact) => ({
    amount: impact.amount * task.defaultPoints,
    id: `${task.activity}-${impact.labelKey}`,
    kind: impact.kind,
    label: t(impact.labelKey),
    size: 'sm',
  }));
}

function TaskImpactPopover({ task, t }: { task: PlanningTaskDefinition; t: Translate }) {
  const impacts = getTaskImpactItems(task, t);

  if (impacts.length === 0) {
    return null;
  }

  return (
    <InfoHoverCard
      title={t('weeklyPlan.taskImpactsTitle')}
      trigger={
        <span
          aria-label={t('weeklyPlan.taskImpactsTitle')}
          className="weekly-planner__task-impact-popover"
          tabIndex={0}
        >
          <GameIcon name="view" size={14} />
        </span>
      }
    >
      <ImpactList impacts={impacts} size="sm" />
    </InfoHoverCard>
  );
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

function getActivityTotals(
  save: GameSave,
  remainingDays: DayOfWeek[],
  tasks: PlanningTaskDefinition[],
) {
  return Object.fromEntries(
    tasks.map((task) => [
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
  onUpdateBuildingActivitySelection,
  onUpdateDailyPlan,
}: WeeklyPlanningPanelProps) {
  const { t } = useUiStore();
  const weeklyValidation = validateWeeklyPlanning(save);
  const remainingProjection = projectRemainingWeeklyPlan(save);
  const availableTasks = useMemo(() => getAvailablePlanningActivityDefinitions(save), [save]);
  const visibleTaskGroups = planningTaskGroups.filter(
    (group) =>
      weeklyValidation.remainingDays.some(
        (dayOfWeek) =>
          getDailyPlanBucketBudget(save, group.bucket, {
            year: save.planning.year,
            week: save.planning.week,
            dayOfWeek,
          }) > 0,
      ) && availableTasks.some((task) => task.bucket === group.bucket),
  );
  const activityTotals = getActivityTotals(save, weeklyValidation.remainingDays, availableTasks);
  const firstEditableDay = weeklyValidation.remainingDays[0] ?? 'monday';
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(firstEditableDay);
  const [draggedTask, setDraggedTask] = useState<DraggedPlanningTask | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [isPaletteDropTarget, setIsPaletteDropTarget] = useState(false);
  const activeDay = weeklyValidation.remainingDays.includes(selectedDay)
    ? selectedDay
    : firstEditableDay;

  const taskByActivity = (activity: DailyPlanActivity) =>
    availableTasks.find((task) => task.activity === activity);

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

  const startTaskDrag = (
    event: DragEvent<HTMLElement>,
    payload: DraggedPlanningTask,
    effectAllowed: DataTransfer['effectAllowed'],
  ) => {
    const serializedPayload = JSON.stringify(payload);

    event.dataTransfer.setData(planningTaskDragMimeType, serializedPayload);
    event.dataTransfer.setData('text/plain', serializedPayload);
    event.dataTransfer.effectAllowed = effectAllowed;
    setDraggedTask(payload);
  };

  const handleTaskCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    task: PlanningTaskDefinition,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    addTaskPoints(activeDay, task);
  };

  return (
    <section className="weekly-planner" data-testid="weekly-planning-panel">
      <LightPanel
        as="section"
        className="weekly-planner__summary"
        density="compact"
        aria-label={t('weeklyPlan.weekProjectionTitle')}
      >
        <div className="weekly-planner__summary-heading">
          <div>
            <strong>
              {t('weeklyPlan.remainingWeekTitle', {
                days: weeklyValidation.remainingDays.length,
                week: save.time.week,
                year: save.time.year,
              })}
            </strong>
            <span className="weekly-planner__status-chip">
              <GameIcon name={weeklyValidation.isComplete ? 'check' : 'alert'} size={18} />
              <span>
                {weeklyValidation.isComplete
                  ? t('weeklyPlan.validation.ready')
                  : t('weeklyPlan.validation.incomplete', {
                      days: weeklyValidation.incompleteDayCount,
                      points: weeklyValidation.missingPoints,
                    })}
              </span>
            </span>
          </div>
        </div>
        <ProjectionMetricStrip
          metrics={getRemainingProjectionMetrics(remainingProjection)}
          size="md"
          t={t}
        />
        <div className="weekly-planner__activity-totals">
          {availableTasks.map((task) => (
            <span
              className="weekly-planner__activity-total"
              key={task.activity}
              style={getTaskStyle(task)}
            >
              <GameIcon name={getActivityIcon(task.activity)} size={15} />
              <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
              <strong>{formatNumber(activityTotals[task.activity])}</strong>
            </span>
          ))}
        </div>
      </LightPanel>

      <div className="weekly-planner__workspace">
        <LightPanel
          as="aside"
          className={[
            'weekly-planner__palette',
            'game-scroll-area',
            isPaletteDropTarget ? 'weekly-planner__palette--drop-target' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          density="compact"
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
          {visibleTaskGroups.length === 0 ? (
            <GameEmptyState
              className="weekly-planner__empty-palette"
              density="compact"
              iconName="assignment"
              messageKey="weeklyPlan.emptyPalette"
            />
          ) : null}
          {visibleTaskGroups.map((group) => {
            const tasks = availableTasks.filter((task) => task.bucket === group.bucket);
            const budget = getDailyPlanBucketBudget(save, group.bucket, {
              year: save.planning.year,
              week: save.planning.week,
              dayOfWeek: activeDay,
            });

            return (
              <LightPanel
                as="section"
                className="weekly-planner__task-group"
                density="compact"
                key={group.bucket}
              >
                <header>
                  <GameIcon name={group.iconName} size={18} />
                  <strong>{t(group.labelKey)}</strong>
                  <span>{t('weeklyPlan.pointsPerDay', { points: budget })}</span>
                </header>
                <div className="weekly-planner__task-list">
                  {tasks.map((task) => (
                    <div className="weekly-planner__task-card-wrap" key={task.activity}>
                      <LightPanel
                        as="div"
                        aria-label={t(`weeklyPlan.activities.${task.activity}`)}
                        className="weekly-planner__task-card"
                        density="compact"
                        draggable
                        role="button"
                        style={getTaskStyle(task)}
                        tabIndex={0}
                        onClick={() => addTaskPoints(activeDay, task)}
                        onDragEnd={() => setDraggedTask(null)}
                        onDragStart={(event) => {
                          startTaskDrag(event, { activity: task.activity }, 'copy');
                        }}
                        onKeyDown={(event) => handleTaskCardKeyDown(event, task)}
                      >
                        <GameIcon name={getActivityIcon(task.activity)} size={20} />
                        <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
                        <strong>{t('weeklyPlan.taskCost', { points: task.defaultPoints })}</strong>
                      </LightPanel>
                      <TaskImpactPopover task={task} t={t} />
                    </div>
                  ))}
                </div>
              </LightPanel>
            );
          })}
        </LightPanel>

        <GameScrollArea className="weekly-planner__days" aria-label={t('weeklyPlan.daysGridLabel')}>
          {playableDays.map((dayOfWeek) => {
            const dayPlan = save.planning.days[dayOfWeek];
            const dayValidation = validateDailyPlan(save, dayPlan);
            const dayProjection = projectDailyPlan(save, dayPlan);
            const isPast = dayValidation.isPast;
            const isSelected = activeDay === dayOfWeek;
            const isDropTarget = dragOverDay === dayOfWeek && !isPast;

            return (
              <LightPanel
                as="article"
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
                density="compact"
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
                          <GameIcon name={getActivityIcon(constraint.activity)} size={15} />
                          <span>
                            {constraint.maximum === undefined
                              ? t('weeklyPlan.constraintMinimum', {
                                  activity: t(`weeklyPlan.activities.${constraint.activity}`),
                                  current: constraint.points,
                                  min: constraint.minimum,
                                })
                              : t('weeklyPlan.constraintRange', {
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
                    const ignored = bucketValidation?.ignored ?? 0;
                    const used = getDailyPlanBucketTotal(dayPlan[group.bucket]);
                    const progress = budget === 0 ? 100 : Math.min(100, (used / budget) * 100);
                    const bucketTasks = availableTasks.filter(
                      (task) =>
                        task.bucket === group.bucket && dayPlan[task.bucket][task.activity] > 0,
                    );

                    return (
                      <LightPanel
                        as="section"
                        className="weekly-planner__bucket"
                        density="compact"
                        key={group.bucket}
                      >
                        <header>
                          <span>{t(group.labelKey)}</span>
                          <strong>
                            {t('weeklyPlan.pointsSummary', {
                              total: budget,
                              used,
                            })}
                          </strong>
                        </header>
                        {ignored > 0 ? (
                          <div className="weekly-planner__constraint weekly-planner__constraint--invalid">
                            <GameIcon name="warning" size={15} />
                            <span>{t('weeklyPlan.ignoredPoints', { points: ignored })}</span>
                          </div>
                        ) : null}
                        <GameProgress
                          className="weekly-planner__bucket-track"
                          indicatorClassName="weekly-planner__bucket-progress"
                          label={t('weeklyPlan.pointsSummary', {
                            total: budget,
                            used,
                          })}
                          value={progress}
                        />
                        <div className="weekly-planner__assignments">
                          {bucketTasks.length === 0 ? (
                            <GameInlineHint
                              className="weekly-planner__empty-bucket"
                              messageKey="weeklyPlan.emptyBucketHint"
                              surface="plain"
                            />
                          ) : null}
                          {bucketTasks.map((task) => {
                            const value = dayPlan[task.bucket][task.activity];
                            const unitCount = Math.floor(value / task.defaultPoints);
                            const specializedActivities = getSelectableBuildingActivities(
                              save,
                              task.activity,
                            );

                            return (
                              <LightPanel
                                as="div"
                                className="weekly-planner__assignment"
                                density="compact"
                                draggable={!isPast && value > 0}
                                key={`${dayOfWeek}-${task.activity}`}
                                style={getTaskStyle(task)}
                                onDragEnd={() => setDraggedTask(null)}
                                onDragStart={(event) => {
                                  startTaskDrag(
                                    event,
                                    {
                                      activity: task.activity,
                                      fromDay: dayOfWeek,
                                      points: value,
                                    },
                                    'move',
                                  );
                                }}
                              >
                                <div className="weekly-planner__assignment-label">
                                  <GameIcon name={getActivityIcon(task.activity)} size={17} />
                                  <span>{t(`weeklyPlan.activities.${task.activity}`)}</span>
                                </div>
                                <div className="weekly-planner__assignment-controls">
                                  <Button
                                    aria-label={t('weeklyPlan.decreaseTask', {
                                      activity: t(`weeklyPlan.activities.${task.activity}`),
                                    })}
                                    density="compact"
                                    disabled={isPast || value <= 0}
                                    size="icon"
                                    style={{ height: 'auto', minHeight: 30, width: '100%' }}
                                    variant="secondary"
                                    type="button"
                                    onClick={() =>
                                      changeTaskPoints(dayOfWeek, task, value - task.defaultPoints)
                                    }
                                  >
                                    -
                                  </Button>
                                  <strong className="weekly-planner__assignment-points">
                                    {formatNumber(unitCount)}
                                  </strong>
                                  <Button
                                    aria-label={t('weeklyPlan.increaseTask', {
                                      activity: t(`weeklyPlan.activities.${task.activity}`),
                                    })}
                                    density="compact"
                                    disabled={isPast}
                                    size="icon"
                                    style={{ height: 'auto', minHeight: 30, width: '100%' }}
                                    variant="secondary"
                                    type="button"
                                    onClick={() => addTaskPoints(dayOfWeek, task)}
                                  >
                                    +
                                  </Button>
                                </div>
                                {specializedActivities.length > 0 ? (
                                  <label className="weekly-planner__specialty">
                                    <span>{t('weeklyPlan.specializedActivity')}</span>
                                    <SelectField
                                      ariaLabel={t('weeklyPlan.specializedActivity')}
                                      disabled={isPast}
                                      options={[
                                        {
                                          label: t('weeklyPlan.noSpecializedActivity'),
                                          value: '',
                                        },
                                        ...specializedActivities.map((specializedActivity) => ({
                                          label: t(specializedActivity.nameKey),
                                          value: specializedActivity.id,
                                        })),
                                      ]}
                                      value={
                                        dayPlan.buildingActivitySelections?.[task.activity] ?? ''
                                      }
                                      onValueChange={(value) =>
                                        onUpdateBuildingActivitySelection({
                                          activity: task.activity,
                                          activityId: value
                                            ? (value as BuildingActivityId)
                                            : undefined,
                                          dayOfWeek,
                                        })
                                      }
                                    />
                                  </label>
                                ) : null}
                                <TaskImpactPopover task={task} t={t} />
                              </LightPanel>
                            );
                          })}
                        </div>
                      </LightPanel>
                    );
                  })}
                </div>
              </LightPanel>
            );
          })}

          <DarkPanel
            as="article"
            className="weekly-planner__day weekly-planner__day--arena"
            density="compact"
          >
            <header className="weekly-planner__day-header">
              <div>
                <span>{t('weeklyPlan.arenaDayEyebrow')}</span>
                <h3>{t('days.sunday')}</h3>
              </div>
              <GameIcon name="victory" size={18} />
            </header>
            <p>{t('weeklyPlan.arenaDayDescription')}</p>
          </DarkPanel>
        </GameScrollArea>
      </div>
    </section>
  );
}
