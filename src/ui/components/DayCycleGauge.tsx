import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from 'lucide-react';
import type { GameTimeState } from '../../domain/time/types';
import type { TimeOfDayPhase } from '../../game-data/time-of-day';
import { useUiStore } from '../../state/ui-store';
import { getDayCycleViewModel } from '../view-models/day-cycle-view-model';

interface DayCycleGaugeProps {
  className?: string;
  size?: 'default' | 'compact';
  time: Pick<GameTimeState, 'hour' | 'minute'>;
}

const TIME_OF_DAY_ICONS: Record<TimeOfDayPhase, LucideIcon> = {
  dawn: Sunrise,
  day: Sun,
  dusk: Sunset,
  night: Moon,
};

export function DayCycleGauge({ className, size = 'default', time }: DayCycleGaugeProps) {
  const { t } = useUiStore();
  const viewModel = getDayCycleViewModel(time);
  const PhaseIcon = TIME_OF_DAY_ICONS[viewModel.phase];
  const phaseLabel = t(`timeOfDay.${viewModel.phase}`);
  const classes = [
    'day-cycle-gauge',
    size === 'compact' ? 'day-cycle-gauge--compact' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      aria-label={t('timeOfDay.cycleLabel', { phase: phaseLabel })}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(viewModel.progressPercent)}
      aria-valuetext={phaseLabel}
      className={classes}
      data-testid="day-cycle-gauge"
      role="meter"
    >
      <div className="day-cycle-gauge__status">
        <PhaseIcon aria-hidden="true" size={16} />
        <span>{phaseLabel}</span>
      </div>
      <div className="day-cycle-gauge__track" aria-hidden="true">
        {viewModel.segments.map((segment) => (
          <span
            className={`day-cycle-gauge__segment day-cycle-gauge__segment--${segment.phase}`}
            key={segment.phase}
            style={{ width: `${segment.widthPercent}%` }}
          />
        ))}
        <span
          className={`day-cycle-gauge__marker day-cycle-gauge__marker--${viewModel.phase}`}
          style={{ left: `${viewModel.progressPercent}%` }}
        >
          <PhaseIcon aria-hidden="true" size={12} strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}
