import type { GameSave } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { Tooltip } from '@/ui/shared/components/Tooltip';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { formatNumber } from '@/ui/shared/formatters/number';
import { Button } from '@/ui/shared/ludus/Button';
import { GameFact } from '@/ui/shared/ludus/GameFact';
import { GameMeter } from '@/ui/shared/ludus/GameMeter';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { ShellWidgetPanel } from '@/ui/features/ludus/shell/ShellWidgetPanel';
import { GameIcon } from '@/ui/shared/icons/GameIcon';

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
        <ShellWidgetPanel as="div" className="top-hud__ludus-panel">
          <Button
            className="top-hud__ludus-card"
            variant="ghost"
            type="button"
            onClick={onOpenDomus}
          >
            <strong>{save.player.ludusName}</strong>
            <span>
              {t('common.level', { level: domusLevel })} ·{' '}
              {t('ludus.reputationValue', { value: save.ludus.reputation })}
            </span>
          </Button>
        </ShellWidgetPanel>
      </div>

      <div className="top-hud__center">
        <ShellWidgetPanel
          as="div"
          className="top-hud__resources"
          aria-label={t('topBar.resources')}
        >
          <Tooltip asChild content={t('common.treasury')}>
            <Button
              aria-label={t('finance.open')}
              className="top-hud__resource top-hud__resource--button"
              data-testid="topbar-treasury"
              variant="ghost"
              type="button"
              onClick={onOpenFinance}
            >
              <GameFact
                className="top-hud__fact"
                iconName="treasury"
                iconSize={TOP_HUD_RESOURCE_ICON_SIZE}
                label={t('common.treasury')}
                showLabel={false}
                surface="plain"
                value={formatMoneyAmount(save.ludus.treasury)}
              />
            </Button>
          </Tooltip>
          <Tooltip content={t('ludus.reputation')}>
            <div className="top-hud__resource" data-testid="topbar-reputation">
              <GameFact
                className="top-hud__fact"
                iconName="reputation"
                iconSize={TOP_HUD_RESOURCE_ICON_SIZE}
                label={t('ludus.reputation')}
                showLabel={false}
                surface="plain"
                value={formatNumber(save.ludus.reputation)}
              />
            </div>
          </Tooltip>
          <div
            className="top-hud__resource top-hud__resource--meter"
            data-testid="topbar-happiness"
          >
            <Tooltip content={`${t('ludus.happiness')} ${happinessPercent}%`}>
              <GameMeter
                className="top-hud__meter"
                iconName="happiness"
                iconSize={TOP_HUD_RESOURCE_ICON_SIZE}
                label={t('ludus.happiness')}
                showValue={false}
                surface="plain"
                value={save.ludus.happiness}
              />
            </Tooltip>
          </div>
        </ShellWidgetPanel>
      </div>

      <div className="top-hud__actions">
        <ShellWidgetPanel
          as="div"
          className={['top-hud__time', isTimeControlLocked ? 'top-hud__time--locked' : null]
            .filter(Boolean)
            .join(' ')}
          data-testid="topbar-time"
        >
          {isTimeControlLocked ? null : (
            <IconButton
              aria-label={t(isPaused ? 'topBar.resume' : 'topBar.pause')}
              className="top-hud__time-action"
              data-testid="topbar-pause-button"
              title={t(isPaused ? 'topBar.resume' : 'topBar.pause')}
              variant="ghost"
              type="button"
              onClick={onTogglePause}
            >
              <GameIcon name={isPaused ? 'play' : 'pause'} size={22} />
            </IconButton>
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
          <IconButton
            aria-label={t('topBar.openGameMenu')}
            className="top-hud__time-action"
            data-testid="topbar-menu-button"
            title={t('topBar.openGameMenu')}
            variant="ghost"
            type="button"
            onClick={onOpenMenu}
          >
            <span aria-hidden="true" className="top-hud__menu-icon">
              <GameIcon color="currentColor" name="menu" size={22} />
            </span>
          </IconButton>
        </ShellWidgetPanel>
      </div>
    </header>
  );
}
