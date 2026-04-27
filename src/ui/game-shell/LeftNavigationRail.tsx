import { CalendarCheck, ScrollText, Store, Swords, TriangleAlert } from 'lucide-react';
import type { ContextPanelKind } from './game-shell-types';
import { useUiStore } from '../../state/ui-store-context';

interface LeftNavigationRailProps {
  activePanelKind: ContextPanelKind | null;
  onOpenPanel(panelKind: ContextPanelKind): void;
}

const navigationItems: Array<{
  panelKind: ContextPanelKind;
  labelKey: string;
  icon: typeof CalendarCheck;
}> = [
  { panelKind: 'weeklyPlanning', labelKey: 'navigation.weeklyPlanning', icon: CalendarCheck },
  { panelKind: 'contracts', labelKey: 'navigation.contracts', icon: ScrollText },
  { panelKind: 'events', labelKey: 'navigation.events', icon: TriangleAlert },
  { panelKind: 'market', labelKey: 'navigation.market', icon: Store },
  { panelKind: 'arena', labelKey: 'navigation.arena', icon: Swords },
];

export function LeftNavigationRail({ activePanelKind, onOpenPanel }: LeftNavigationRailProps) {
  const { t } = useUiStore();

  return (
    <nav className="left-navigation-rail" aria-label={t('navigation.title')}>
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            aria-label={t(item.labelKey)}
            className={activePanelKind === item.panelKind ? 'is-selected' : ''}
            data-testid={`navigation-${item.panelKind}`}
            key={item.panelKind}
            type="button"
            onClick={() => onOpenPanel(item.panelKind)}
          >
            <Icon aria-hidden="true" size={19} />
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
