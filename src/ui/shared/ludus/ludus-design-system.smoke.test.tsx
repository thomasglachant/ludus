// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UiStoreContext, type UiStoreValue } from '@/state/ui-store-context';
import { ImpactIndicator } from '@/ui/shared/components/ImpactIndicator';
import { Tooltip } from '@/ui/shared/components/Tooltip';
import { TooltipProvider } from '@/ui/shared/primitives/Tooltip';
import { ActionBar } from './ActionBar';
import { AppDialogShell } from './AppDialogShell';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { GameFact } from './GameFact';
import { GameHero } from './GameHero';
import { GameList, GameListRow } from './GameList';
import { GameMeter } from './GameMeter';
import { PrimaryActionButton } from './PrimaryActionButton';
import { SegmentedControl } from './SegmentedControl';
import { WaxTabletTabs } from './WaxTabletTabs';

const translations: Record<string, string> = {
  'common.back': 'Back',
  'common.close': 'Close',
  'test.modalTitle': 'Modal title',
};

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createUiStore(): UiStoreValue {
  return {
    activeModal: null,
    activeSurface: { kind: 'buildings' },
    modalStack: [],
    language: 'en',
    screen: 'mainMenu',
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
    t: (key) => translations[key] ?? key,
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

function click(element: HTMLElement) {
  act(() => {
    const PointerEventConstructor = window.PointerEvent ?? MouseEvent;

    element.dispatchEvent(new PointerEventConstructor('pointerdown', { bubbles: true, button: 0 }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    element.dispatchEvent(new PointerEventConstructor('pointerup', { bubbles: true, button: 0 }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('Ludus design system smoke flows', () => {
  let mountedRoots: Root[] = [];

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    mountedRoots = [];
  });

  afterEach(() => {
    for (const root of mountedRoots) {
      act(() => root.unmount());
    }

    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('renders Button as the neutral command primitive', () => {
    const buttonLabel = 'Back';
    const { container, root } = render(<Button variant="quiet">{buttonLabel}</Button>);
    mountedRoots.push(root);

    const button = container.querySelector<HTMLButtonElement>('[data-slot="button"]');

    expect(button?.textContent).toContain(buttonLabel);
    expect(button?.classList.contains('button--quiet')).toBe(true);
  });

  it('renders PrimaryActionButton with the standard money affordance', () => {
    const buttonLabel = 'Hire';
    const amount = 120;
    const { container, root } = render(
      <PrimaryActionButton amountMoney={amount}>{buttonLabel}</PrimaryActionButton>,
    );
    mountedRoots.push(root);

    const button = container.querySelector('[data-slot="button"]');
    const amountNode = container.querySelector('.primary-action-button__amount strong');

    expect(button?.textContent).toContain(buttonLabel);
    expect(amountNode?.textContent).toBe(String(amount));
  });

  it('renders IconButton with an accessible label', () => {
    const label = 'Close panel';
    const onClick = vi.fn();
    const { container, root } = render(
      <IconButton aria-label={label} onClick={onClick}>
        <span aria-hidden="true">{'X'}</span>
      </IconButton>,
    );
    mountedRoots.push(root);

    const button = container.querySelector<HTMLButtonElement>('[data-slot="button"]');

    expect(button?.getAttribute('aria-label')).toBe(label);
    expect(button?.classList.contains('icon-button')).toBe(true);

    click(button as HTMLButtonElement);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders SegmentedControl and reports selection changes', () => {
    const onValueChange = vi.fn();
    const { container, root } = render(
      <SegmentedControl
        ariaLabel="Load mode"
        items={[
          { label: 'Normal', value: 'normal' },
          { label: 'Demo', value: 'demo' },
        ]}
        value="normal"
        onValueChange={onValueChange}
      />,
    );
    mountedRoots.push(root);

    const buttons = container.querySelectorAll<HTMLButtonElement>('.segmented-control button');

    expect(buttons[0].classList.contains('is-selected')).toBe(true);

    click(buttons[1]);

    expect(onValueChange).toHaveBeenCalledWith('demo');
  });

  it('renders ActionBar as the shared action layout', () => {
    const { container, root } = render(
      <ActionBar align="center">
        <Button>{'Cancel'}</Button>
        <PrimaryActionButton>{'Confirm'}</PrimaryActionButton>
      </ActionBar>,
    );
    mountedRoots.push(root);

    const actionBar = container.querySelector('[data-slot="action-bar"]');

    expect(actionBar?.classList.contains('action-bar--center')).toBe(true);
    expect(actionBar?.querySelectorAll('button')).toHaveLength(2);
  });

  it('renders GameFact as a reusable clickable resource fact', () => {
    const onClick = vi.fn();
    const { container, root } = render(
      <GameFact
        as="button"
        iconName="treasury"
        label="Treasury"
        showLabel={false}
        value="1,200"
        onClick={onClick}
      />,
    );
    mountedRoots.push(root);

    const badgeButton = container.querySelector<HTMLButtonElement>('[data-slot="game-fact"]');

    expect(badgeButton?.tagName).toBe('BUTTON');
    expect(badgeButton?.type).toBe('button');
    expect(badgeButton?.textContent).toContain('1,200');

    click(badgeButton as HTMLButtonElement);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders GameFact as the shared metric primitive', () => {
    const onClick = vi.fn();
    const { container, root } = render(
      <GameFact
        as="button"
        iconName="reputation"
        label="Reputation"
        surface="light"
        value="24"
        onClick={onClick}
      />,
    );
    mountedRoots.push(root);

    const fact = container.querySelector<HTMLButtonElement>('[data-slot="game-fact"]');

    expect(fact?.tagName).toBe('BUTTON');
    expect(fact?.getAttribute('aria-label')).toBe('Reputation');
    expect(fact?.textContent).toContain('24');

    click(fact as HTMLButtonElement);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders GameMeter with accessible value text', () => {
    const { container, root } = render(
      <GameMeter iconName="happiness" label="Happiness" surface="dark" value={73} />,
    );
    mountedRoots.push(root);

    const meter = container.querySelector<HTMLElement>('[data-slot="game-meter"]');

    expect(meter?.getAttribute('aria-label')).toBe('Happiness: 73%');
    expect(meter?.textContent).toContain('73%');
  });

  it('renders GameList rows with shared facts and actions', () => {
    const onOpen = vi.fn();
    const onAction = vi.fn();
    const rowTitle = 'Dormitory';
    const { container, root } = render(
      <GameList>
        <GameListRow
          actions={[
            {
              id: 'inspect',
              label: 'Inspect',
              onClick: onAction,
            },
          ]}
          facts={[
            {
              iconName: 'level',
              id: 'level',
              label: 'Level',
              value: 2,
            },
          ]}
          openLabel="Open row"
          title={rowTitle}
          onOpen={onOpen}
        />
      </GameList>,
    );
    mountedRoots.push(root);

    expect(container.querySelector('[data-slot="game-list"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="game-list-row"]')?.textContent).toContain(rowTitle);

    click(container.querySelector('.game-list-row__open-button') as HTMLElement);
    click(container.querySelector('.list-action-button') as HTMLElement);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders GameHero as the shared detail header', () => {
    const heroTitle = 'Training yard';
    const { container, root } = render(
      <GameHero
        avatar={<span>{'Avatar'}</span>}
        facts={[
          {
            iconName: 'treasury',
            id: 'cost',
            label: 'Cost',
            value: '400',
          },
        ]}
        level={3}
        levelLabelKey="common.level"
        title={heroTitle}
      />,
    );
    mountedRoots.push(root);

    const hero = container.querySelector('[data-slot="game-hero"]');

    expect(hero?.textContent).toContain(heroTitle);
    expect(hero?.textContent).toContain('400');
    expect(hero?.textContent).toContain('3');
  });

  it('keeps AppDialogShell dismiss behavior gated by dismissible', () => {
    const onClose = vi.fn();
    const { root } = render(
      <AppDialogShell dismissible={false} titleKey="test.modalTitle" onClose={onClose}>
        <span>{'Body'}</span>
      </AppDialogShell>,
    );
    mountedRoots.push(root);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    click(document.body.querySelector('.app-modal-backdrop') as HTMLElement);

    expect(document.body.querySelector('.app-modal')).not.toBeNull();
    expect(document.body.querySelector('.app-modal__close')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses the dismissible AppDialogShell close button and closes through Radix', () => {
    const onClose = vi.fn();
    const { root } = render(
      <AppDialogShell titleKey="test.modalTitle" onClose={onClose}>
        <span>{'Body'}</span>
      </AppDialogShell>,
    );
    mountedRoots.push(root);

    const closeButton = document.body.querySelector<HTMLButtonElement>('.app-modal__close');

    expect(document.activeElement).toBe(closeButton);

    click(closeButton as HTMLButtonElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports WaxTabletTabs selection and count badges', () => {
    const onSelect = vi.fn();
    const tabsLabel = 'Detail tabs';
    const { container, root } = render(
      <WaxTabletTabs
        ariaLabel={tabsLabel}
        items={[
          { id: 'overview', label: 'Overview' },
          { count: 2, countMax: 4, id: 'upgrades', label: 'Upgrades' },
        ]}
        selectedId="overview"
        onSelect={onSelect}
      />,
    );
    mountedRoots.push(root);

    const tabButtons = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    expect(tabButtons[0].classList.contains('is-selected')).toBe(true);
    expect(tabButtons[1].textContent).toContain('2/4');

    click(tabButtons[1]);

    expect(onSelect).toHaveBeenCalledWith('upgrades');
  });

  it('keeps Tooltip wrapper accessibility while using the Radix primitive', () => {
    const tooltipText = 'Treasury';
    const iconLabel = 'Coin';
    const { container, root } = render(
      <Tooltip content={tooltipText}>
        <span>{iconLabel}</span>
      </Tooltip>,
    );
    mountedRoots.push(root);

    const tooltip = container.querySelector<HTMLElement>('.tooltip');

    expect(tooltip?.dataset.tooltip).toBeUndefined();
    expect(tooltip?.getAttribute('aria-label')).toBe(tooltipText);
    expect(tooltip?.tabIndex).toBe(0);
  });

  it('renders percentage suffixes for semantic impact kinds', () => {
    const { container, root } = render(
      <ImpactIndicator
        amount={15}
        amountSuffix="%"
        kind="injuryRisk"
        label="Injury risk"
        tone="negative"
      />,
    );
    mountedRoots.push(root);

    expect(container.querySelector('.impact-indicator__amount')?.textContent).toBe('+15%');
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
