import { Swords, Trophy } from 'lucide-react';
import { useUiStore } from '../../state/ui-store-context';
import type { CombatScreenViewModel } from './combat-screen-view-model';

interface CombatLogProps {
  viewModel: CombatScreenViewModel;
}

export function CombatLog({ viewModel }: CombatLogProps) {
  const { t } = useUiStore();

  return (
    <section className="combat-screen-log" data-testid="combat-screen-log">
      <header>
        <strong>{t('arena.combatLog')}</strong>
        <span>
          {t('arena.turnsVisible', {
            visible: viewModel.visibleTurns.length,
            total: viewModel.totalTurnCount,
          })}
        </span>
      </header>
      <ul aria-live="polite">
        <li className={viewModel.visibleTurns.length === 0 ? 'is-latest' : ''}>
          <Swords aria-hidden="true" size={16} />
          <div>
            <span>{t('combatScreen.logIntroTitle')}</span>
            <p>
              {t('combatScreen.logIntro', {
                gladiator: viewModel.combat.gladiator.name,
                opponent: viewModel.combat.opponent.name,
              })}
            </p>
          </div>
        </li>
        {viewModel.visibleTurns.map((turn) => (
          <li
            className={turn.turnNumber === viewModel.latestTurn?.turnNumber ? 'is-latest' : ''}
            key={turn.turnNumber}
          >
            <Swords aria-hidden="true" size={16} />
            <div>
              <span>{t('arena.turnNumber', { turn: turn.turnNumber })}</span>
              <p>{t(turn.logKey, turn.logParams)}</p>
            </div>
          </li>
        ))}
        {viewModel.isComplete ? (
          <li className="combat-screen-log__result">
            <Trophy aria-hidden="true" size={16} />
            <div>
              <span>{t('combatScreen.finalResult')}</span>
              <p>
                {t('combatScreen.winnerLine', {
                  winner: viewModel.consequence.winnerName,
                })}
              </p>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
