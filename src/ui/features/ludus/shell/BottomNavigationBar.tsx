import './bottom-navigation.css';
import type { GameSave } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import type { PrimaryNavigationKind } from '@/ui/features/ludus/shell/game-shell-types';
import { ShellWidgetPanel } from '@/ui/features/ludus/shell/ShellWidgetPanel';
import { Button } from '@/ui/shared/ludus/Button';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

interface BottomNavigationBarProps {
  activePanelKind?: PrimaryNavigationKind;
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

function BottomNavItem({
  badge,
  iconName,
  isSelected,
  label,
  panelKind,
  onOpenPanel,
}: {
  badge?: number;
  iconName: GameIconName;
  isSelected: boolean;
  label: string;
  panelKind: PrimaryNavigationKind;
  onOpenPanel(panelKind: PrimaryNavigationKind): void;
}) {
  return (
    <Button
      aria-label={label}
      aria-current={isSelected ? 'page' : undefined}
      className={isSelected ? 'is-selected' : ''}
      data-testid={`bottom-navigation-${panelKind}`}
      density="compact"
      variant="ghost"
      type="button"
      onClick={() => onOpenPanel(panelKind)}
    >
      <GameIcon name={iconName} size={36} />
      <span>{label}</span>
      {badge ? <strong>{badge}</strong> : null}
    </Button>
  );
}

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
            <BottomNavItem
              badge={badge}
              iconName={item.iconName}
              isSelected={activePanelKind === item.panelKind}
              key={item.panelKind}
              label={t(item.labelKey)}
              panelKind={item.panelKind}
              onOpenPanel={onOpenPanel}
            />
          );
        })}
      </div>
    </ShellWidgetPanel>
  );
}
