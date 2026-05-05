// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  BuildingId,
  GameAlert,
  GameNotification,
  GameSave,
  Gladiator,
} from '../../domain/types';
import { refreshGameAlerts } from '../../domain/alerts/alert-actions';
import { synchronizePlanning } from '../../domain/planning/planning-actions';
import { createInitialSave } from '../../domain/saves/create-initial-save';
import { applyGladiatorTrait } from '../../domain/gladiator-traits/gladiator-trait-actions';
import { UiStoreContext, type UiStoreValue } from '../../state/ui-store-context';
import { SideMenu } from './SideMenu';

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    activeSurface: { kind: 'buildings' },
    modalStack: [],
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    closeContextSheet: vi.fn(),
    closeSurface: vi.fn(),
    openContextSheet: vi.fn(),
    openEntity: vi.fn(),
    openModal: vi.fn(),
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    openSurface: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
    resetSurface: vi.fn(),
    setLanguage: vi.fn(),
    navigate: vi.fn(),
    t: (key, params) => {
      if (key === 'traits.injury.name') {
        return 'Injury';
      }

      if (key === 'traits.duration.remainingDays') {
        return `${params?.count} days remaining`;
      }

      if (key === 'buildings.canteen.name') {
        return 'Canteen';
      }

      if (key === 'buildings.domus.name') {
        return 'Domus';
      }

      if (key === 'buildings.dormitory.name') {
        return 'Dormitory';
      }

      if (key === 'test.alert.building') {
        return 'Maintenance needed';
      }

      if (key === 'alerts.openRegister.title') {
        return 'Open register';
      }

      if (key === 'alerts.emptyPlanning.title') {
        return 'Empty planning';
      }

      if (key === 'test.alert.general') {
        return 'General warning';
      }

      if (key === 'test.alert.critical') {
        return 'Critical warning';
      }

      if (key === 'test.alert.criticalFollowUp') {
        return 'Critical follow-up';
      }

      if (key === 'buildingsOverview.noAlerts') {
        return 'No active alert.';
      }

      if (key === 'notifications.title') {
        return 'Notifications';
      }

      if (key === 'notifications.empty') {
        return 'No notification.';
      }

      if (key === 'notifications.viewAll') {
        return 'View all notifications';
      }

      if (key === 'notifications.archive') {
        return 'Archive notification';
      }

      if (key === 'notifications.archived') {
        return 'Archived';
      }

      if (key === 'notifications.dateLabel') {
        return `${params?.day} · Week ${params?.week}, year ${params?.year}`;
      }

      if (key === 'notifications.injury.title') {
        return `${params?.name} was injured`;
      }

      if (key === 'notifications.injury.description') {
        return `${params?.name} must recover`;
      }

      return key;
    },
  };
}

function createGladiator(): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Marcus',
    age: 27,
    experience: 0,
    strength: 5,
    agility: 5,
    defense: 5,
    life: 5,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [{ traitId: 'disciplined' }],
  };
}

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });

  return {
    ...save,
    ...overrides,
  };
}

function render(node: ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(<UiStoreContext.Provider value={createUiStore()}>{node}</UiStoreContext.Provider>);
  });

  return { container, root };
}

function cleanup(container: HTMLElement, root: Root) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

function getAlertButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button.side-menu__alert'),
  ).find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Missing alert button ${label}`);
  }

  return button;
}

function renderSideMenu(
  save: GameSave,
  handlers: Partial<{
    onArchiveNotification(notificationId: string): void;
    onOpenBuilding(buildingId: BuildingId): void;
    onOpenGladiator(gladiatorId: string): void;
    onOpenMarket(): void;
    onOpenNotifications(): void;
    onOpenWeeklyPlanning(): void;
  }> = {},
) {
  return render(
    <SideMenu
      save={save}
      onArchiveNotification={handlers.onArchiveNotification ?? vi.fn()}
      onOpenBuilding={handlers.onOpenBuilding ?? vi.fn()}
      onOpenGladiator={handlers.onOpenGladiator ?? vi.fn()}
      onOpenMarket={handlers.onOpenMarket ?? vi.fn()}
      onOpenNotifications={handlers.onOpenNotifications ?? vi.fn()}
      onOpenWeeklyPlanning={handlers.onOpenWeeklyPlanning ?? vi.fn()}
    />,
  );
}

describe('SideMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders gladiator alert subjects with the gladiator portrait and name', () => {
    const gladiator = createGladiator();
    const save = refreshGameAlerts(
      synchronizePlanning(
        applyGladiatorTrait(createTestSave({ gladiators: [gladiator] }), 'injury', 2, gladiator.id),
      ),
    );
    const { container, root } = renderSideMenu(save);

    expect(container.textContent).toContain('Marcus');
    expect(container.textContent).toContain('Injury');
    expect(container.textContent).toContain('2 days remaining');
    expect(container.querySelector('.side-menu__alert .gladiator-portrait')).not.toBeNull();

    cleanup(container, root);
  });

  it('renders building alert subjects with the building name and opens the building', () => {
    const onOpenBuilding = vi.fn();
    const buildingAlert: GameAlert = {
      id: 'alert-canteen-maintenance',
      severity: 'warning',
      titleKey: 'test.alert.building',
      descriptionKey: 'test.alert.building',
      buildingId: 'canteen',
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const save = createTestSave({
      planning: {
        ...createTestSave().planning,
        alerts: [buildingAlert],
      },
    });
    const { container, root } = renderSideMenu(save, { onOpenBuilding });

    const alertButton = getAlertButton(container, 'Canteen');
    expect(alertButton.textContent).toContain('Maintenance needed');
    expect(alertButton.querySelector('.side-menu__alert-copy span')).toBeNull();
    expect(alertButton.querySelector('.building-modal-avatar')).not.toBeNull();

    act(() => {
      alertButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenBuilding).toHaveBeenCalledWith('canteen');

    cleanup(container, root);
  });

  it('routes open-market building alerts to the market action', () => {
    const onOpenBuilding = vi.fn();
    const onOpenMarket = vi.fn();
    const marketAlert: GameAlert = {
      id: 'alert-dormitory-open-register',
      severity: 'info',
      titleKey: 'alerts.openRegister.title',
      descriptionKey: 'alerts.openRegister.description',
      actionKind: 'openMarket',
      buildingId: 'dormitory',
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const save = createTestSave({
      planning: {
        ...createTestSave().planning,
        alerts: [marketAlert],
      },
    });
    const { container, root } = renderSideMenu(save, { onOpenBuilding, onOpenMarket });

    const alertButton = getAlertButton(container, 'Dormitory');
    expect(alertButton.textContent).toContain('Open register');
    expect(alertButton.querySelector('.building-modal-avatar')).not.toBeNull();

    act(() => {
      alertButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenMarket).toHaveBeenCalledTimes(1);
    expect(onOpenBuilding).not.toHaveBeenCalled();

    cleanup(container, root);
  });

  it('routes global planning action alerts to weekly planning', () => {
    const onOpenWeeklyPlanning = vi.fn();
    const planningAlert: GameAlert = {
      id: 'alert-weekly-planning-empty',
      severity: 'critical',
      titleKey: 'alerts.emptyPlanning.title',
      descriptionKey: 'alerts.emptyPlanning.description',
      actionKind: 'openWeeklyPlanning',
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const save = createTestSave({
      planning: {
        ...createTestSave().planning,
        alerts: [planningAlert],
      },
    });
    const { container, root } = renderSideMenu(save, { onOpenWeeklyPlanning });

    const alertButton = getAlertButton(container, 'Empty planning');
    expect(alertButton.querySelector('.side-menu__alert-icon')).not.toBeNull();

    act(() => {
      alertButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenWeeklyPlanning).toHaveBeenCalledTimes(1);

    cleanup(container, root);
  });

  it('renders untargeted alerts without a shortcut button', () => {
    const generalAlert: GameAlert = {
      id: 'alert-general',
      severity: 'info',
      titleKey: 'test.alert.general',
      descriptionKey: 'test.alert.general',
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const save = createTestSave({
      planning: {
        ...createTestSave().planning,
        alerts: [generalAlert],
      },
    });
    const { container, root } = renderSideMenu(save);

    expect(container.textContent).toContain('General warning');
    expect(container.querySelector('button.side-menu__alert')).toBeNull();

    cleanup(container, root);
  });

  it('sorts alerts from highest to lowest severity and keeps same-severity order', () => {
    const alerts: GameAlert[] = [
      {
        id: 'alert-info',
        severity: 'info',
        titleKey: 'test.alert.general',
        descriptionKey: 'test.alert.general',
        createdAt: '2026-05-01T08:00:00.000Z',
      },
      {
        id: 'alert-critical',
        severity: 'critical',
        titleKey: 'test.alert.critical',
        descriptionKey: 'test.alert.critical',
        createdAt: '2026-05-01T08:00:00.000Z',
      },
      {
        id: 'alert-warning',
        severity: 'warning',
        titleKey: 'test.alert.building',
        descriptionKey: 'test.alert.building',
        createdAt: '2026-05-01T08:00:00.000Z',
      },
      {
        id: 'alert-critical-follow-up',
        severity: 'critical',
        titleKey: 'test.alert.criticalFollowUp',
        descriptionKey: 'test.alert.criticalFollowUp',
        createdAt: '2026-05-01T08:00:00.000Z',
      },
    ];
    const save = createTestSave({
      planning: {
        ...createTestSave().planning,
        alerts,
      },
    });
    const { container, root } = renderSideMenu(save);

    const titles = Array.from(container.querySelectorAll('.side-menu__alert-copy strong')).map(
      (title) => title.textContent,
    );

    expect(titles).toEqual([
      'Critical warning',
      'Critical follow-up',
      'Maintenance needed',
      'General warning',
    ]);

    cleanup(container, root);
  });

  it('renders active notifications, routes clickable targets and archives them', () => {
    const onArchiveNotification = vi.fn();
    const onOpenGladiator = vi.fn();
    const gladiator = createGladiator();
    const notifications: GameNotification[] = [
      {
        id: 'archived-notification',
        occurredAt: { year: 1, week: 1, dayOfWeek: 'monday' },
        titleKey: 'notifications.injury.title',
        descriptionKey: 'notifications.injury.description',
        params: { name: 'Archived' },
        archivedAt: { year: 1, week: 1, dayOfWeek: 'tuesday' },
      },
      {
        id: 'active-notification',
        occurredAt: { year: 1, week: 1, dayOfWeek: 'wednesday' },
        titleKey: 'notifications.injury.title',
        descriptionKey: 'notifications.injury.description',
        params: { name: 'Marcus' },
        target: { kind: 'gladiator', gladiatorId: gladiator.id },
      },
    ];
    const save = createTestSave({ gladiators: [gladiator], notifications });
    const { container, root } = renderSideMenu(save, { onArchiveNotification, onOpenGladiator });

    expect(container.textContent).toContain('Marcus was injured');
    expect(container.textContent).not.toContain('Archived was injured');

    const notificationButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="notification-active-notification"] .notification-card__body',
    );
    const archiveButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="notification-archive-active-notification"]',
    );

    expect(notificationButton).not.toBeNull();
    expect(archiveButton).not.toBeNull();

    act(() => {
      notificationButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenGladiator).toHaveBeenCalledWith(gladiator.id);

    act(() => {
      archiveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onArchiveNotification).toHaveBeenCalledWith('active-notification');

    cleanup(container, root);
  });

  it('opens the full notifications surface from the side menu', () => {
    const onOpenNotifications = vi.fn();
    const save = createTestSave();
    const { container, root } = renderSideMenu(save, { onOpenNotifications });
    const viewAllButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="side-menu-view-notifications"]',
    );

    expect(viewAllButton).not.toBeNull();

    act(() => {
      viewAllButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenNotifications).toHaveBeenCalledTimes(1);

    cleanup(container, root);
  });
});
