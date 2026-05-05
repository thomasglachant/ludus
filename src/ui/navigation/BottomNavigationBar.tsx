import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import type { PrimaryNavigationKind } from '../game-shell/game-shell-types';
import { ShellWidgetPanel } from '../game-shell/ShellWidgetPanel';
import { RomanButton } from '../game/RomanButton';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface BottomNavigationBarProps {
  activePanelKind: PrimaryNavigationKind;
  save: GameSave;
  onOpenPanel(panelKind: PrimaryNavigationKind): void;
}

const navigationItems: Array<{
  badge?(save: GameSave): number;
  iconName: GameIconName;
  labelKey: string;
  panelKind: PrimaryNavigationKind;
}> = [
  {
    panelKind: 'buildings',
    labelKey: 'navigation.buildings',
    iconName: 'landmark',
  },
  {
    panelKind: 'gladiators',
    labelKey: 'navigation.gladiators',
    iconName: 'capacity',
    badge: (save) => save.gladiators.length,
  },
  {
    panelKind: 'market',
    labelKey: 'navigation.market',
    iconName: 'shoppingCart',
  },
  {
    panelKind: 'planning',
    labelKey: 'navigation.weeklyPlanning',
    iconName: 'weeklyPlanning',
  },
  {
    panelKind: 'finance',
    labelKey: 'navigation.finance',
    iconName: 'treasury',
  },
];

export function BottomNavigationBar({
  activePanelKind,
  save,
  onOpenPanel,
}: BottomNavigationBarProps) {
  const { t } = useUiStore();

  return (
    <ShellWidgetPanel as="nav" className="bottom-navigation" aria-label={t('navigation.title')}>
      <div className="bottom-navigation__items">
        {navigationItems.map((item) => {
          const badge = item.badge?.(save);

          return (
            <RomanButton
              aria-label={t(item.labelKey)}
              aria-current={activePanelKind === item.panelKind ? 'page' : undefined}
              className={activePanelKind === item.panelKind ? 'is-selected' : ''}
              data-testid={`bottom-navigation-${item.panelKind}`}
              key={item.panelKind}
              density="compact"
              tone="ghost"
              type="button"
              onClick={() => onOpenPanel(item.panelKind)}
            >
              <GameIcon name={item.iconName} size={36} />
              <span>{t(item.labelKey)}</span>
              {badge ? <strong>{badge}</strong> : null}
            </RomanButton>
          );
        })}
      </div>
    </ShellWidgetPanel>
  );
}
