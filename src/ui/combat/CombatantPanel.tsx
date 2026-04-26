import { Heart, Shield, Sparkles, Zap } from 'lucide-react';
import { useUiStore } from '../../state/ui-store';
import type { CombatantViewModel } from './combat-screen-view-model';

interface CombatantPanelProps {
  combatant: CombatantViewModel;
}

interface MeterProps {
  icon: 'energy' | 'health' | 'morale';
  labelKey: string;
  value: number;
}

function getMeterIcon(icon: MeterProps['icon']) {
  if (icon === 'health') {
    return <Heart aria-hidden="true" size={16} />;
  }

  if (icon === 'energy') {
    return <Zap aria-hidden="true" size={16} />;
  }

  return <Sparkles aria-hidden="true" size={16} />;
}

function CombatantMeter({ icon, labelKey, value }: MeterProps) {
  const { t } = useUiStore();

  return (
    <div className={`combatant-meter combatant-meter--${icon}`}>
      <span title={t(labelKey)}>{getMeterIcon(icon)}</span>
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
          <Shield aria-hidden="true" size={16} />
          {t('combatScreen.noActiveEffects')}
        </span>
      </div>
    </aside>
  );
}
