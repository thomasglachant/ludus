import './gladiators.css';
import type { Gladiator } from '@/domain/types';
import { getGladiatorLevel } from '@/domain/gladiators/progression';
import { useUiStore } from '@/state/ui-store-context';
import { Tooltip } from '@/ui/shared/components/Tooltip';
import { formatNumber } from '@/ui/shared/formatters/number';
import { GameFact } from '@/ui/shared/ludus/GameFact';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';

interface GladiatorAttributesProps {
  gladiator: Pick<
    Gladiator,
    'agility' | 'defense' | 'experience' | 'life' | 'reputation' | 'strength'
  >;
}

interface GladiatorAttributeFactProps {
  iconName: GameIconName;
  label: string;
  value: number;
}

function GladiatorAttributeFact({ iconName, label, value }: GladiatorAttributeFactProps) {
  return (
    <Tooltip content={label}>
      <GameFact
        className="icon-value-stat"
        iconName={iconName}
        label={label}
        showLabel={false}
        surface="light"
        value={formatNumber(value)}
      />
    </Tooltip>
  );
}

export function GladiatorAttributes({ gladiator }: GladiatorAttributesProps) {
  const { t } = useUiStore();

  return (
    <div className="gladiator-attributes">
      <GladiatorAttributeFact
        iconName="level"
        label={t('gladiatorPanel.level')}
        value={getGladiatorLevel(gladiator)}
      />
      <GladiatorAttributeFact
        iconName="reputation"
        label={t('gladiatorPanel.reputation')}
        value={gladiator.reputation}
      />
      <GladiatorAttributeFact
        iconName="health"
        label={t('market.stats.life')}
        value={Math.floor(gladiator.life)}
      />
      <GladiatorAttributeFact
        iconName="strength"
        label={t('market.stats.strength')}
        value={Math.floor(gladiator.strength)}
      />
      <GladiatorAttributeFact
        iconName="agility"
        label={t('market.stats.agility')}
        value={Math.floor(gladiator.agility)}
      />
      <GladiatorAttributeFact
        iconName="defense"
        label={t('market.stats.defense')}
        value={Math.floor(gladiator.defense)}
      />
    </div>
  );
}
