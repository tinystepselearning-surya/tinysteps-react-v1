import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FreeBalloonPopGamePage from '../../../pages/public/FreeBalloonPopGamePage';

vi.mock('../../../components/common/Meta', () => ({
  default: () => null,
}));

vi.mock('../../../lib/seo', () => ({
  applySeo: vi.fn(),
}));

vi.mock('../../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../../lib/conversionTracking', () => ({
  trackFreeResourceStart: vi.fn(),
  trackFreeResourceToTrialClick: vi.fn(),
}));

vi.mock('../../../pages/KidsBalloonPop', () => ({
  default: () => <div data-testid="balloon-pop-game">Balloon Pop Game</div>,
}));

function renderPage(initialEntry = '/free-balloon-pop-phonics-game-for-kids') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/free-balloon-pop-phonics-game-for-kids" element={<FreeBalloonPopGamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FreeBalloonPopGamePage', () => {
  it('renders the Tiny Steps Phonics authority experience around the game', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: /free phonics balloon pop game for kids/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tiny steps phonics · free listening practice/i)).toBeInTheDocument();
    expect(screen.getByText(/the tiny steps learning loop/i)).toBeInTheDocument();
    expect(screen.getByText(/tiny steps phonics sound groups/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /start with a small sound set, then expand gradually/i })).toBeInTheDocument();
    expect(screen.getByText(/satpin listening and sound recall/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /parent guidance: keep the game purposeful/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /for teachers and homeschool practice/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByText(/does the game include satpin practice\?/i)).toBeInTheDocument();
    expect(screen.getByTestId('balloon-pop-game')).toBeInTheDocument();
  });

  it('provides direct sound-group, six-step learning, and assessment pathways', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /start with satpin/i })).toHaveAttribute(
      'href',
      '/free-balloon-pop-phonics-game-for-kids?level=1#play',
    );
    expect(screen.getByRole('link', { name: /sound group 1/i })).toHaveAttribute(
      'href',
      '/free-balloon-pop-phonics-game-for-kids?level=1#play',
    );
    expect(screen.getByRole('link', { name: /satpin phonics guide for parents/i })).toHaveAttribute(
      'href',
      '/blog/satpin-phonics-guide',
    );
    expect(screen.getByRole('link', { name: /3\. letter sounds/i })).toHaveAttribute(
      'href',
      '/free-letter-sounds-game-for-kids',
    );
    expect(screen.getByRole('link', { name: /4\. balloon pop/i })).toHaveAttribute(
      'href',
      '/free-balloon-pop-phonics-game-for-kids',
    );
    expect(screen.getByRole('link', { name: /6\. blend words/i })).toHaveAttribute(
      'href',
      '/free-word-building-game-for-kids',
    );
    expect(screen.getByRole('link', { name: /book free phonics assessment/i })).toHaveAttribute('href', '/book-demo');
    expect(screen.getByRole('link', { name: /explore tiny steps phonics/i })).toHaveAttribute('href', '/phonics');
    expect(screen.getByRole('link', { name: /free letter-sound games collection/i })).toHaveAttribute(
      'href',
      '/free-letter-sound-games-for-kids',
    );
  });
});
