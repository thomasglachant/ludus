import { useMemo, useState } from 'react';
import { DAILY_EVENT_DEFINITIONS } from '../../game-data/events';
import { featureFlags } from '../../config/features';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';

type DebugMenuId = 'root' | 'events';

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
  const { currentSave, triggerDebugDailyEvent } = useGameStore();
  const { openModal, t } = useUiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [menuStack, setMenuStack] = useState<DebugMenuId[]>(['root']);
  const isDebugAvailable = Boolean(featureFlags.enableDebugUi && currentSave);

  const menus = useMemo<Record<DebugMenuId, DebugMenu>>(
    () => ({
      root: {
        id: 'root',
        title: t('debug.title'),
        items: [{ id: 'events', label: t('debug.events'), menuId: 'events' }],
      },
      events: {
        id: 'events',
        title: t('debug.events'),
        items: DAILY_EVENT_DEFINITIONS.map((definition) => ({
          id: definition.id,
          label: t(definition.titleKey),
          onSelect: () => {
            triggerDebugDailyEvent(definition.id);
            openModal({ kind: 'events' });
          },
        })),
      },
    }),
    [openModal, t, triggerDebugDailyEvent],
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
