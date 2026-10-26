import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Header from '../../components/common/Header';
import useAuthStore from '../../store/useAuthStore';

describe('marketing header navigation', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('shows Courses and Pricing on desktop while preserving the schools-page CTA', () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <Header />
      </MemoryRouter>,
    );

    const desktopNavigation = within(screen.getByTestId('desktop-primary-navigation'));
    expect(desktopNavigation.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses');
    expect(desktopNavigation.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    expect(desktopNavigation.queryByRole('link', { name: 'For Schools' })).not.toBeInTheDocument();
    expect(desktopNavigation.queryByRole('link', { name: 'Class Samples' })).not.toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Curriculum' })).toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Resources' })).toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'School Partnership Options' })).toBeInTheDocument();
  });

  it('retains all primary links on mobile, omits removed links, and closes after navigation', () => {
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
    expect(mobileNavigation.queryByRole('link', { name: 'For Schools' })).not.toBeInTheDocument();
    expect(mobileNavigation.queryByRole('link', { name: 'Class Samples' })).not.toBeInTheDocument();

    fireEvent.click(mobileNavigation.getByRole('link', { name: 'Resources' }));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the active pricing link and renders one passive public progress indicator', () => {
    render(
      <MemoryRouter initialEntries={['/pricing']}>
        <Header />
      </MemoryRouter>,
    );
    const desktopNavigation = within(screen.getByTestId('desktop-primary-navigation'));
    expect(desktopNavigation.getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page');
    const indicator = screen.getByTestId('public-scroll-progress');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(indicator.firstElementChild).toHaveStyle({ transform: 'scaleX(0)' });
    expect(document.querySelectorAll('[data-testid="public-scroll-progress"]')).toHaveLength(1);
  });

  it('keeps signed-in dashboard and logout available in the revised header', () => {
    useAuthStore.setState({ user: { role: 'parent' } as any });
    render(
      <MemoryRouter initialEntries={['/courses']}>
        <Header />
      </MemoryRouter>,
    );
    const desktopNavigation = within(screen.getByTestId('desktop-primary-navigation'));
    expect(desktopNavigation.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/parent');
    expect(desktopNavigation.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Courses' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('button', { name: 'Book Free 35-Minute Demo' }).length).toBeGreaterThan(0);
  });

});
