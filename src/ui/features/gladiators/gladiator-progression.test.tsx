// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createInitialSave } from '@/domain/saves/create-initial-save';
import { applyGladiatorTrait } from '@/domain/gladiator-traits/gladiator-trait-actions';
import type { GameSave, Gladiator } from '@/domain/types';
import { GLADIATOR_TRAIT_DEFINITIONS } from '@/game-data/gladiator-traits';
import { UiStoreContext, type UiStoreValue } from '@/state/ui-store-context';
import { GAME_ICON_DEFINITIONS } from '@/ui/shared/icons/game-icon-definitions';
import { TooltipProvider } from '@/ui/shared/primitives/Tooltip';
import { GladiatorExperienceBar } from './GladiatorExperienceBar';
import { GladiatorListRow } from './GladiatorListRow';
import { GladiatorSkillBars } from './GladiatorSkillBars';
import { GladiatorTraits } from './GladiatorTraits';

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
      if (key === 'common.xpSymbol') {
        return 'XP';
      }

      if (key.startsWith('market.stats.')) {
        return key.replace('market.stats.', '');
      }

      if (key === 'gladiatorPanel.experienceProgressValue') {
        return `${params?.current}/${params?.maximum} XP`;
      }

      if (key === 'gladiatorPanel.experienceProgressLabel') {
        return `Experience progress: ${params?.value}`;
      }

      if (key === 'gladiatorPanel.allocateSkillPoint') {
        return `Assign one point to ${params?.skill}`;
      }

      return key;
    },
  };
}

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 20,
    experience: 120,
    strength: 3,
    agility: 3,
    defense: 2,
    life: 2,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function createTestSave(gladiator: Gladiator): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  return {
    ...save,
    gladiators: [gladiator],
  };
}

function render(node: ReactNode) {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.append(container);

  act(() => {
    root.render(
      <UiStoreContext.Provider value={createUiStore()}>
        <TooltipProvider delayDuration={100}>{node}</TooltipProvider>
      </UiStoreContext.Provider>,
    );
  });

  return { container, root };
}

describe('gladiator progression UI', () => {
  const mountedRoots: Root[] = [];

  afterEach(() => {
    for (const root of mountedRoots) {
      act(() => root.unmount());
    }

    mountedRoots.length = 0;
    document.body.replaceChildren();
  });

  it('renders skill segments, allocation controls and current-level XP progress', () => {
    const onAllocate = vi.fn();
    const { container, root } = render(
      <>
        <GladiatorSkillBars
          gladiator={createGladiator()}
          mode="allocation"
          onAllocateSkillPoint={onAllocate}
        />
        <GladiatorExperienceBar gladiator={createGladiator()} />
      </>,
    );
    mountedRoots.push(root);

    const filledSegments = container.querySelectorAll('.gladiator-skill-bars__segment--filled');
    const allocationButtons = container.querySelectorAll<HTMLButtonElement>(
      '.gladiator-skill-bars__allocate',
    );
    const experienceBar = container.querySelector('.gladiator-xp-bar');

    expect(filledSegments).toHaveLength(10);
    expect(allocationButtons).toHaveLength(4);
    expect(experienceBar?.textContent).toContain('XP');
    expect(experienceBar?.textContent).toContain('20/130 XP');

    act(() => {
      allocationButtons[0].click();
    });

    expect(onAllocate).toHaveBeenCalledWith('strength');
  });

  it('renders active gladiator trait badges for a gladiator', () => {
    const gladiator = createGladiator();
    const save = applyGladiatorTrait(createTestSave(gladiator), 'injury', 2, gladiator.id);
    const { container, root } = render(<GladiatorTraits gladiator={gladiator} save={save} />);
    mountedRoots.push(root);

    expect(container.querySelector('.gladiator-traits__badge')).not.toBeNull();
    expect(container.textContent).toContain('traits.duration.shortDays');
  });

  it('uses valid icon definitions for every gladiator trait visual', () => {
    for (const definition of GLADIATOR_TRAIT_DEFINITIONS) {
      expect(definition.visual.iconName in GAME_ICON_DEFINITIONS).toBe(true);
    }

    expect(
      GLADIATOR_TRAIT_DEFINITIONS.find((definition) => definition.id === 'fragile')?.visual
        .iconName,
    ).toBe('injuryRisk');
  });

  it('renders trait durations in gladiator list rows from the current save', () => {
    const gladiator = createGladiator();
    const save = applyGladiatorTrait(createTestSave(gladiator), 'injury', 2, gladiator.id);
    const { container, root } = render(<GladiatorListRow gladiator={gladiator} save={save} />);
    mountedRoots.push(root);

    expect(container.querySelector('.gladiator-traits__badge')).not.toBeNull();
    expect(container.textContent).toContain('traits.duration.shortDays');
  });
});
