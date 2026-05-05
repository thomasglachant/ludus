import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { GaugeStatBar } from '../components/GaugeStatBar';
import { Tooltip } from '../components/Tooltip';
import { formatMoneyAmount } from '../formatters/money';
import { formatNumber } from '../formatters/number';
import { RomanButton } from '../game/RomanButton';
import { GameIcon } from '../icons/GameIcon';

interface TopHudProps {
  clockLabel: string;
  isPaused: boolean;
  isTimeControlLocked: boolean;
  save: GameSave;
  onOpenDomus(): void;
  onOpenFinance(): void;
  onOpenMenu(): void;
  onTogglePause(): void;
}

const TOP_HUD_RESOURCE_ICON_SIZE = 24;

export function TopHud({
  clockLabel,
  isPaused,
  isTimeControlLocked,
  onOpenDomus,
  onOpenFinance,
  onOpenMenu,
  onTogglePause,
  save,
}: TopHudProps) {
  const { t } = useUiStore();
  const dayLabel = t(`days.${save.time.dayOfWeek}`);
  const happinessPercent = Math.round(Math.min(100, Math.max(0, save.ludus.happiness)));
  const domusLevel = save.buildings.domus.level;

  return (
    <header className="top-hud" data-testid="topbar">
      <div className="top-hud__brand">
        <RomanButton
          className="top-hud__ludus-card"
          tone="ghost"
          type="button"
          onClick={onOpenDomus}
        >
          <strong>{save.player.ludusName}</strong>
          <span>
            {t('common.level', { level: domusLevel })} ·{' '}
            {t('ludus.reputationValue', { value: save.ludus.reputation })}
          </span>
        </RomanButton>
      </div>

      <div className="top-hud__center">
        <div className="top-hud__resources" aria-label={t('topBar.resources')}>
          <Tooltip content={t('common.treasury')}>
            <RomanButton
              aria-label={t('finance.open')}
              className="top-hud__resource top-hud__resource--button"
              data-testid="topbar-treasury"
              tone="ghost"
              type="button"
              onClick={onOpenFinance}
            >
              <span aria-hidden="true" className="top-hud__resource-icon">
                <GameIcon name="treasury" size={TOP_HUD_RESOURCE_ICON_SIZE} />
              </span>
              <span className="top-hud__resource-value">
                {formatMoneyAmount(save.ludus.treasury)}
              </span>
            </RomanButton>
          </Tooltip>
          <Tooltip content={t('ludus.reputation')}>
            <div className="top-hud__resource" data-testid="topbar-reputation">
              <span aria-hidden="true" className="top-hud__resource-icon">
                <GameIcon name="reputation" size={TOP_HUD_RESOURCE_ICON_SIZE} />
              </span>
              <span className="top-hud__resource-value">{formatNumber(save.ludus.reputation)}</span>
            </div>
          </Tooltip>
          <div
            className="top-hud__resource top-hud__resource--meter"
            data-testid="topbar-happiness"
          >
            <Tooltip content={`${t('ludus.happiness')} ${happinessPercent}%`}>
              <GaugeStatBar
                className="top-hud__gauge"
                iconClassName="top-hud__resource-icon"
                iconName="happiness"
                iconSize={TOP_HUD_RESOURCE_ICON_SIZE}
                label={t('ludus.happiness')}
                value={save.ludus.happiness}
                variant="major"
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="top-hud__actions">
        <div
          className={['top-hud__time', isTimeControlLocked ? 'top-hud__time--locked' : null]
            .filter(Boolean)
            .join(' ')}
          data-testid="topbar-time"
        >
          {isTimeControlLocked ? null : (
            <RomanButton
              aria-label={t(isPaused ? 'topBar.resume' : 'topBar.pause')}
              className="top-hud__time-action"
              data-testid="topbar-pause-button"
              size="icon"
              title={t(isPaused ? 'topBar.resume' : 'topBar.pause')}
              tone="ghost"
              type="button"
              onClick={onTogglePause}
            >
              <GameIcon name={isPaused ? 'play' : 'pause'} size={22} />
            </RomanButton>
          )}
          <span className="top-hud__date-lines">
            <span>
              <strong className="top-hud__clock">{clockLabel}</strong>
              <span>,</span>
              <span>{dayLabel}</span>
            </span>
            <span>
              <span>{t('topBar.weekShort', { week: save.time.week })}</span>
              <span>{t('topBar.year', { year: save.time.year })}</span>
            </span>
          </span>
          <RomanButton
            aria-label={t('topBar.openGameMenu')}
            className="top-hud__time-action"
            data-testid="topbar-menu-button"
            size="icon"
            title={t('topBar.openGameMenu')}
            tone="ghost"
            type="button"
            onClick={onOpenMenu}
          >
            <span aria-hidden="true" className="top-hud__menu-icon">
              <GameIcon color="currentColor" name="menu" size={22} />
            </span>
          </RomanButton>
        </div>
      </div>
    </header>
  );
}
