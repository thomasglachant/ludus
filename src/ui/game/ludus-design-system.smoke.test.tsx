// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UiStoreContext, type UiStoreValue } from '../../state/ui-store-context';
import { Tooltip } from '../components/Tooltip';
import { ParchmentModal } from './ParchmentModal';
import { TreasuryBadge } from './ResourceBadge';
import { RomanButton } from './RomanButton';
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
    modalStack: [],
    language: 'en',
    screen: 'mainMenu',
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
    t: (key) => translations[key] ?? key,
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

function click(element: HTMLElement) {
  act(() => {
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

  it('renders RomanButton with the standard money affordance', () => {
    const buttonLabel = 'Hire';
    const amount = 120;
    const { container, root } = render(
      <RomanButton amountMoney={amount}>{buttonLabel}</RomanButton>,
    );
    mountedRoots.push(root);

    const button = container.querySelector('[data-slot="roman-button"]');
    const amountNode = container.querySelector('.roman-button__amount strong');

    expect(button?.textContent).toContain(buttonLabel);
    expect(amountNode?.textContent).toBe(String(amount));
  });

  it('renders resource badges as reusable clickable facts', () => {
    const onClick = vi.fn();
    const { container, root } = render(
      <TreasuryBadge as="button" label="Treasury" value="1,200" onClick={onClick} />,
    );
    mountedRoots.push(root);

    const badgeButton = container.querySelector<HTMLButtonElement>('[data-slot="resource-badge"]');

    expect(badgeButton?.tagName).toBe('BUTTON');
    expect(badgeButton?.type).toBe('button');
    expect(badgeButton?.textContent).toContain('1,200');

    click(badgeButton as HTMLButtonElement);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps ParchmentModal dismiss behavior gated by dismissible', () => {
    const onClose = vi.fn();
    const { container, root } = render(
      <ParchmentModal dismissible={false} titleKey="test.modalTitle" onClose={onClose}>
        <span>{'Body'}</span>
      </ParchmentModal>,
    );
    mountedRoots.push(root);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    click(container.querySelector('.app-modal-backdrop') as HTMLElement);

    expect(container.querySelector('.app-modal')).not.toBeNull();
    expect(container.querySelector('.app-modal__close')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses the dismissible ParchmentModal close button and closes through Radix', () => {
    const onClose = vi.fn();
    const { container, root } = render(
      <ParchmentModal titleKey="test.modalTitle" onClose={onClose}>
        <span>{'Body'}</span>
      </ParchmentModal>,
    );
    mountedRoots.push(root);

    const closeButton = container.querySelector<HTMLButtonElement>('.app-modal__close');

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
          { count: 2, countMax: 4, id: 'staff', label: 'Staff' },
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

    expect(onSelect).toHaveBeenCalledWith('staff');
  });

  it('keeps Tooltip wrapper compatibility while adding the Radix primitive', () => {
    const tooltipText = 'Treasury';
    const iconLabel = 'Coin';
    const { container, root } = render(
      <Tooltip content={tooltipText}>
        <span>{iconLabel}</span>
      </Tooltip>,
    );
    mountedRoots.push(root);

    const tooltip = container.querySelector<HTMLElement>('.tooltip');

    expect(tooltip?.dataset.tooltip).toBe(tooltipText);
    expect(tooltip?.getAttribute('aria-label')).toBe(tooltipText);
    expect(tooltip?.tabIndex).toBe(0);
  });
});
