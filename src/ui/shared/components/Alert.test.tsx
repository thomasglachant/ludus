// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { Alert, type AlertLevel, type AlertProps } from './Alert';

type AlertLevelIsRequired = AlertProps extends { level: AlertLevel } ? true : false;

const alertLevelIsRequired: AlertLevelIsRequired = true;

function render(node: ReactNode) {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.append(container);

  act(() => {
    root.render(node);
  });

  return { container, root };
}

describe('Alert', () => {
  let mountedRoots: Root[] = [];

  afterEach(() => {
    for (const root of mountedRoots) {
      act(() => root.unmount());
    }

    document.body.replaceChildren();
    mountedRoots = [];
  });

  it('renders a description-only info alert as a status', () => {
    const { container, root } = render(<Alert description="Market opens soon." level="info" />);
    mountedRoots.push(root);

    const alert = container.querySelector<HTMLElement>('[data-slot="alert"]');

    expect(alert?.getAttribute('role')).toBe('status');
    expect(alert?.classList.contains('alert--info')).toBe(true);
    expect(alert?.textContent).toContain('Market opens soon.');
    expect(container.querySelector('.alert__title')).toBeNull();
  });

  it('renders title and ReactNode description content', () => {
    const title = 'Dormitory blocked';
    const { container, root } = render(
      <Alert
        description={
          <span>
            {'Capacity '}
            <strong>{'full'}</strong>
          </span>
        }
        level="warning"
        title={title}
      />,
    );
    mountedRoots.push(root);

    const alert = container.querySelector<HTMLElement>('[data-slot="alert"]');

    expect(alert?.getAttribute('role')).toBe('alert');
    expect(container.querySelector('.alert__title')?.textContent).toBe('Dormitory blocked');
    expect(container.querySelector('.alert__description')?.textContent).toBe('Capacity full');
  });

  it('renders error alerts with alert semantics', () => {
    const { container, root } = render(<Alert description="The ludus is full." level="error" />);
    mountedRoots.push(root);

    const alert = container.querySelector<HTMLElement>('[data-slot="alert"]');

    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.classList.contains('alert--error')).toBe(true);
  });

  it('requires an explicit level in the public props type', () => {
    expect(alertLevelIsRequired).toBe(true);
  });
});
