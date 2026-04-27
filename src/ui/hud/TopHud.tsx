import {
  Banknote,
  ChevronRight,
  ChevronsRight,
  Menu,
  Pause,
  Play,
  Save,
  SkipForward,
  TriangleAlert,
} from 'lucide-react';
import type { GameSave, GameSpeed } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';
import { DayCycleGauge } from '../components/DayCycleGauge';
import { formatMoneyAmount } from '../formatters/money';

interface TopHudProps {
  alertCount: number;
  areAlertsOpen: boolean;
  save: GameSave;
  isSaving: boolean;
  onAlertsToggle(): void;
  onAdvanceToNextDay(): void;
  onOpenMenu(): void;
  onSave(): void;
  onSpeedChange(speed: GameSpeed): void;
}

const TOP_HUD_SPEEDS = [1, 2, 4] as const satisfies GameSpeed[];

function SpeedMultiplierIcon({ speed }: { speed: GameSpeed }) {
  if (speed === 1) {
    return <Play aria-hidden="true" size={17} />;
  }

  if (speed === 2) {
    return <ChevronsRight aria-hidden="true" size={18} />;
  }

  return (
    <span className="top-hud__speed-icon" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <ChevronRight key={index} size={15} strokeWidth={2.8} />
      ))}
    </span>
  );
}

export function TopHud({
  alertCount,
  areAlertsOpen,
  isSaving,
  onAlertsToggle,
  onAdvanceToNextDay,
  onOpenMenu,
  onSave,
  onSpeedChange,
  save,
}: TopHudProps) {
  const { t } = useUiStore();
  const playPauseLabel = save.time.speed === 0 ? t('speed.play') : t('speed.pause');

  return (
    <header className="top-hud" data-testid="topbar">
      <div className="top-hud__time" data-testid="topbar-time">
        <span className="top-hud__date-lines">
          <span>{t(`days.${save.time.dayOfWeek}`)}</span>
          <span>
            <span>{t('topBar.week', { week: save.time.week })}</span>
            <span>{t('topBar.year', { year: save.time.year })}</span>
          </span>
        </span>
        <DayCycleGauge time={save.time} />
      </div>
      <div className="top-hud__speeds">
        <button
          aria-label={playPauseLabel}
          className={save.time.speed === 0 ? 'is-selected' : ''}
          data-testid="speed-pause"
          type="button"
          onClick={() => onSpeedChange(save.time.speed === 0 ? 1 : 0)}
        >
          {save.time.speed === 0 ? (
            <Play aria-hidden="true" size={17} />
          ) : (
            <Pause aria-hidden="true" size={17} />
          )}
        </button>
        {TOP_HUD_SPEEDS.map((speed) => (
          <button
            aria-label={t(`speed.x${speed}`)}
            className={save.time.speed === speed ? 'is-selected' : ''}
            data-testid={`speed-x${speed}`}
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
          >
            <SpeedMultiplierIcon speed={speed} />
          </button>
        ))}
        <button
          aria-label={t('speed.nextDay')}
          data-testid="speed-next-day"
          type="button"
          onClick={onAdvanceToNextDay}
        >
          <SkipForward aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="top-hud__actions">
        <div className="top-hud__treasury" data-testid="topbar-treasury">
          <Banknote aria-hidden="true" size={18} />
          <span>{formatMoneyAmount(save.ludus.treasury)}</span>
        </div>
        <button
          aria-label={t('topBar.alerts', { count: alertCount })}
          aria-pressed={alertCount > 0 ? areAlertsOpen : undefined}
          className={[
            'top-hud__alert-button',
            alertCount === 0 ? 'top-hud__alert-button--muted' : '',
            areAlertsOpen ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-testid="topbar-alerts-button"
          disabled={alertCount === 0}
          type="button"
          onClick={onAlertsToggle}
        >
          <TriangleAlert aria-hidden="true" size={17} />
          {alertCount > 0 ? <strong>{alertCount}</strong> : null}
        </button>
        <button
          aria-label={t(isSaving ? 'ludus.saving' : 'common.save')}
          data-testid="topbar-save-button"
          disabled={isSaving}
          type="button"
          onClick={onSave}
        >
          <Save aria-hidden="true" size={17} />
        </button>
        <button
          aria-label={t('topBar.menu')}
          data-testid="topbar-menu-button"
          type="button"
          onClick={onOpenMenu}
        >
          <Menu aria-hidden="true" size={17} />
        </button>
      </div>
    </header>
  );
}
