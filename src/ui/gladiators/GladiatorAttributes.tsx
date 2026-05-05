import type { Gladiator } from '../../domain/types';
import { getGladiatorLevel } from '../../domain/gladiators/progression';
import { useUiStore } from '../../state/ui-store-context';
import { IconValueStat } from '../components/IconValueStat';

interface GladiatorAttributesProps {
  gladiator: Pick<
    Gladiator,
    'agility' | 'defense' | 'experience' | 'life' | 'reputation' | 'strength'
  >;
}

export function GladiatorAttributes({ gladiator }: GladiatorAttributesProps) {
  const { t } = useUiStore();

  return (
    <div className="gladiator-attributes">
      <IconValueStat
        iconName="level"
        label={t('gladiatorPanel.level')}
        value={getGladiatorLevel(gladiator)}
      />
      <IconValueStat
        iconName="reputation"
        label={t('gladiatorPanel.reputation')}
        value={gladiator.reputation}
      />
      <IconValueStat
        iconName="health"
        label={t('market.stats.life')}
        value={Math.floor(gladiator.life)}
      />
      <IconValueStat
        iconName="strength"
        label={t('market.stats.strength')}
        value={Math.floor(gladiator.strength)}
      />
      <IconValueStat
        iconName="agility"
        label={t('market.stats.agility')}
        value={Math.floor(gladiator.agility)}
      />
      <IconValueStat
        iconName="defense"
        label={t('market.stats.defense')}
        value={Math.floor(gladiator.defense)}
      />
    </div>
  );
}
