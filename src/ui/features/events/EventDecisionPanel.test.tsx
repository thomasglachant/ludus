// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createInitialSave } from '@/domain/saves/create-initial-save';
import type { GameEvent } from '@/domain/types';
import { UiStoreContext, type UiStoreValue } from '@/state/ui-store-context';
import { TooltipProvider } from '@/ui/shared/primitives/Tooltip';
import { EventDecisionPanel } from './EventDecisionPanel';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

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
      const labels: Record<string, string> = {
        'common.xpSymbol': 'XP',
        'events.debtCrisis.title': 'Debt crisis',
        'events.debtCrisis.description': 'Debt crisis description',
        'events.debtCrisis.abandon.label': 'I abandon',
        'events.debtCrisis.abandon.consequence': 'End the game now.',
        'events.debtCrisis.recover.label': 'I will recover',
        'events.debtCrisis.recover.consequence': 'Try to recover.',
        'events.empty.title': 'Empty event',
        'events.empty.description': 'Empty event description',
        'events.empty.choice.label': 'Apply hidden effect',
        'events.empty.choice.consequence': 'This has no visible impact.',
        'events.outcome.gameLost': 'Game over',
      };

      if (key === 'events.outcome.debtGrace') {
        return `${params?.days} days to recover`;
      }

      return labels[key] ?? key;
    },
  };
}

function renderEventPanel(event: GameEvent) {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.append(container);

  act(() => {
    root.render(
      <UiStoreContext.Provider value={createUiStore()}>
        <TooltipProvider delayDuration={100}>
          <EventDecisionPanel
            event={event}
            save={createTestSave()}
            onClose={vi.fn()}
            onOpenGladiator={vi.fn()}
            onResolveEventChoice={vi.fn()}
          />
        </TooltipProvider>
      </UiStoreContext.Provider>,
    );
  });

  return { container, root };
}

function cleanup(container: HTMLElement, root: Root) {
  act(() => root.unmount());
  container.remove();
}

describe('EventDecisionPanel', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders debt crisis consequences as visible impact indicators', () => {
    const event: GameEvent = {
      id: 'event-debt',
      definitionId: 'debtCrisis',
      source: 'reactive',
      titleKey: 'events.debtCrisis.title',
      descriptionKey: 'events.debtCrisis.description',
      status: 'pending',
      createdAtYear: 1,
      createdAtWeek: 1,
      createdAtDay: 'monday',
      choices: [
        {
          id: 'abandon',
          labelKey: 'events.debtCrisis.abandon.label',
          consequenceKey: 'events.debtCrisis.abandon.consequence',
          consequences: [{ kind: 'certain', effects: [{ type: 'setGameLost' }] }],
        },
        {
          id: 'recover',
          labelKey: 'events.debtCrisis.recover.label',
          consequenceKey: 'events.debtCrisis.recover.consequence',
          consequences: [{ kind: 'certain', effects: [{ type: 'startDebtGrace' }] }],
        },
      ],
    };
    const { container, root } = renderEventPanel(event);

    expect(container.textContent).toContain('Game over');
    expect(container.textContent).toContain('7 days to recover');
    expect(container.querySelectorAll('.events-panel__impact li')).toHaveLength(2);

    cleanup(container, root);
  });

  it('does not render an empty impact list when no indicators are available', () => {
    const event: GameEvent = {
      id: 'event-empty-impact',
      definitionId: 'emptyImpact',
      titleKey: 'events.empty.title',
      descriptionKey: 'events.empty.description',
      status: 'pending',
      createdAtYear: 1,
      createdAtWeek: 1,
      createdAtDay: 'monday',
      gladiatorId: 'gladiator-test',
      choices: [
        {
          id: 'hidden',
          labelKey: 'events.empty.choice.label',
          consequenceKey: 'events.empty.choice.consequence',
          consequences: [
            {
              kind: 'certain',
              effects: [
                {
                  type: 'applyGladiatorTrait',
                  gladiatorId: 'gladiator-test',
                  traitId: 'rest',
                  durationDays: 1,
                },
              ],
            },
          ],
        },
      ],
    };
    const { container, root } = renderEventPanel(event);

    expect(container.querySelector('.events-panel__impact')).toBeNull();
    expect(container.querySelector('ul')).toBeNull();

    cleanup(container, root);
  });
});
