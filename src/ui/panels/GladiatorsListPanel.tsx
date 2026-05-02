import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { EntityList, EntityListRow } from '../components/EntityList';
import { PanelShell } from '../components/shared';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';

interface GladiatorsListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenGladiator(gladiatorId: string): void;
}

export function GladiatorsListPanel({ onClose, onOpenGladiator, save }: GladiatorsListPanelProps) {
  const { t } = useUiStore();

  return (
    <PanelShell
      eyebrowKey="roster.eyebrow"
      titleKey="roster.title"
      testId="gladiators-list-panel"
      wide
      onClose={onClose}
    >
      <EntityList emptyMessageKey="ludus.noGladiators">
        {save.gladiators.map((gladiator) => (
          <EntityListRow
            avatar={<GladiatorPortrait gladiator={gladiator} size="small" />}
            info={[
              {
                iconName: 'reputation',
                id: 'reputation',
                label: t('gladiatorPanel.reputation'),
                value: gladiator.reputation,
              },
              {
                iconName: 'health',
                id: 'life',
                label: t('roster.lifeShort'),
                value: Math.floor(gladiator.life),
              },
            ]}
            key={gladiator.id}
            openLabel={t('roster.openGladiator', { name: gladiator.name })}
            subtitle={t('market.record', { wins: gladiator.wins, losses: gladiator.losses })}
            title={gladiator.name}
            onOpen={() => onOpenGladiator(gladiator.id)}
          />
        ))}
      </EntityList>
    </PanelShell>
  );
}
