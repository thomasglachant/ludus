import type { GameSave, GameSpeed } from '../../domain/types';
import { getTimeOfDayPhase, type TimeOfDayPhase } from '../../game-data/time-of-day';
import { useUiStore } from '../../state/ui-store-context';
import { formatMoneyAmount } from '../formatters/money';

interface TopHudProps {
  save: GameSave;
  onOpenMenu(): void;
  onSpeedChange(speed: GameSpeed): void;
}

const TOP_HUD_ASSET_BASE_PATH = '/assets/ui/top-hud';

const TIME_OF_DAY_ICON_PATHS: Record<TimeOfDayPhase, string> = {
  dawn: `${TOP_HUD_ASSET_BASE_PATH}/time-dawn.png`,
  day: `${TOP_HUD_ASSET_BASE_PATH}/time-day.png`,
  dusk: `${TOP_HUD_ASSET_BASE_PATH}/time-dusk.png`,
  night: `${TOP_HUD_ASSET_BASE_PATH}/time-night.png`,
};

const TOP_HUD_SPEED_CONTROLS = [
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-pause.png`, labelKey: 'speed.pause', speed: 0 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-play.png`, labelKey: 'speed.x1', speed: 1 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-x2.png`, labelKey: 'speed.x2', speed: 2 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-x4.png`, labelKey: 'speed.x4', speed: 4 },
  { iconPath: `${TOP_HUD_ASSET_BASE_PATH}/control-x8.png`, labelKey: 'speed.x8', speed: 8 },
] as const satisfies ReadonlyArray<{
  iconPath: string;
  labelKey: string;
  speed: GameSpeed;
}>;

export function TopHud({ onOpenMenu, onSpeedChange, save }: TopHudProps) {
  const { t } = useUiStore();
  const timeOfDayPhase = getTimeOfDayPhase(save.time.hour);
  const timeOfDayLabel = t(`timeOfDay.${timeOfDayPhase}`);

  return (
    <header className="top-hud" data-testid="topbar">
      <div className="top-hud__brand">
        <img
          alt=""
          aria-hidden="true"
          className="top-hud__crest"
          src={`${TOP_HUD_ASSET_BASE_PATH}/ludus-crest.png`}
        />
        <h1>{save.player.ludusName}</h1>
      </div>

      <div className="top-hud__center">
        <div className="top-hud__time" data-testid="topbar-time">
          <img
            alt=""
            aria-hidden="true"
            className="top-hud__phase-icon"
            src={TIME_OF_DAY_ICON_PATHS[timeOfDayPhase]}
          />
          <span className="top-hud__date-lines">
            <strong>{timeOfDayLabel}</strong>
            <span>{t(`days.${save.time.dayOfWeek}`)}</span>
            <span>
              <span>{t('topBar.week', { week: save.time.week })}</span>
              <span>{t('topBar.year', { year: save.time.year })}</span>
            </span>
          </span>
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
              <img alt="" aria-hidden="true" src={control.iconPath} />
            </button>
          ))}
        </div>
      </div>

      <div className="top-hud__actions">
        <div className="top-hud__resources" aria-label={t('topBar.resources')}>
          <div className="top-hud__resource" data-testid="topbar-treasury">
            <span
              aria-hidden="true"
              className="top-hud__resource-icon top-hud__resource-icon--treasury"
            />
            <span>{formatMoneyAmount(save.ludus.treasury)}</span>
          </div>
          <div className="top-hud__resource" data-testid="topbar-reputation">
            <span
              aria-hidden="true"
              className="top-hud__resource-icon top-hud__resource-icon--reputation"
            />
            <span>{save.ludus.reputation}</span>
          </div>
        </div>

        <button
          aria-label={t('topBar.openGameMenu')}
          className="top-hud__edit-button"
          data-testid="topbar-menu-button"
          type="button"
          onClick={onOpenMenu}
        >
          <img alt="" aria-hidden="true" src={`${TOP_HUD_ASSET_BASE_PATH}/control-edit-menu.png`} />
        </button>
      </div>
    </header>
  );
}
