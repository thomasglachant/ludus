import { render, screen, waitFor, within } from '@testing-library/react';
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
    window.history.replaceState(null, '', '/');
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

    const map = await screen.findByTestId('map-container');
    const domusMapLocation = screen.getByTestId('map-building-domus');

    expect(map).toHaveAttribute('data-time-of-day', 'day');
    expect(map.style.getPropertyValue('--map-background-image')).toContain(
      '/assets/pixel-art/map/backgrounds/ludus-map-day.svg',
    );
    expect(domusMapLocation.getAttribute('data-asset')).toContain(
      '/assets/pixel-art/buildings/domus/level-1/exterior.svg',
    );
    expect(await screen.findByRole('heading', { name: 'Ludus Magnus' })).toBeInTheDocument();
    expect(screen.getByText('Domus level 1')).toBeInTheDocument();
    expect(screen.getAllByText('500')).not.toHaveLength(0);
  });

  it('fills new game names from random generators', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: /new game/i }));
    await user.click(screen.getByRole('button', { name: /random owner/i }));
    await user.click(screen.getByRole('button', { name: /random ludus/i }));

    expect(screen.getByLabelText(/owner name/i)).not.toHaveValue('');
    expect(screen.getByLabelText(/ludus name/i)).not.toHaveValue('');
  });

  it('opens the in-game menu instead of leaving the current game immediately', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Menu' }));

    expect(await screen.findByRole('dialog', { name: 'Game menu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ludus Magnus' })).toBeInTheDocument();
  });

  it('saves the current game as a new local save from the in-game menu', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Game menu' })).getByRole('button', {
        name: 'Save as',
      }),
    );

    const saveAsDialog = await screen.findByRole('dialog', { name: 'Save as' });
    const ludusNameInput = within(saveAsDialog).getByLabelText('Ludus name');

    await user.clear(ludusNameInput);
    await user.type(ludusNameInput, 'Ludus Felix');
    await user.click(within(saveAsDialog).getByRole('button', { name: 'Save as' }));

    expect(await screen.findByRole('heading', { name: 'Ludus Felix' })).toBeInTheDocument();
    expect(screen.getByTestId('save-notice')).toHaveTextContent('Local save copy written.');
  });

  it('asks for confirmation before quitting with unsaved changes', async () => {
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
    await user.click(screen.getByRole('button', { name: 'x2' }));
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Game menu' })).getByRole('button', {
        name: 'Quit',
      }),
    );

    const confirmation = await screen.findByRole('dialog', { name: 'Quit game?' });

    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Ludus Magnus' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Game menu' })).getByRole('button', {
        name: 'Quit',
      }),
    );
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Quit game?' })).getByRole('button', {
        name: 'Quit',
      }),
    );

    expect(await screen.findByRole('button', { name: 'New game' })).toBeInTheDocument();
  });

  it('keeps the homepage on the normal URL even when an active session exists', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await user.click(screen.getByRole('button', { name: /new game/i }));
    await user.type(screen.getByLabelText(/owner name/i), 'Marcus');
    await user.type(screen.getByLabelText(/ludus name/i), 'Ludus Magnus');
    await user.click(screen.getByRole('button', { name: /found the ludus/i }));
    await screen.findByRole('heading', { name: 'Ludus Magnus' });
    await user.click(screen.getByRole('button', { name: 'x2' }));
    await waitFor(() => expect(localStorage.getItem('ludus:active-session')).not.toBeNull());

    unmount();
    window.history.replaceState(null, '', '/');

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByRole('button', { name: 'New game' })).toBeInTheDocument();
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('redirects the play URL to the homepage when no active session exists', async () => {
    window.history.replaceState(null, '', '/play');

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByRole('button', { name: 'New game' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
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

  it('upgrades a building through the rich building action confirmation modal', async () => {
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
    await user.click(await screen.findByTestId('map-building-domus'));

    const buildingPanel = await screen.findByTestId('building-modal');

    expect(within(buildingPanel).getByRole('button', { name: 'Upgrade' })).toBeEnabled();

    await user.click(within(buildingPanel).getByRole('button', { name: 'Upgrade' }));

    const dialogBackdrop = await screen.findByTestId('building-action-confirm-dialog');
    const dialog = within(dialogBackdrop).getByRole('dialog', { name: 'Upgrade Domus' });

    expect(within(dialog).getByText('Current level')).toBeInTheDocument();
    expect(within(dialog).getByText('Next level')).toBeInTheDocument();
    expect(within(dialog).getByText('Improvements')).toBeInTheDocument();
    expect(within(dialog).getByText('Cost')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Upgrade' }));

    expect(await screen.findByTestId('map-building-domus')).toHaveAttribute(
      'data-building-level',
      '2',
    );
    expect(screen.getAllByText('170')).not.toHaveLength(0);
  });

  it('shows Domus-governed ludus capacity in the dormitory panel', async () => {
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
    expect(within(buildingPanel).getByText('Available places')).toBeInTheDocument();
    expect(within(buildingPanel).getAllByText('1').length).toBeGreaterThan(0);
    expect(
      within(buildingPanel).queryByRole('button', { name: 'Buy bed' }),
    ).not.toBeInTheDocument();
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
