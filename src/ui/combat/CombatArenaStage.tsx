import { GameIcon } from '../icons/GameIcon';
import type { CombatReplayViewModel, CombatantViewModel } from './combat-replay-view-model';

interface CombatArenaStageProps {
  viewModel: CombatReplayViewModel;
}

function CombatantMarker({ combatant }: { combatant: CombatantViewModel }) {
  return (
    <span className={`combat-stage__combatant combat-stage__combatant--${combatant.side}`}>
      <img alt="" src={combatant.portraitPath} />
      <strong>{combatant.name}</strong>
    </span>
  );
}

export function CombatArenaStage({ viewModel }: CombatArenaStageProps) {
  const latestTurn = viewModel.latestTurn;
  const playerIsActing = latestTurn?.attackerId === viewModel.player.id;
  const opponentIsActing = latestTurn?.attackerId === viewModel.opponent.id;

  return (
    <section className="combat-stage" aria-hidden="true">
      <img className="combat-stage__background" alt="" src={viewModel.combatBackgroundPath} />
      <img className="combat-stage__crowd" alt="" src={viewModel.combatCrowdPath} />
      <div className="combat-stage__sand">
        <span
          className={[
            'combat-stage__stance',
            'combat-stage__stance--player',
            playerIsActing ? 'is-acting' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <CombatantMarker combatant={viewModel.player} />
        </span>
        <span className="combat-stage__clash">
          <GameIcon
            name={
              viewModel.isComplete
                ? viewModel.consequence.didPlayerWin
                  ? 'victory'
                  : 'defeat'
                : 'combatStrike'
            }
            size={42}
          />
        </span>
        <span
          className={[
            'combat-stage__stance',
            'combat-stage__stance--opponent',
            opponentIsActing ? 'is-acting' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <CombatantMarker combatant={viewModel.opponent} />
        </span>
      </div>
    </section>
  );
}
