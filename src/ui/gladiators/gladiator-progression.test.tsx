// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Gladiator } from '../../domain/types';
import { UiStoreContext, type UiStoreValue } from '../../state/ui-store-context';
import { GladiatorExperienceBar } from './GladiatorExperienceBar';
import { GladiatorSkillBars } from './GladiatorSkillBars';

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    modalStack: [],
    language: 'en',
    screen: 'ludus',
    backModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    openModal: vi.fn(),
    openConfirmModal: vi.fn(),
    openFormModal: vi.fn(),
    pushModal: vi.fn(),
    replaceModal: vi.fn(),
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

function render(node: ReactNode) {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.append(container);

  act(() => {
    root.render(<UiStoreContext.Provider value={createUiStore()}>{node}</UiStoreContext.Provider>);
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
});
