import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Save,
} from 'lucide-react';
import type { GameSave, GameSpeed } from '../../domain/types';
import { formatClock } from '../../domain/time/format-time';
import { getDemoSaveDefinition } from '../../game-data/demo-saves';
import { GAME_SPEEDS } from '../../game-data/time';
import { useUiStore } from '../../state/ui-store';

interface TopHudProps {
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  save: GameSave;
  isSaving: boolean;
  onResetDemo(): void;
  onSave(): void;
  onSpeedChange(speed: GameSpeed): void;
}

export function TopHud({
  hasUnsavedChanges,
  isSaving,
  lastSavedAt,
  onResetDemo,
  onSave,
  onSpeedChange,
  save,
}: TopHudProps) {
  const { language, navigate, t } = useUiStore();
  const demoDefinition = save.metadata?.demoSaveId
    ? getDemoSaveDefinition(save.metadata.demoSaveId)
    : undefined;
  const isDemoSave = Boolean(save.metadata?.isDemo);
  const savedTime = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString(language) : null;
  const saveStatusKey = isDemoSave
    ? 'demoMode.saveDisabled'
    : hasUnsavedChanges
      ? 'ludus.unsavedChanges'
      : savedTime
        ? 'ludus.savedAt'
        : 'ludus.localSaveReady';

  return (
    <header className="top-hud" data-testid="topbar">
      <div className="top-hud__identity">
        <p className="eyebrow">{t('ludus.title')}</p>
        <h1>{save.player.ludusName}</h1>
        <span>{t('ludus.domusLevel', { level: save.buildings.domus.level })}</span>
      </div>
      <div className="top-hud__time" data-testid="topbar-time">
        <CalendarDays aria-hidden="true" size={18} />
        <span>{t(`days.${save.time.dayOfWeek}`)}</span>
        <span>{t('topBar.week', { week: save.time.week })}</span>
        <span>{t('topBar.year', { year: save.time.year })}</span>
        <strong>{formatClock(save.time)}</strong>
      </div>
      <div className="top-hud__speeds">
        {GAME_SPEEDS.map((speed) => (
          <button
            aria-label={t(speed === 0 ? 'speed.pause' : `speed.x${speed}`)}
            className={save.time.speed === speed ? 'is-selected' : ''}
            data-testid={`speed-${speed === 0 ? 'pause' : `x${speed}`}`}
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
          >
            {speed === 0 ? (
              <Pause aria-hidden="true" size={14} />
            ) : (
              <Play aria-hidden="true" size={14} />
            )}
            <span>{t(speed === 0 ? 'speed.pause' : `speed.x${speed}`)}</span>
          </button>
        ))}
      </div>
      <div className="top-hud__actions">
        {demoDefinition ? (
          <div className="top-hud__demo" data-testid="active-demo-indicator">
            <span>{t('demoMode.activeLabel', { name: t(demoDefinition.nameKey) })}</span>
            <button type="button" onClick={onResetDemo}>
              <RotateCcw aria-hidden="true" size={14} />
              <span>{t('demoMode.resetDemo')}</span>
            </button>
          </div>
        ) : null}
        <div className="top-hud__treasury" data-testid="topbar-treasury">
          <Banknote aria-hidden="true" size={18} />
          <span>{save.ludus.treasury}</span>
        </div>
        <div
          className={[
            'top-hud__save-status',
            hasUnsavedChanges && !isDemoSave ? 'top-hud__save-status--dirty' : '',
            isDemoSave ? 'top-hud__save-status--readonly' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-testid="save-status"
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          <span>{t(saveStatusKey, savedTime ? { time: savedTime } : undefined)}</span>
        </div>
        {isDemoSave ? null : (
          <button
            data-testid="topbar-save-button"
            disabled={isSaving}
            type="button"
            onClick={onSave}
          >
            <Save aria-hidden="true" size={17} />
            <span>{t(isSaving ? 'ludus.saving' : 'common.save')}</span>
          </button>
        )}
        <button data-testid="topbar-menu-button" type="button" onClick={() => navigate('mainMenu')}>
          <Menu aria-hidden="true" size={17} />
          <span>{t('topBar.menu')}</span>
        </button>
      </div>
    </header>
  );
}
