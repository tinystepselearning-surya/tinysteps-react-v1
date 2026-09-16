import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FreeLetterTracingGamePage from '../../../pages/public/FreeLetterTracingGamePage';

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

vi.mock('../../../pages/kids/games/phonics/LetterTracingGame', () => ({
  default: () => <div data-testid="letter-tracing-game">Game</div>,
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/free-letter-tracing-game-for-kids" element={<FreeLetterTracingGamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FreeLetterTracingGamePage', () => {
  it('renders A-N as free and O-Z as locked on the landing view', () => {
    renderPage('/free-letter-tracing-game-for-kids');

    expect(
      screen.getByRole('heading', { level: 1, name: /free abc tracing game for kids/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /for teachers and homeschool use/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /practice letter tracing a to z/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '#trace-letter-a');
    expect(screen.getByRole('link', { name: 'N' })).toHaveAttribute('href', '#trace-letter-n');
    expect(screen.getByRole('link', { name: /O 🔒/i })).toHaveAttribute('href', '#trace-letter-o');
    expect(screen.getByRole('link', { name: /unlock o-z/i })).toHaveAttribute(
      'href',
      '/free-letter-tracing-game-for-kids?level=1&pair=14&step=0#play',
    );
  });

  it('keeps free letter N in the tracing game', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=1&pair=13&step=1');

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /unlock letters o-z/i })).toBeNull();
  });

  it('hard-stops direct O-Z public URLs at the lifetime unlock screen', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=1&pair=14&step=0');

    expect(screen.queryByTestId('letter-tracing-game')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: /unlock letters o-z/i })).toBeInTheDocument();
    expect(screen.getByText('₹99')).toBeInTheDocument();
    expect(screen.getByText('$1.99')).toBeInTheDocument();
    expect(screen.getByText('€1.99')).toBeInTheDocument();
    expect(screen.getByText('£1.49')).toBeInTheDocument();

    const whatsapp = screen.getByRole('link', { name: /whatsapp me to unlock/i });
    expect(whatsapp).toHaveAttribute('href', expect.stringContaining('https://wa.me/919666095553'));
    expect(whatsapp.getAttribute('href')).toContain('text=');
    expect(screen.queryByText(/96660 95553/i)).toBeNull();
  });

  it('keeps pre-tracing unrestricted', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=0&pair=0&step=0');

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /unlock letters o-z/i })).toBeNull();
  });
});
