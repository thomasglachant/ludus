import type { ContextPanelKind } from './game-shell-types';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface LeftNavigationRailProps {
  activePanelKind: ContextPanelKind | null;
  onOpenPanel(panelKind: ContextPanelKind): void;
}

const navigationItems: Array<{
  panelKind: ContextPanelKind;
  labelKey: string;
  iconName: GameIconName;
}> = [
  {
    panelKind: 'weeklyPlanning',
    labelKey: 'navigation.weeklyPlanning',
    iconName: 'weeklyPlanning',
  },
  { panelKind: 'contracts', labelKey: 'navigation.contracts', iconName: 'contracts' },
  { panelKind: 'events', labelKey: 'navigation.events', iconName: 'events' },
];

export function LeftNavigationRail({ activePanelKind, onOpenPanel }: LeftNavigationRailProps) {
  const { t } = useUiStore();

  return (
    <nav className="left-navigation-rail" aria-label={t('navigation.title')}>
      {navigationItems.map((item) => {
        return (
          <button
            aria-label={t(item.labelKey)}
            className={activePanelKind === item.panelKind ? 'is-selected' : ''}
            data-testid={`navigation-${item.panelKind}`}
            key={item.panelKind}
            type="button"
            onClick={() => onOpenPanel(item.panelKind)}
          >
            <GameIcon name={item.iconName} size={19} />
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
