import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers/AppProviders';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ludus:language', 'en');
  });

  it('creates a new game and reaches the ludus screen', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: /new game/i }));
    await user.type(screen.getByLabelText(/owner name/i), 'Marcus');
    await user.type(screen.getByLabelText(/ludus name/i), 'Ludus Magnus');
    await user.click(screen.getByRole('button', { name: /found the ludus/i }));

    expect(await screen.findByRole('heading', { name: 'Ludus Magnus' })).toBeInTheDocument();
    expect(screen.getByText('Domus level 1')).toBeInTheDocument();
    expect(screen.getAllByText('500')).not.toHaveLength(0);
  });

  it('purchases an empty building slot from the building panel', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: /new game/i }));
    await user.type(screen.getByLabelText(/owner name/i), 'Marcus');
    await user.type(screen.getByLabelText(/ludus name/i), 'Ludus Magnus');
    await user.click(screen.getByRole('button', { name: /found the ludus/i }));
    const canteenButtons = await screen.findAllByRole('button', { name: /canteen/i });

    await user.click(canteenButtons[canteenButtons.length - 1]);

    expect(screen.getByRole('heading', { name: 'Canteen' })).toBeInTheDocument();
    expect(screen.getByText('Cost 120')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(screen.getByText('Domus must reach level 2 first.')).toBeInTheDocument();
    expect(screen.getAllByText('380')).not.toHaveLength(0);
  });

  it('switches the interface language', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: 'French' }));

    expect(screen.getByRole('button', { name: 'Nouvelle partie' })).toBeInTheDocument();
  });
});
