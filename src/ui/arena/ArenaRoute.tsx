import { useState } from 'react';
import {
  calculateDecimalOdds,
  calculateProjectedWinChance,
} from '../../domain/combat/combat-actions';
import type { CombatState, GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { ActionButton } from '../components/ActionButton';
import { CardBlured } from '../components/CardBlured';
import { CardScrollArea } from '../components/CardScrollArea';
import { CTAButton } from '../components/CTAButton';
import { ImpactList } from '../components/ImpactList';
import { LeagueRankBadge } from '../components/LeagueRankBadge';
import { EmptyState } from '../components/shared';
import { CombatLog } from '../combat/CombatLog';
import { getCombatLogViewModel } from '../combat/combat-log-view-model';
import { GladiatorSummary } from '../gladiators/GladiatorSummary';
import { RomanButton } from '../game/RomanButton';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { ScenicScreen } from '../layout/ScenicScreen';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { getArenaDayViewModel } from './arena-view-model';

interface ArenaRouteProps {
  save: GameSave;
  onCompleteArenaDay(): void;
  onReturnToLudus(): void;
}

interface CombatIndexButtonProps {
  disabled?: boolean;
  iconName: GameIconName;
  label: string;
  onClick(): void;
}

interface BoutOverviewViewProps {
  combat: CombatState;
  currentIndex: number;
  isLogOpen: boolean;
  save: GameSave;
  totalCombats: number;
  onNext(): void;
  onPrevious(): void;
  onToggleLog(): void;
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
    <RomanButton
      aria-label={label}
      className="arena-route-stepper__button"
      disabled={disabled}
      size="icon"
      tone="secondary"
      onClick={onClick}
    >
      <GameIcon name={iconName} size={18} />
    </RomanButton>
  );
}

function CombatOutcomeImpacts({ combat }: { combat: CombatState }) {
  const { t } = useUiStore();

  return (
    <div className="arena-route-bout-outcome" aria-label={t('arenaRoute.combatImpacts')}>
      <GameIcon name={combat.consequence.didPlayerWin ? 'victory' : 'defeat'} size={34} />
      <ImpactList
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
          {
            amount: combat.consequence.experienceChange,
            id: 'experience',
            kind: 'xp',
            label: t('arena.experienceChange'),
          },
        ]}
      />
    </div>
  );
}

function BoutOverviewView({
  combat,
  currentIndex,
  isLogOpen,
  onNext,
  onPrevious,
  save,
  onToggleLog,
  totalCombats,
}: BoutOverviewViewProps) {
  const { t } = useUiStore();
  const odds = getCombatOdds(combat);
  const playerWon = combat.winnerId === combat.gladiator.id;
  const opponentWon = combat.winnerId === combat.opponent.id;

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
            disabled={currentIndex <= 0}
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
            iconName="arrowRight"
            label={
              currentIndex + 1 >= totalCombats ? t('arenaRoute.summaryStep') : t('arenaRoute.next')
            }
            onClick={onNext}
          />
        </nav>
      </header>
      <div className="arena-route-bout-summary">
        <div className="arena-route-bout-tags">
          <LeagueRankBadge label={t(`arena.ranks.${combat.rank}`)} rank={combat.rank} />
        </div>
        <CombatOutcomeImpacts combat={combat} />
      </div>
      <div className="arena-route-bout-layout">
        <div
          className={[
            'arena-route-fighter-stack',
            playerWon ? 'arena-route-fighter-stack--winner' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <GladiatorSummary
            gladiator={combat.gladiator}
            odds={odds.player}
            save={save}
            statValues={{
              energy: combat.gauges.player.energy,
              health: combat.gauges.player.health,
              morale: combat.gauges.player.morale,
            }}
          />
        </div>
        <div className="arena-route-versus" aria-hidden="true">
          <span>{t('arenaRoute.versus')}</span>
        </div>
        <div
          className={[
            'arena-route-fighter-stack',
            opponentWon ? 'arena-route-fighter-stack--winner' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <GladiatorSummary
            gladiator={combat.opponent}
            odds={odds.opponent}
            save={save}
            side="opponent"
            statValues={{
              energy: combat.gauges.opponent.energy,
              health: combat.gauges.opponent.health,
              morale: combat.gauges.opponent.morale,
            }}
          />
        </div>
      </div>
      <div className="arena-route-actions arena-route-actions--footer">
        <RomanButton className="arena-route-log-toggle" tone="secondary" onClick={onToggleLog}>
          <GameIcon color="currentColor" name={isLogOpen ? 'close' : 'view'} size={18} />
          <span>{t(isLogOpen ? 'arenaRoute.hideCombatLog' : 'arenaRoute.showCombatLog')}</span>
        </RomanButton>
      </div>
      {isLogOpen ? (
        <div className="arena-route-combat-log">
          <CombatLog viewModel={getCombatLogViewModel(combat)} />
        </div>
      ) : null}
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
        {
          amount: combat.consequence.experienceChange,
          id: 'experience',
          kind: 'xp',
          label: t('arena.experienceChange'),
        },
      ]}
      size="sm"
    />
  );
}

function CombatResultRow({ combat, onOpenCombat }: { combat: CombatState; onOpenCombat(): void }) {
  const { t } = useUiStore();
  const didPlayerWin = combat.consequence.didPlayerWin;
  const playerWon = combat.winnerId === combat.gladiator.id;

  return (
    <CardBlured
      as="article"
      className={`arena-route-day-result-card arena-route-day-result-card--${didPlayerWin ? 'win' : 'loss'}`}
    >
      <div className="arena-route-day-result-card__identity">
        <LeagueRankBadge label={t(`arena.ranks.${combat.rank}`)} rank={combat.rank} />
        <div
          className={[
            'arena-route-day-result-card__fighter-portrait',
            playerWon ? 'arena-route-day-result-card__fighter-portrait--winner' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <GladiatorPortrait gladiator={combat.gladiator} size="small" />
        </div>
        <RomanButton
          className="arena-route-day-result-card__fighter-button"
          tone="ghost"
          onClick={onOpenCombat}
        >
          <span>{combat.gladiator.name}</span>
        </RomanButton>
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
  const totalExperienceReward = viewModel.resolvedCombats.reduce(
    (total, combat) => total + combat.consequence.experienceChange,
    0,
  );

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
            {
              amount: totalExperienceReward,
              id: 'experience',
              kind: 'xp',
              label: t('arenaDay.totalExperienceReward'),
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

export function ArenaRoute({ onCompleteArenaDay, onReturnToLudus, save }: ArenaRouteProps) {
  const { t } = useUiStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [openCombatLogIds, setOpenCombatLogIds] = useState<Set<string>>(() => new Set());
  const viewModel = getArenaDayViewModel(save);
  const totalCombats = viewModel.resolvedCombats.length;
  const visibleStepIndex = Math.min(currentStepIndex, totalCombats);
  const currentCombat = viewModel.resolvedCombats[visibleStepIndex];
  const isSummary = visibleStepIndex >= totalCombats || totalCombats === 0;

  const toggleCombatLog = (combatId: string) => {
    setOpenCombatLogIds((combatIds) => {
      const nextCombatIds = new Set(combatIds);

      if (nextCombatIds.has(combatId)) {
        nextCombatIds.delete(combatId);
      } else {
        nextCombatIds.add(combatId);
      }

      return nextCombatIds;
    });
  };

  if (!save.arena.arenaDay) {
    return (
      <ScenicScreen className="arena-route">
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
    <ScenicScreen className="arena-route">
      <main className="arena-route__stage">
        {isSummary ? (
          totalCombats > 0 ? (
            <DayResultsView
              canGoPrevious
              save={save}
              onCompleteArenaDay={onCompleteArenaDay}
              onOpenCombat={setCurrentStepIndex}
              onPrevious={() => setCurrentStepIndex(Math.max(totalCombats - 1, 0))}
            />
          ) : (
            <section
              className="arena-route-panel arena-route-panel--program"
              data-testid="arena-route-empty"
            >
              <EmptyState messageKey="arena.noEligible" />
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
          )
        ) : currentCombat ? (
          <BoutOverviewView
            combat={currentCombat}
            currentIndex={visibleStepIndex}
            isLogOpen={openCombatLogIds.has(currentCombat.id)}
            save={save}
            totalCombats={totalCombats}
            onNext={() => setCurrentStepIndex(Math.min(visibleStepIndex + 1, totalCombats))}
            onPrevious={() => setCurrentStepIndex(Math.max(visibleStepIndex - 1, 0))}
            onToggleLog={() => toggleCombatLog(currentCombat.id)}
          />
        ) : null}
      </main>
    </ScenicScreen>
  );
}
