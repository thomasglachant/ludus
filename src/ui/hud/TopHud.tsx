import { useEffect, useState, type CSSProperties } from 'react';
import type { DayOfWeek, GameSave, GameSpeed } from '../../domain/types';
import { PROGRESSION_CONFIG } from '../../game-data/progression';
import { DAYS_OF_WEEK, TIME_CONFIG } from '../../game-data/time';
import { useUiStore } from '../../state/ui-store-context';
import { formatMoneyAmount } from '../formatters/money';

interface TopHudProps {
  save: GameSave;
  onOpenMenu(): void;
  onSpeedChange(speed: GameSpeed): void;
  onAdvanceToNextDay(): void;
}

const TOP_HUD_ASSET_BASE_PATH = '/assets/ui/top-hud';

const TOP_HUD_SPEED_CONTROLS = [
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-pause.svg`, labelKey: 'speed.pause', speed: 0 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-play.svg`, labelKey: 'speed.x1', speed: 1 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-x2.svg`, labelKey: 'speed.x2', speed: 2 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-x4.svg`, labelKey: 'speed.x4', speed: 4 },
] as const satisfies ReadonlyArray<{
  iconPath: string;
  labelKey: string;
  speed: GameSpeed;
}>;

interface DisplayedTime {
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  minute: number;
}

interface ClockBase {
  key: string;
  startedAt: number;
  time: DisplayedTime;
}

function getControlIconStyle(iconPath: string): CSSProperties {
  return { '--control-icon': `url(${iconPath})` } as CSSProperties;
}

function formatGameClock(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function advanceDisplayedTime(time: DisplayedTime, gameMinutes: number): DisplayedTime {
  if (gameMinutes <= 0) {
    return time;
  }

  const minutesPerDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
  const currentMinuteOfDay = time.hour * TIME_CONFIG.minutesPerHour + time.minute + gameMinutes;
  const daysToAdvance = Math.floor(currentMinuteOfDay / minutesPerDay);
  const nextMinuteOfDay = currentMinuteOfDay % minutesPerDay;
  const currentDayIndex = DAYS_OF_WEEK.indexOf(time.dayOfWeek);
  let nextYear = time.year;
  let nextWeek = time.week;
  let nextDayIndex = currentDayIndex;

  for (let dayIndex = 0; dayIndex < daysToAdvance; dayIndex += 1) {
    if (DAYS_OF_WEEK[nextDayIndex] === 'sunday') {
      nextWeek += 1;

      if (nextWeek > PROGRESSION_CONFIG.weeksPerYear) {
        nextYear += 1;
        nextWeek = 1;
      }
    }

    nextDayIndex = (nextDayIndex + 1) % DAYS_OF_WEEK.length;
  }

  return {
    year: nextYear,
    week: nextWeek,
    dayOfWeek: DAYS_OF_WEEK[nextDayIndex],
    hour: Math.floor(nextMinuteOfDay / TIME_CONFIG.minutesPerHour),
    minute: nextMinuteOfDay % TIME_CONFIG.minutesPerHour,
  };
}

function useSmoothDisplayedTime(save: GameSave): DisplayedTime {
  const [now, setNow] = useState(Date.now);
  const baseKey = `${save.time.year}:${save.time.week}:${save.time.dayOfWeek}:${save.time.hour}:${save.time.minute}:${save.time.speed}:${save.time.isPaused}`;
  const currentSaveTime: DisplayedTime = {
    year: save.time.year,
    week: save.time.week,
    dayOfWeek: save.time.dayOfWeek,
    hour: save.time.hour,
    minute: save.time.minute,
  };
  const [clockBase, setClockBase] = useState<ClockBase>({
    key: baseKey,
    startedAt: now,
    time: currentSaveTime,
  });

  useEffect(() => {
    const gameMinutesPerRealMs = save.time.isPaused
      ? 0
      : (save.time.speed * TIME_CONFIG.minutesPerHour) / TIME_CONFIG.realMillisecondsPerGameHour;
    const nextBase: ClockBase = {
      key: baseKey,
      startedAt: Date.now(),
      time: {
        year: save.time.year,
        week: save.time.week,
        dayOfWeek: save.time.dayOfWeek,
        hour: save.time.hour,
        minute: save.time.minute,
      },
    };
    const syncBaseId = window.setTimeout(() => {
      setClockBase(nextBase);
      setNow(nextBase.startedAt);
    }, 0);

    if (gameMinutesPerRealMs <= 0) {
      return () => window.clearTimeout(syncBaseId);
    }

    let timeoutId: number | undefined;

    const scheduleNextMinute = () => {
      const elapsedRealMs = Date.now() - nextBase.startedAt;
      const displayedGameMinutes = Math.floor(elapsedRealMs * gameMinutesPerRealMs);
      const nextMinuteAt = nextBase.startedAt + (displayedGameMinutes + 1) / gameMinutesPerRealMs;
      const nextDelayMs = Math.max(1, Math.ceil(nextMinuteAt - Date.now()));

      timeoutId = window.setTimeout(() => {
        setNow(Date.now());
        scheduleNextMinute();
      }, nextDelayMs);
    };

    timeoutId = window.setTimeout(
      () => {
        setNow(Date.now());
        scheduleNextMinute();
      },
      Math.max(1, Math.ceil(1 / gameMinutesPerRealMs)),
    );

    return () => {
      window.clearTimeout(syncBaseId);
      window.clearTimeout(timeoutId);
    };
  }, [
    baseKey,
    save.time.dayOfWeek,
    save.time.hour,
    save.time.isPaused,
    save.time.minute,
    save.time.speed,
    save.time.week,
    save.time.year,
  ]);

  const activeBase =
    clockBase.key === baseKey
      ? clockBase
      : {
          key: baseKey,
          startedAt: now,
          time: currentSaveTime,
        };

  if (save.time.isPaused || save.time.speed === 0) {
    return activeBase.time;
  }

  const elapsedRealMs = now - activeBase.startedAt;
  const elapsedGameMinutes = Math.floor(
    (elapsedRealMs * save.time.speed * TIME_CONFIG.minutesPerHour) /
      TIME_CONFIG.realMillisecondsPerGameHour,
  );

  return advanceDisplayedTime(activeBase.time, elapsedGameMinutes);
}

export function TopHud({ onAdvanceToNextDay, onOpenMenu, onSpeedChange, save }: TopHudProps) {
  const { t } = useUiStore();
  const displayedTime = useSmoothDisplayedTime(save);
  const dayLabel = t(`days.${displayedTime.dayOfWeek}`);
  const timeLabel = formatGameClock(displayedTime.hour, displayedTime.minute);

  return (
    <header className="top-hud" data-testid="topbar">
      <div className="top-hud__brand">
        <div className="top-hud__brand-title-row">
          <img
            alt=""
            aria-hidden="true"
            className="top-hud__brand-laurel"
            src="/assets/ui/laurel-left.png"
          />
          <h1>{save.player.ludusName}</h1>
          <img
            alt=""
            aria-hidden="true"
            className="top-hud__brand-laurel top-hud__brand-laurel--right"
            src="/assets/ui/laurel-left.png"
          />
        </div>
      </div>

      <div className="top-hud__center">
        <div className="top-hud__time" data-testid="topbar-time">
          <span className="top-hud__date-lines">
            <span>{dayLabel}</span>
            <span>
              <span>{t('topBar.weekShort', { week: displayedTime.week })}</span>
              <span>{t('topBar.year', { year: displayedTime.year })}</span>
            </span>
          </span>
        </div>

        <div className="top-hud__clock" data-testid="topbar-clock">
          {timeLabel}
        </div>

        <div className="top-hud__speeds">
          {TOP_HUD_SPEED_CONTROLS.map((control) => (
            <button
              aria-label={t(control.labelKey)}
              className={save.time.speed === control.speed ? 'is-selected' : ''}
              data-testid={control.speed === 0 ? 'speed-pause' : `speed-x${control.speed}`}
              key={control.speed}
              type="button"
              onClick={() => onSpeedChange(control.speed)}
            >
              <span
                aria-hidden="true"
                className="top-hud__control-icon"
                style={getControlIconStyle(control.iconPath)}
              />
            </button>
          ))}
          <button
            aria-label={t('speed.nextDay')}
            data-testid="speed-next-day"
            type="button"
            onClick={onAdvanceToNextDay}
          >
            <span
              aria-hidden="true"
              className="top-hud__control-icon"
              style={getControlIconStyle(`${TOP_HUD_ASSET_BASE_PATH}/control-next-day.svg`)}
            />
          </button>
        </div>
      </div>

      <div className="top-hud__actions">
        <div className="top-hud__resources" aria-label={t('topBar.resources')}>
          <div className="top-hud__resource" data-testid="topbar-treasury">
            <span
              aria-hidden="true"
              className="top-hud__resource-icon top-hud__resource-icon--treasury"
              style={getControlIconStyle('/assets/ui/resource-treasury.svg')}
            />
            <span className="top-hud__resource-value">
              {formatMoneyAmount(save.ludus.treasury)}
            </span>
          </div>
          <div className="top-hud__resource" data-testid="topbar-reputation">
            <span
              aria-hidden="true"
              className="top-hud__resource-icon top-hud__resource-icon--reputation"
              style={getControlIconStyle('/assets/ui/resource-reputation.svg')}
            />
            <span className="top-hud__resource-value">{save.ludus.reputation}</span>
          </div>
        </div>

        <div className="top-hud__menu-zone">
          <button
            aria-label={t('topBar.openGameMenu')}
            className="top-hud__edit-button"
            data-testid="topbar-menu-button"
            type="button"
            onClick={onOpenMenu}
          >
            <span
              aria-hidden="true"
              className="top-hud__menu-icon"
              style={getControlIconStyle(`${TOP_HUD_ASSET_BASE_PATH}/control-edit-menu.svg`)}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
