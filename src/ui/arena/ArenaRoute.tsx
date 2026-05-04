import { useState } from 'react';
import {
  calculateDecimalOdds,
  calculateGladiatorCombatReputation,
  calculateProjectedWinChance,
} from '../../domain/combat/combat-actions';
import type { CombatState, GameSave } from '../../domain/types';
import { PRODUCTION_VISUAL_ASSET_MANIFEST } from '../../game-data/visual-assets';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { CardBlured } from '../components/CardBlured';
import { CardScrollArea } from '../components/CardScrollArea';
import { CTAButton } from '../components/CTAButton';
import { ImpactList } from '../components/ImpactList';
import { LeagueRankBadge } from '../components/LeagueRankBadge';
import { EmptyState } from '../components/shared';
import { CombatReplayView } from '../combat/CombatReplayView';
import { formatMoneyAmount } from '../formatters/money';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { ScenicScreen } from '../layout/ScenicScreen';
import { formatSignedValue, getArenaDayViewModel } from './arena-view-model';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface ArenaRouteProps {
  save: GameSave;
  onCompleteArenaDay(): void;
  onMarkCombatPresented(combatId: string): void;
  onReturnToLudus(): void;
}

interface CombatIndexButtonProps {
  disabled?: boolean;
  iconName: GameIconName;
  label: string;
  onClick(): void;
}

interface BoutPreviewViewProps {
  combat: CombatState;
  currentIndex: number;
  isPresented: boolean;
  totalCombats: number;
  onNext(): void;
  onPrevious(): void;
  onStartCombat(): void;
}

function getCombatOutcomeTone(combat: CombatState) {
  return combat.consequence.didPlayerWin
    ? 'arena-route__delta--positive'
    : 'arena-route__delta--negative';
}

function getCombatWinnerName(combat: CombatState) {
  return combat.winnerId === combat.gladiator.id ? combat.gladiator.name : combat.opponent.name;
}

function getParticipationReward(combat: CombatState) {
  return combat.reward.participationReward ?? combat.reward.loserReward;
}

function getCombatReputationChange(combat: CombatState, didWin: boolean) {
  return (
    calculateGladiatorCombatReputation(combat.gladiator.reputation, didWin) -
    combat.gladiator.reputation
  );
}

function getCombatOdds(combat: CombatState) {
  if (
    combat.reward.playerDecimalOdds !== undefined &&
    combat.reward.opponentDecimalOdds !== undefined
  ) {
    return {
      opponent: combat.reward.opponentDecimalOdds,
      player: combat.reward.playerDecimalOdds,
    };
  }

  const playerChance = calculateProjectedWinChance(combat.gladiator, combat.opponent);

  return {
    opponent: combat.reward.opponentDecimalOdds ?? calculateDecimalOdds(1 - playerChance),
    player: combat.reward.playerDecimalOdds ?? calculateDecimalOdds(playerChance),
  };
}

function CombatIndexButton({ disabled = false, iconName, label, onClick }: CombatIndexButtonProps) {
  return (
    <button
      aria-label={label}
      className="arena-route-stepper__button"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <GameIcon name={iconName} size={18} />
    </button>
  );
}

function CombatRewardImpacts({ combat }: { combat: CombatState }) {
  const { t } = useUiStore();
  const lossReward = getParticipationReward(combat);

  return (
    <div className="arena-route-reward-impacts" aria-label={t('arenaRoute.purseTitle')}>
      <div className="arena-route-reward-impacts__group">
        <h2>{t('arenaRoute.victoryImpacts')}</h2>
        <ImpactList
          impacts={[
            {
              amount: combat.reward.winnerReward,
              id: 'victory-treasury',
              kind: 'treasury',
              label: t('arena.totalReward'),
            },
            {
              amount: getCombatReputationChange(combat, true),
              id: 'victory-reputation',
              kind: 'reputation',
              label: t('arena.reputationChange'),
            },
          ]}
        />
      </div>
      <div className="arena-route-reward-impacts__group">
        <h2>{t('arenaRoute.defeatImpacts')}</h2>
        <ImpactList
          impacts={[
            {
              amount: lossReward,
              id: 'defeat-treasury',
              kind: 'treasury',
              label: t('arenaRoute.participationBonus'),
            },
            {
              amount: getCombatReputationChange(combat, false),
              id: 'defeat-reputation',
              kind: 'reputation',
              label: t('arena.reputationChange'),
            },
          ]}
        />
      </div>
    </div>
  );
}

function ArenaCombatResultIntel({ combat }: { combat: CombatState }) {
  const { t } = useUiStore();

  return (
    <aside className="arena-route-bout-result-intel" aria-label={t('arenaRoute.intelTitle')}>
      <div className="arena-route-intel__card arena-route-intel__card--result">
        <header>
          <GameIcon name="victory" size={20} />
          <strong>{t('combatScreen.finalResult')}</strong>
        </header>
        <p>{t('combatScreen.winnerLine', { winner: getCombatWinnerName(combat) })}</p>
        <dl className="arena-route-purse-list">
          <div>
            <dt>{t('arena.rewardReceived')}</dt>
            <dd>{formatMoneyAmount(combat.consequence.playerReward)}</dd>
          </div>
          <div>
            <dt>{t('arena.reputationChange')}</dt>
            <dd className={getCombatOutcomeTone(combat)}>
              {formatSignedValue(combat.consequence.reputationChange)}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

function BoutPreviewView({
  combat,
  currentIndex,
  isPresented,
  onNext,
  onPrevious,
  onStartCombat,
  totalCombats,
}: BoutPreviewViewProps) {
  const { t } = useUiStore();
  const canGoPrevious = currentIndex > 0;
  const canGoNext = isPresented;
  const odds = getCombatOdds(combat);

  return (
    <section
      className="arena-route-panel arena-route-panel--bout-preview"
      data-testid="arena-route-bout-preview"
    >
      <header className="arena-route-step-header">
        <div>
          <h1>{t('arenaRoute.programTitle')}</h1>
        </div>
        <nav className="arena-route-stepper" aria-label={t('arenaRoute.combatNavigation')}>
          <CombatIndexButton
            disabled={!canGoPrevious}
            iconName="back"
            label={t('arenaRoute.previous')}
            onClick={onPrevious}
          />
          <strong
            aria-label={t('arenaRoute.combatStep', {
              current: currentIndex + 1,
              total: totalCombats,
            })}
          >
            <span>{t('arenaRoute.combatStepLabel')}</span>
            <span>
              {t('arenaRoute.combatStepCount', { current: currentIndex + 1, total: totalCombats })}
            </span>
          </strong>
          <CombatIndexButton
            disabled={!canGoNext}
            iconName="arrowRight"
            label={t(
              currentIndex + 1 >= totalCombats ? 'arenaRoute.summaryStep' : 'arenaRoute.next',
            )}
            onClick={onNext}
          />
        </nav>
      </header>
      <div className="arena-route-bout-summary">
        <div className="arena-route-bout-tags">
          <LeagueRankBadge label={t(`arena.ranks.${combat.rank}`)} rank={combat.rank} />
        </div>
        <CombatRewardImpacts combat={combat} />
      </div>
      <div className="arena-route-bout-layout">
        <div className="arena-route-fighter-stack">
          <GladiatorSummary
            gladiator={combat.gladiator}
            odds={odds.player}
            side="player"
            statValues={{
              energy: combat.gauges.player.maxEnergy,
              health: combat.gauges.player.maxHealth,
              morale: combat.gauges.player.morale,
            }}
          />
        </div>
        <div className="arena-route-versus" aria-hidden="true">
          <span>{t('arenaRoute.versus')}</span>
        </div>
        <div className="arena-route-fighter-stack">
          <GladiatorSummary
            gladiator={combat.opponent}
            odds={odds.opponent}
            side="opponent"
            statValues={{
              energy: combat.gauges.opponent.maxEnergy,
              health: combat.gauges.opponent.maxHealth,
              morale: combat.gauges.opponent.morale,
            }}
          />
        </div>
      </div>
      {isPresented ? <ArenaCombatResultIntel combat={combat} /> : null}
      <div className="arena-route-actions arena-route-actions--footer">
        <CTAButton
          className="arena-route-primary-cta"
          data-testid="arena-route-primary-cta"
          onClick={onStartCombat}
        >
          <GameIcon color="#fff9e7" name={isPresented ? 'view' : 'combatStrike'} size={18} />
          <span>{t(isPresented ? 'arenaRoute.watchReplay' : 'arenaRoute.launchCombat')}</span>
        </CTAButton>
      </div>
    </section>
  );
}

function CombatImpactList({ combat }: { combat: CombatState }) {
  const { t } = useUiStore();

  return (
    <ImpactList
      aria-label={t('arenaRoute.combatImpacts')}
      className="arena-route-day-result-card__impacts"
      impacts={[
        {
          amount: combat.consequence.playerReward,
          id: 'treasury',
          kind: 'treasury',
          label: t('arena.rewardReceived'),
        },
        {
          amount: combat.consequence.reputationChange,
          id: 'reputation',
          kind: 'reputation',
          label: t('arena.reputationChange'),
        },
      ]}
      size="sm"
    />
  );
}

function CombatResultRow({ combat, onOpenCombat }: { combat: CombatState; onOpenCombat(): void }) {
  const { t } = useUiStore();
  const didPlayerWin = combat.consequence.didPlayerWin;

  return (
    <CardBlured
      as="article"
      className={`arena-route-day-result-card arena-route-day-result-card--${didPlayerWin ? 'win' : 'loss'}`}
    >
      <div className="arena-route-day-result-card__identity">
        <LeagueRankBadge label={t(`arena.ranks.${combat.rank}`)} rank={combat.rank} />
        <GladiatorPortrait gladiator={combat.gladiator} size="small" />
        <button
          className="arena-route-day-result-card__fighter-button"
          type="button"
          onClick={onOpenCombat}
        >
          <span>{combat.gladiator.name}</span>
        </button>
      </div>
      <CombatImpactList combat={combat} />
      <GameIcon
        className="arena-route-day-result-card__result-icon"
        name={didPlayerWin ? 'victory' : 'defeat'}
        size={34}
      />
    </CardBlured>
  );
}

function DayResultsView({
  canGoPrevious,
  onCompleteArenaDay,
  onOpenCombat,
  onPrevious,
  save,
}: {
  canGoPrevious: boolean;
  save: GameSave;
  onCompleteArenaDay(): void;
  onOpenCombat(combatIndex: number): void;
  onPrevious(): void;
}) {
  const { t } = useUiStore();
  const viewModel = getArenaDayViewModel(save);
  const totalTreasuryReward = viewModel.summary.totalReward;
  const totalReputationReward = viewModel.summary.reputationChange;

  return (
    <section
      className="arena-route-panel arena-route-panel--day-results"
      data-testid="arena-route-day-results"
    >
      <header className="arena-route-step-header">
        <div>
          <h1>{t('arenaRoute.programTitle')}</h1>
        </div>
        <nav className="arena-route-stepper" aria-label={t('arenaRoute.combatNavigation')}>
          <CombatIndexButton
            disabled={!canGoPrevious}
            iconName="back"
            label={t('arenaRoute.previous')}
            onClick={onPrevious}
          />
          <strong>{t('arenaRoute.summaryStep')}</strong>
        </nav>
      </header>
      <section aria-label={t('arenaRoute.summaryTitle')} className="arena-route-day-results-bar">
        <div className="arena-route-day-results-record">
          <span className="arena-route-day-results-stat arena-route-day-results-stat--win">
            <GameIcon name="victory" size={28} />
            <strong aria-label={t('arenaRoute.summaryWins')}>{viewModel.summary.wins}</strong>
          </span>
          <span className="arena-route-day-results-stat arena-route-day-results-stat--loss">
            <GameIcon name="defeat" size={28} />
            <strong aria-label={t('arenaRoute.summaryLosses')}>{viewModel.summary.losses}</strong>
          </span>
        </div>
        <ImpactList
          className="arena-route-day-results-gain-impacts"
          impacts={[
            {
              amount: totalTreasuryReward,
              id: 'treasury',
              kind: 'treasury',
              label: t('arenaDay.totalTreasuryReward'),
            },
            {
              amount: totalReputationReward,
              id: 'reputation',
              kind: 'reputation',
              label: t('arenaDay.totalReputationReward'),
            },
          ]}
        />
      </section>
      <section
        aria-label={t('arenaRoute.combatListTitle')}
        className="arena-route-day-results-section"
      >
        <CardScrollArea className="arena-route-day-results-list">
          {viewModel.resolvedCombats.map((combat, combatIndex) => (
            <CombatResultRow
              combat={combat}
              key={combat.id}
              onOpenCombat={() => onOpenCombat(combatIndex)}
            />
          ))}
        </CardScrollArea>
      </section>
      <div className="arena-route-actions arena-route-actions--footer">
        <CTAButton
          className="arena-route-primary-cta"
          data-testid="arena-route-return-ludus"
          onClick={onCompleteArenaDay}
        >
          <GameIcon color="#fff9e7" name="logout" size={18} />
          <span>{t('arenaRoute.returnToLudus')}</span>
        </CTAButton>
      </div>
    </section>
  );
}

export function ArenaRoute({
  onCompleteArenaDay,
  onMarkCombatPresented,
  onReturnToLudus,
  save,
}: ArenaRouteProps) {
  const { t } = useUiStore();
  const [activeCombatId, setActiveCombatId] = useState<string | undefined>();
  const viewModel = getArenaDayViewModel(save);
  const presentedCombatIds = new Set(save.arena.arenaDay?.presentedCombatIds ?? []);
  const totalCombats = viewModel.resolvedCombats.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    save.arena.arenaDay?.phase === 'summary'
      ? totalCombats
      : Math.min(save.arena.arenaDay?.presentedCombatIds.length ?? 0, totalCombats),
  );
  const maxVisibleStepIndex = Math.min(presentedCombatIds.size, totalCombats);
  const visibleStepIndex = Math.min(currentStepIndex, maxVisibleStepIndex);
  const currentCombat = viewModel.resolvedCombats[visibleStepIndex];
  const arenaBackground = PRODUCTION_VISUAL_ASSET_MANIFEST.locations.arena.combatBackground;
  const isSummary = visibleStepIndex >= totalCombats || totalCombats === 0;

  if (!save.arena.arenaDay) {
    return (
      <ScenicScreen backgroundPath={arenaBackground} className="arena-route">
        <div className="arena-route-panel arena-route-panel--closed">
          <p className="eyebrow">{t('arena.title')}</p>
          <h1>{t('arena.closedTitle')}</h1>
          <p>{t('arena.closedBody')}</p>
          <ActionButton
            icon={<GameIcon name="back" size={18} />}
            label={t('arenaRoute.returnToLudus')}
            onClick={onReturnToLudus}
          />
        </div>
      </ScenicScreen>
    );
  }

  return (
    <ScenicScreen backgroundPath={arenaBackground} className="arena-route">
      <main className="arena-route__stage">
        {activeCombatId ? (
          <CombatReplayView
            combatId={activeCombatId}
            embedded
            save={save}
            onClose={() => {
              onMarkCombatPresented(activeCombatId);
              setActiveCombatId(undefined);
              setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, totalCombats));
            }}
          />
        ) : isSummary ? (
          <DayResultsView
            canGoPrevious={totalCombats > 0}
            save={save}
            onCompleteArenaDay={onCompleteArenaDay}
            onOpenCombat={setCurrentStepIndex}
            onPrevious={() => setCurrentStepIndex(Math.max(totalCombats - 1, 0))}
          />
        ) : currentCombat ? (
          <BoutPreviewView
            combat={currentCombat}
            currentIndex={visibleStepIndex}
            isPresented={presentedCombatIds.has(currentCombat.id)}
            totalCombats={totalCombats}
            onNext={() => setCurrentStepIndex(Math.min(visibleStepIndex + 1, totalCombats))}
            onPrevious={() => setCurrentStepIndex(Math.max(visibleStepIndex - 1, 0))}
            onStartCombat={() => setActiveCombatId(currentCombat.id)}
          />
        ) : (
          <section
            className="arena-route-panel arena-route-panel--program"
            data-testid="arena-route-empty"
          >
            <EmptyState messageKey="arena.noEligible" />
          </section>
        )}
      </main>
    </ScenicScreen>
  );
}
