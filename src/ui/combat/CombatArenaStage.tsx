import type { CSSProperties } from 'react';
import type { CombatantViewModel, CombatScreenViewModel } from './combat-screen-view-model';

interface CombatArenaStageProps {
  viewModel: CombatScreenViewModel;
}

function getSpriteFrames(combatant: CombatantViewModel, isAttacking: boolean) {
  const frames =
    isAttacking && combatant.attackFrames.length > 0
      ? combatant.attackFrames
      : combatant.idleFrames;

  return frames.length > 0 ? frames : combatant.idleFrames;
}

function CombatSprite({
  combatant,
  isAttacking,
}: {
  combatant: CombatantViewModel;
  isAttacking: boolean;
}) {
  const frames = getSpriteFrames(combatant, isAttacking);

  return (
    <div
      className={[
        'combat-stage__fighter',
        `combat-stage__fighter--${combatant.side}`,
        isAttacking ? 'is-attacking' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="combat-stage__floating-health" aria-hidden="true">
        <span style={{ width: `${combatant.health}%` }} />
        <strong>{combatant.health} / 100</strong>
      </div>
      <div className="combat-stage__sprite-frames" data-frame-count={Math.min(frames.length, 2)}>
        {frames.slice(0, 2).map((frame, index) => (
          <img
            alt=""
            className="combat-stage__sprite-frame"
            data-frame-index={index}
            key={frame}
            src={frame}
          />
        ))}
      </div>
      <span className="combat-stage__shadow" />
    </div>
  );
}

export function CombatArenaStage({ viewModel }: CombatArenaStageProps) {
  const latestAttackerId = viewModel.latestTurn?.attackerId;

  return (
    <section
      className="combat-stage"
      data-testid="combat-stage"
      style={
        {
          '--combat-background': `url(${viewModel.combatBackgroundPath})`,
        } as CSSProperties
      }
    >
      <div className="combat-stage__crowd" />
      <div className="combat-stage__sand">
        <CombatSprite
          combatant={viewModel.player}
          isAttacking={latestAttackerId === viewModel.combat.gladiator.id}
        />
        <CombatSprite
          combatant={viewModel.opponent}
          isAttacking={latestAttackerId === viewModel.combat.opponent.id}
        />
      </div>
    </section>
  );
}
