import { Banknote, CalendarDays, Menu, Pause, Play, RotateCcw, Store } from 'lucide-react';
import type { GameSave, GameSpeed } from '../../domain/types';
import { formatClock } from '../../domain/time/format-time';
import { getDemoSaveDefinition } from '../../game-data/demo-saves';
import { GAME_SPEEDS } from '../../game-data/time';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from './ActionButton';

interface StatusBarProps {
  save: GameSave;
  onSpeedChange(speed: GameSpeed): void;
  onResetDemo?(): void;
}

export function StatusBar({ save, onResetDemo, onSpeedChange }: StatusBarProps) {
  const { navigate, openModal, t } = useUiStore();
  const demoDefinition = save.metadata?.demoSaveId
    ? getDemoSaveDefinition(save.metadata.demoSaveId)
    : undefined;

  return (
    <header className="status-bar" data-testid="topbar">
      <div className="status-bar__time" data-testid="topbar-time">
        <CalendarDays aria-hidden="true" size={18} />
        <span>{t(`days.${save.time.dayOfWeek}`)}</span>
        <span>{t('topBar.week', { week: save.time.week })}</span>
        <span>{t('topBar.year', { year: save.time.year })}</span>
        <span>{formatClock(save.time)}</span>
      </div>
      <div className="status-bar__speeds">
        {GAME_SPEEDS.map((speed) => (
          <button
            aria-label={t(speed === 0 ? 'speed.pause' : `speed.x${speed}`)}
            className={save.time.speed === speed ? 'is-selected' : ''}
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
          >
            {speed === 0 ? (
              <Pause aria-hidden="true" size={15} />
            ) : (
              <Play aria-hidden="true" size={15} />
            )}
            <span>{t(speed === 0 ? 'speed.pause' : `speed.x${speed}`)}</span>
          </button>
        ))}
      </div>
      <div className="status-bar__actions">
        {demoDefinition ? (
          <div className="status-bar__demo" data-testid="active-demo-indicator">
            <span>{t('demoMode.activeLabel', { name: t(demoDefinition.nameKey) })}</span>
            <button type="button" onClick={onResetDemo}>
              <RotateCcw aria-hidden="true" size={15} />
              <span>{t('demoMode.resetDemo')}</span>
            </button>
          </div>
        ) : null}
        <div className="treasury-pill" data-testid="topbar-treasury">
          <Banknote aria-hidden="true" size={18} />
          <span>{save.ludus.treasury}</span>
        </div>
        <ActionButton
          icon={<Store aria-hidden="true" size={17} />}
          label={t('topBar.market')}
          onClick={() => openModal({ kind: 'market' })}
        />
        <ActionButton
          icon={<Menu aria-hidden="true" size={17} />}
          label={t('topBar.menu')}
          onClick={() => navigate('mainMenu')}
        />
      </div>
    </header>
  );
}
