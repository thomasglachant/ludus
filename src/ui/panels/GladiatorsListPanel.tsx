import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { EmptyState, MetricList, PanelShell, SectionCard } from '../components/shared';
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
      {save.gladiators.length > 0 ? (
        <div className="planning-card-grid">
          {save.gladiators.map((gladiator) => (
            <SectionCard className="context-panel__portrait-row" key={gladiator.id}>
              <GladiatorPortrait gladiator={gladiator} size="small" />
              <span className="context-panel__identity-stack">
                <strong>{gladiator.name}</strong>
                <MetricList
                  columns={3}
                  items={[
                    { labelKey: 'roster.healthShort', value: gladiator.health },
                    { labelKey: 'roster.energyShort', value: gladiator.energy },
                    { labelKey: 'roster.moraleShort', value: gladiator.morale },
                  ]}
                />
              </span>
              <div className="context-panel__actions">
                <button type="button" onClick={() => onOpenGladiator(gladiator.id)}>
                  <span>{t('common.open')}</span>
                </button>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState messageKey="ludus.noGladiators" />
      )}
    </PanelShell>
  );
}
