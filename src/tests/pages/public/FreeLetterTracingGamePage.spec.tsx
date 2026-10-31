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
  it('shows all 26 uppercase and lowercase tracing pairs without locks or payment links', () => {
    renderPage('/free-letter-tracing-game-for-kids');

    expect(screen.getByRole('heading', { level: 1, name: /free abc tracing game for kids/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /for teachers and homeschool use/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /practice letter tracing a to z/i })).toBeInTheDocument();

    const letters = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
    for (const [index, upper] of letters.entries()) {
      expect(screen.getByRole('link', { name: upper })).toHaveAttribute('href', `#trace-letter-${upper.toLowerCase()}`);
      expect(screen.getByRole('link', { name: `Trace letter ${upper}` })).toHaveAttribute(
        'href',
        `/free-letter-tracing-game-for-kids?level=1&pair=${index}&step=0#play`,
      );
    }

    expect(screen.getAllByText(/all 26 letters|all letters and pre-writing/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/unlock o-z|lifetime unlock|one-time payment|₹99|£1\\.49/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /unlock/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book free phonics assessment/i })).toHaveAttribute('href', '/book-demo');
  });

  it('keeps free letter N in the tracing game', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=1&pair=13&step=1');

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /unlock letters o-z/i })).toBeNull();
  });

  it.each([14, 25])('plays direct O–Z deep-link pair %i with no unlock gate', (pair) => {
    renderPage(`/free-letter-tracing-game-for-kids?level=1&pair=${pair}&step=0`);

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /unlock letters o-z/i })).not.toBeInTheDocument();
  });

  it('keeps pre-tracing unrestricted', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=0&pair=0&step=0');

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /unlock letters o-z/i })).toBeNull();
  });
});
