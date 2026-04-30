import { useUiStore } from '../../state/ui-store-context';
import { formatNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { Tooltip } from '../components/Tooltip';
import type { CombatantViewModel } from './combat-screen-view-model';

interface CombatantPanelProps {
  combatant: CombatantViewModel;
}

interface MeterProps {
  icon: Extract<GameIconName, 'energy' | 'health' | 'morale'>;
  labelKey: string;
  value: number;
}

function CombatantMeter({ icon, labelKey, value }: MeterProps) {
  const { t } = useUiStore();

  return (
    <div className={`combatant-meter combatant-meter--${icon}`}>
      <Tooltip content={t(labelKey)}>
        <GameIcon name={icon} size={16} />
      </Tooltip>
      <div className="combatant-meter__track" aria-label={t(labelKey)}>
        <span style={{ width: `${value}%` }} />
      </div>
      <strong>
        {formatNumber(value)} / {formatNumber(100)}
      </strong>
    </div>
  );
}

export function CombatantPanel({ combatant }: CombatantPanelProps) {
  const { t } = useUiStore();

  return (
    <aside
      className={`combatant-panel combatant-panel--${combatant.side}`}
      data-testid={`combatant-panel-${combatant.side}`}
    >
      <div className="combatant-panel__identity">
        <img src={combatant.portraitPath} alt="" />
        <div>
          <p className="eyebrow">{t(`combatScreen.combatant.${combatant.side}`)}</p>
          <h2>{combatant.name}</h2>
        </div>
      </div>
      <div className="combatant-panel__meters">
        <CombatantMeter icon="health" labelKey="combatScreen.health" value={combatant.health} />
        <CombatantMeter icon="energy" labelKey="combatScreen.energy" value={combatant.energy} />
        <CombatantMeter icon="morale" labelKey="combatScreen.morale" value={combatant.morale} />
      </div>
    </aside>
  );
}
