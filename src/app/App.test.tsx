import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers/AppProviders';

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'en-US',
    });
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

  it('opens a current building as owned with upgrade as the primary action', async () => {
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

    const buildingPanel = await screen.findByTestId('building-modal');

    expect(within(buildingPanel).getByRole('heading', { name: 'Canteen' })).toBeInTheDocument();
    expect(within(buildingPanel).getByText('Purchased')).toBeInTheDocument();
    expect(within(buildingPanel).getByText('Upgrade cost')).toBeInTheDocument();
    expect(
      within(buildingPanel).queryByRole('button', { name: 'Purchase' }),
    ).not.toBeInTheDocument();
    expect(within(buildingPanel).getByRole('button', { name: 'Upgrade' })).toBeDisabled();
    expect(within(buildingPanel).getByText('Domus must reach level 2 first.')).toBeInTheDocument();
  });

  it('buys an additional dormitory bed through the shared confirmation modal', async () => {
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
    const dormitoryButtons = await screen.findAllByRole('button', { name: /dormitory/i });

    await user.click(dormitoryButtons[dormitoryButtons.length - 1]);

    const buildingPanel = await screen.findByTestId('building-modal');

    expect(within(buildingPanel).getByText('0/1')).toBeInTheDocument();
    expect(within(buildingPanel).getByText('0/2')).toBeInTheDocument();
    expect(within(buildingPanel).getByText('Cost 80')).toBeInTheDocument();

    await user.click(within(buildingPanel).getByRole('button', { name: 'Buy bed' }));

    const dialog = await screen.findByRole('dialog', { name: 'Confirm bed purchase' });

    await user.click(within(dialog).getByRole('button', { name: 'Buy bed' }));

    expect(await within(buildingPanel).findByText('0/2')).toBeInTheDocument();
    expect(within(buildingPanel).getByText('1/2')).toBeInTheDocument();
    expect(within(buildingPanel).getByText('Cost 112')).toBeInTheDocument();
    expect(screen.getAllByText('420')).not.toHaveLength(0);
  });

  it('switches the interface language', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.queryByRole('button', { name: 'French' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Options' }));
    const dialog = screen.getByRole('dialog', { name: 'Options' });

    await user.click(within(dialog).getByRole('button', { name: 'French' }));

    expect(screen.getByRole('button', { name: 'Nouvelle partie' })).toBeInTheDocument();
  });

  it('uses the browser language when no language is stored', () => {
    localStorage.clear();
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'fr-FR',
    });

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.getByRole('button', { name: 'Nouvelle partie' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Français' })).not.toBeInTheDocument();
  });

  it('opens load game from the main menu as a modal', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: 'Load game' }));

    expect(await screen.findByRole('dialog', { name: 'Load game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New game' })).toBeInTheDocument();
  });
});
