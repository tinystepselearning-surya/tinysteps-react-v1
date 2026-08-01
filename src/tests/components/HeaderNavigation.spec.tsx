import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Header from '../../components/common/Header';
import useAuthStore from '../../store/useAuthStore';

describe('marketing header navigation', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('shows the school link instead of Courses and Pricing in desktop navigation', () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <Header />
      </MemoryRouter>,
    );

    const desktopNavigation = within(screen.getByTestId('desktop-primary-navigation'));
    expect(desktopNavigation.queryByRole('link', { name: 'Courses' })).not.toBeInTheDocument();
    expect(desktopNavigation.queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'For Schools' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'School Partnership Options' })).toBeInTheDocument();
  });

  it('retains Courses and Pricing, adds For Schools, and closes after mobile navigation', () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <Header />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: 'Toggle menu' });
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const mobileNavigation = within(document.getElementById('mobile-nav-menu')!);
    expect(mobileNavigation.getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(mobileNavigation.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
    expect(mobileNavigation.getByRole('link', { name: 'For Schools' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(mobileNavigation.getByRole('link', { name: 'For Schools' }));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});
