import { useUiStore } from '../../state/ui-store-context';
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
      <strong>{value} / 100</strong>
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
          <span className="combatant-panel__class" title={t(combatant.classDescriptionKey)}>
            {t(combatant.classNameKey)}
          </span>
          <span>{t(combatant.armorKey)}</span>
        </div>
      </div>
      <div className="combatant-panel__meters">
        <CombatantMeter icon="health" labelKey="combatScreen.health" value={combatant.health} />
        <CombatantMeter icon="energy" labelKey="combatScreen.energy" value={combatant.energy} />
        <CombatantMeter icon="morale" labelKey="combatScreen.morale" value={combatant.morale} />
      </div>
      <div className="combatant-panel__effects">
        <strong>{t('combatScreen.activeEffects')}</strong>
        <span>
          <GameIcon name="defense" size={16} />
          {t(combatant.classEffectSummaryKey)}
        </span>
      </div>
    </aside>
  );
}
