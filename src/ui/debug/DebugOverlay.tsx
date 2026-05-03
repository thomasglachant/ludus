import { useMemo, useState } from 'react';
import { featureFlags } from '../../config/features';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';

const TREASURY_ADJUSTMENTS = [100, 1_000, -100, -1_000];

type DebugMenuId = 'root' | 'treasury';

interface DebugActionItem {
  id: string;
  label: string;
  onSelect(): void;
}

interface DebugMenuItem {
  id: string;
  label: string;
  menuId: DebugMenuId;
}

type DebugItem = DebugActionItem | DebugMenuItem;

interface DebugMenu {
  id: DebugMenuId;
  title: string;
  items: DebugItem[];
}

function isMenuItem(item: DebugItem): item is DebugMenuItem {
  return 'menuId' in item;
}

export function DebugOverlay() {
  const { currentSave, adjustDebugTreasury } = useGameStore();
  const { isPixiDebugEnabled, t, togglePixiDebug } = useUiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [menuStack, setMenuStack] = useState<DebugMenuId[]>(['root']);
  const isDebugAvailable = Boolean(featureFlags.enableDebugUi && currentSave);

  const menus = useMemo<Record<DebugMenuId, DebugMenu>>(
    () => ({
      root: {
        id: 'root',
        title: t('debug.title'),
        items: [
          { id: 'treasury', label: t('debug.treasury'), menuId: 'treasury' },
          {
            id: 'pixi-debug',
            label: t(isPixiDebugEnabled ? 'debug.pixiDebugOn' : 'debug.pixiDebugOff'),
            onSelect: togglePixiDebug,
          },
        ],
      },
      treasury: {
        id: 'treasury',
        title: t('debug.treasury'),
        items: TREASURY_ADJUSTMENTS.map((amount) => ({
          id: `treasury-${amount}`,
          label: t('debug.treasuryAdjustment', { amount: amount > 0 ? `+${amount}` : amount }),
          onSelect: () => adjustDebugTreasury(amount),
        })),
      },
    }),
    [adjustDebugTreasury, isPixiDebugEnabled, t, togglePixiDebug],
  );

  if (!isDebugAvailable || !isOpen) {
    return isDebugAvailable ? (
      <button className="debug-tab" type="button" onClick={() => setIsOpen(true)}>
        {t('debug.title')}
      </button>
    ) : null;
  }

  const activeMenuId = menuStack[menuStack.length - 1];
  const activeMenu = menus[activeMenuId];

  return (
    <aside className="debug-overlay" aria-label={t('debug.ariaLabel')}>
      <div className="debug-overlay__header">
        <strong>{activeMenu.title}</strong>
        <button type="button" onClick={() => setIsOpen(false)}>
          {t('common.close')}
        </button>
      </div>
      {menuStack.length > 1 ? (
        <button
          className="debug-overlay__back"
          type="button"
          onClick={() => setMenuStack((stack) => stack.slice(0, -1))}
        >
          {t('common.back')}
        </button>
      ) : null}
      <div className="debug-overlay__items">
        {activeMenu.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (isMenuItem(item)) {
                setMenuStack((stack) => [...stack, item.menuId]);
                return;
              }

              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
