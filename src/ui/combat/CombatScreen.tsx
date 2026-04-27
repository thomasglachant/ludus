import { ArrowLeft, Banknote, CalendarDays, Menu, Pause, Play } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import type { GameSave, GameSpeed } from '../../domain/types';
import { GAME_SPEEDS } from '../../game-data/time';
import { useUiStore } from '../../state/ui-store';
import { DayCycleGauge } from '../components/DayCycleGauge';
import { formatMoneyAmount } from '../formatters/money';
import { CombatantPanel } from './CombatantPanel';
import { CombatLog } from './CombatLog';
import { CombatSkillBar } from './CombatSkillBar';
import { getCombatScreenCombat, getCombatScreenViewModel } from './combat-screen-view-model';

const PixiCombatArenaStage = lazy(() =>
  import('./PixiCombatArenaStage').then((module) => ({
    default: module.PixiCombatArenaStage,
  })),
);

interface CombatScreenProps {
  combatId?: string;
  isBlocking?: boolean;
  save: GameSave;
  onClose(): void;
  onOpenMenu(): void;
  onSpeedChange(speed: GameSpeed): void;
}

export function CombatScreen({
  combatId,
  isBlocking = false,
  onClose,
  onOpenMenu,
  onSpeedChange,
  save,
}: CombatScreenProps) {
  const { t } = useUiStore();
  const combat = useMemo(() => getCombatScreenCombat(save, combatId), [combatId, save]);
  const [turnProgress, setTurnProgress] = useState<{ combatId?: string; count: number }>({
    combatId: undefined,
    count: 0,
  });
  const visibleTurnCount = turnProgress.combatId === combat?.id ? turnProgress.count : 0;

  if (!combat) {
    return (
      <section className="combat-screen combat-screen--empty" data-testid="combat-screen">
        <button type="button" onClick={onClose}>
          <ArrowLeft aria-hidden="true" size={18} />
          <span>{t('common.back')}</span>
        </button>
        <p>{t('arena.noCombatLog')}</p>
      </section>
    );
  }

  const viewModel = getCombatScreenViewModel(combat, visibleTurnCount);

  return (
    <section
      aria-label={t('combatScreen.title')}
      className="combat-screen"
      data-testid="combat-screen"
    >
      <header className="combat-screen__hud">
        <div className="combat-screen__identity">
          <p className="eyebrow">{t('ludus.title')}</p>
          <h1>{save.player.ludusName}</h1>
          <span>
            {t('arena.combatTitle', {
              gladiator: combat.gladiator.name,
              opponent: combat.opponent.name,
            })}
          </span>
        </div>
        <div className="combat-screen__time">
          <CalendarDays aria-hidden="true" size={18} />
          <span>{t(`days.${save.time.dayOfWeek}`)}</span>
          <span>{t('topBar.week', { week: save.time.week })}</span>
          <DayCycleGauge size="compact" time={save.time} />
        </div>
        <div className="combat-screen__round">
          <span>
            {t('combatScreen.roundCounter', {
              current: viewModel.currentTurnNumber,
              total: viewModel.totalTurnCount,
            })}
          </span>
        </div>
        {!isBlocking ? (
          <div className="combat-screen__speeds">
            {GAME_SPEEDS.map((speed) => (
              <button
                aria-label={t(speed === 0 ? 'speed.pause' : `speed.x${speed}`)}
                className={save.time.speed === speed ? 'is-selected' : ''}
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
        ) : null}
        <div className="combat-screen__resources">
          <span>
            <Banknote aria-hidden="true" size={18} />
            {formatMoneyAmount(save.ludus.treasury)}
          </span>
          {!isBlocking ? (
            <>
              <button type="button" onClick={onOpenMenu}>
                <Menu aria-hidden="true" size={18} />
                <span>{t('topBar.menu')}</span>
              </button>
              <button type="button" onClick={onClose}>
                <ArrowLeft aria-hidden="true" size={18} />
                <span>{t('common.back')}</span>
              </button>
            </>
          ) : null}
        </div>
      </header>
      <div className="combat-screen__body">
        <CombatantPanel combatant={viewModel.player} />
        <Suspense fallback={<p className="empty-state">{t('common.loading')}</p>}>
          <PixiCombatArenaStage viewModel={viewModel} />
        </Suspense>
        <CombatantPanel combatant={viewModel.opponent} />
        <CombatSkillBar
          canClose={!isBlocking || viewModel.isComplete}
          closeLabelKey="combatScreen.returnToArena"
          viewModel={viewModel}
          onAdvance={() => setTurnProgress({ combatId: combat.id, count: visibleTurnCount + 1 })}
          onClose={onClose}
        />
        <CombatLog viewModel={viewModel} />
        <div className="combat-screen__fatigue combat-screen__fatigue--player">
          <span>{t('combatScreen.fatigue')}</span>
          <div>
            <span style={{ width: `${viewModel.player.energy}%` }} />
          </div>
          <strong>{viewModel.player.energy} / 100</strong>
        </div>
        <div className="combat-screen__fatigue combat-screen__fatigue--opponent">
          <span>{t('combatScreen.fatigue')}</span>
          <div>
            <span style={{ width: `${viewModel.opponent.energy}%` }} />
          </div>
          <strong>{viewModel.opponent.energy} / 100</strong>
        </div>
      </div>
    </section>
  );
}
