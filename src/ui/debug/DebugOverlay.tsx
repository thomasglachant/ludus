import { useMemo, useState } from 'react';
import { featureFlags } from '../../config/features';
import { DAYS_OF_WEEK } from '../../game-data/time';
import { GAME_BALANCE } from '../../game-data/balance';
import { getGladiatorExperienceProgress } from '../../domain/gladiators/progression';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';

const TREASURY_ADJUSTMENTS = [100, 1_000, -100, -1_000];

type DebugMenuId =
  | 'root'
  | 'treasury'
  | 'levelUpGladiator'
  | 'injuryAlert'
  | 'advanceToDay'
  | 'timeSpeed';

interface DebugActionItem {
  disabled?: boolean;
  id: string;
  isSelected?: boolean;
  label: string;
  onSelect(): void;
}

interface DebugMenuItem {
  id: string;
  isSelected?: boolean;
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
  const {
    advanceDebugToDay,
    adjustDebugTreasury,
    createDebugInjuryAlert,
    currentSave,
    debugTimeScale,
    levelUpDebugGladiator,
    setDebugTimeScale,
  } = useGameStore();
  const { t } = useUiStore();
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
            id: 'level-up-gladiator',
            label: t('debug.levelUpGladiator'),
            menuId: 'levelUpGladiator',
          },
          {
            id: 'injury-alert',
            label: t('debug.injuryAlert'),
            menuId: 'injuryAlert',
          },
          { id: 'advance-to-day', label: t('debug.advanceToDay'), menuId: 'advanceToDay' },
          { id: 'time-speed', label: t('debug.timeSpeed'), menuId: 'timeSpeed' },
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
      levelUpGladiator: {
        id: 'levelUpGladiator',
        title: t('debug.levelUpGladiator'),
        items:
          currentSave && currentSave.gladiators.length > 0
            ? currentSave.gladiators.map((gladiator) => {
                const progress = getGladiatorExperienceProgress(gladiator);
                const nextLevel =
                  progress.nextLevelStart === undefined ? progress.level : progress.level + 1;

                return {
                  id: `level-up-gladiator-${gladiator.id}`,
                  disabled: progress.nextLevelStart === undefined,
                  label: t('debug.gladiatorLevelUpOption', {
                    name: gladiator.name,
                    level: progress.level,
                    nextLevel,
                    xp: progress.experience,
                  }),
                  onSelect: () => levelUpDebugGladiator(gladiator.id),
                };
              })
            : [
                {
                  id: 'level-up-gladiator-empty',
                  disabled: true,
                  label: t('common.emptyList'),
                  onSelect: () => undefined,
                },
              ],
      },
      injuryAlert: {
        id: 'injuryAlert',
        title: t('debug.injuryAlert'),
        items:
          currentSave && currentSave.gladiators.length > 0
            ? currentSave.gladiators.map((gladiator) => ({
                id: `injury-alert-${gladiator.id}`,
                label: t('debug.injuryAlertOption', { name: gladiator.name }),
                onSelect: () => createDebugInjuryAlert(gladiator.id),
              }))
            : [
                {
                  id: 'injury-alert-empty',
                  disabled: true,
                  label: t('common.emptyList'),
                  onSelect: () => undefined,
                },
              ],
      },
      advanceToDay: {
        id: 'advanceToDay',
        title: t('debug.advanceToDay'),
        items: DAYS_OF_WEEK.map((dayOfWeek) => ({
          id: `advance-to-day-${dayOfWeek}`,
          isSelected: currentSave?.time.dayOfWeek === dayOfWeek,
          label: t('debug.advanceToDayOption', { day: t(`days.${dayOfWeek}`) }),
          onSelect: () => advanceDebugToDay(dayOfWeek),
        })),
      },
      timeSpeed: {
        id: 'timeSpeed',
        title: t('debug.timeSpeed'),
        items: GAME_BALANCE.debug.timeScaleOptions.map((multiplier) => ({
          id: `time-speed-${multiplier}`,
          isSelected: debugTimeScale === multiplier,
          label: t('debug.timeSpeedOption', { multiplier }),
          onSelect: () => setDebugTimeScale(multiplier),
        })),
      },
    }),
    [
      advanceDebugToDay,
      adjustDebugTreasury,
      createDebugInjuryAlert,
      currentSave,
      debugTimeScale,
      levelUpDebugGladiator,
      setDebugTimeScale,
      t,
    ],
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
            aria-pressed={item.isSelected}
            className={item.isSelected ? 'is-selected' : undefined}
            data-testid={`debug-item-${item.id}`}
            disabled={!isMenuItem(item) && item.disabled}
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
