import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { formatMoneyAmount } from '../formatters/money';
import { formatNumber } from '../formatters/number';
import { GameIcon } from '../icons/GameIcon';

interface TopHudProps {
  save: GameSave;
  onOpenFinance(): void;
  onOpenMenu(): void;
}

export function TopHud({ onOpenFinance, onOpenMenu, save }: TopHudProps) {
  const { t } = useUiStore();
  const dayLabel = t(`days.${save.time.dayOfWeek}`);

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
          <h1>{t('app.title')}</h1>
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
              <span>{t('topBar.weekShort', { week: save.time.week })}</span>
              <span>{t('topBar.year', { year: save.time.year })}</span>
            </span>
          </span>
        </div>
        <div className="top-hud__phase" data-testid="topbar-phase">
          {t(`gamePhase.${save.time.phase}`)}
        </div>
      </div>

      <div className="top-hud__actions">
        <div className="top-hud__resources" aria-label={t('topBar.resources')}>
          <button
            aria-label={t('finance.open')}
            className="top-hud__resource top-hud__resource--button"
            data-testid="topbar-treasury"
            type="button"
            onClick={onOpenFinance}
          >
            <span aria-hidden="true" className="top-hud__resource-icon">
              <GameIcon name="treasury" size={28} />
            </span>
            <span className="top-hud__resource-value">
              {formatMoneyAmount(save.ludus.treasury)}
            </span>
          </button>
          <div className="top-hud__resource" data-testid="topbar-reputation">
            <span aria-hidden="true" className="top-hud__resource-icon">
              <GameIcon name="reputation" size={28} />
            </span>
            <span className="top-hud__resource-value">{formatNumber(save.ludus.reputation)}</span>
          </div>
          <div className="top-hud__resource" data-testid="topbar-happiness">
            <span className="top-hud__resource-value">
              {t('ludus.happinessValue', { value: save.ludus.happiness })}
            </span>
          </div>
          <div className="top-hud__resource" data-testid="topbar-security">
            <span className="top-hud__resource-value">
              {t('ludus.securityValue', { value: save.ludus.security })}
            </span>
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
            <span aria-hidden="true" className="top-hud__menu-icon">
              <GameIcon color="currentColor" name="menu" size={28} />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
