import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import type { ContextPanelKind } from '../game-shell/game-shell-types';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface BottomNavigationBarProps {
  activePanelKind: ContextPanelKind | null;
  save: GameSave;
  onOpenPanel(panelKind: ContextPanelKind): void;
}

const navigationItems: Array<{
  badge?(save: GameSave): number;
  iconName: GameIconName;
  labelKey: string;
  panelKind: ContextPanelKind;
}> = [
  {
    panelKind: 'buildingsList',
    labelKey: 'navigation.buildings',
    iconName: 'landmark',
  },
  {
    panelKind: 'gladiatorsList',
    labelKey: 'navigation.gladiators',
    iconName: 'capacity',
    badge: (save) => save.gladiators.length,
  },
  {
    panelKind: 'staffList',
    labelKey: 'navigation.staff',
    iconName: 'workforce',
    badge: (save) => save.staff.members.length,
  },
  {
    panelKind: 'weeklyPlanning',
    labelKey: 'navigation.weeklyPlanning',
    iconName: 'weeklyPlanning',
  },
  {
    panelKind: 'finance',
    labelKey: 'navigation.finance',
    iconName: 'treasury',
  },
  {
    panelKind: 'events',
    labelKey: 'navigation.events',
    iconName: 'events',
    badge: (save) => save.events.pendingEvents.length,
  },
];

export function BottomNavigationBar({
  activePanelKind,
  save,
  onOpenPanel,
}: BottomNavigationBarProps) {
  const { t } = useUiStore();

  return (
    <nav className="bottom-navigation" aria-label={t('navigation.title')}>
      <div className="bottom-navigation__items">
        {navigationItems.map((item) => {
          const badge = item.badge?.(save);

          return (
            <button
              aria-label={t(item.labelKey)}
              className={activePanelKind === item.panelKind ? 'is-selected' : ''}
              data-testid={`bottom-navigation-${item.panelKind}`}
              key={item.panelKind}
              type="button"
              onClick={() => onOpenPanel(item.panelKind)}
            >
              <GameIcon name={item.iconName} size={36} />
              <span>{t(item.labelKey)}</span>
              {badge ? <strong>{badge}</strong> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
