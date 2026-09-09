import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Header from '../../components/common/Header';
import useAuthStore from '../../store/useAuthStore';

describe('marketing header navigation', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('keeps the desktop primary navigation focused while preserving the schools-page CTA', () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <Header />
      </MemoryRouter>,
    );

    const desktopNavigation = within(screen.getByTestId('desktop-primary-navigation'));
    expect(desktopNavigation.queryByRole('link', { name: 'Courses' })).not.toBeInTheDocument();
    expect(desktopNavigation.queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
    expect(desktopNavigation.queryByRole('link', { name: 'For Schools' })).not.toBeInTheDocument();
    expect(desktopNavigation.queryByRole('link', { name: 'Class Samples' })).not.toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Curriculum' })).toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Resources' })).toBeInTheDocument();
    expect(desktopNavigation.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'School Partnership Options' })).toBeInTheDocument();
  });

  it('retains mobile-only Courses and Pricing, omits removed primary links, and closes after navigation', () => {
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
});
