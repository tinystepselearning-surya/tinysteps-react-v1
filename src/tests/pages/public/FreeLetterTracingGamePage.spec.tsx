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
  it('renders the new H1, letter discovery section, CTA, and practice links on the landing view', () => {
    renderPage('/free-letter-tracing-game-for-kids');

    expect(
      screen.getByRole('heading', { level: 1, name: /free letter tracing game for kids/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /practice letter tracing a to z/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '#trace-letter-a');
    expect(screen.getByRole('link', { name: /book free phonics assessment/i })).toHaveAttribute('href', '/book-demo');
    expect(screen.getByRole('link', { name: /trace letter a/i })).toHaveAttribute(
      'href',
      '/free-letter-tracing-game-for-kids?level=1&pair=0&step=0&fs=1#play',
    );
    expect(screen.getByRole('link', { name: /trace letter z/i })).toHaveAttribute(
      'href',
      '/free-letter-tracing-game-for-kids?level=1&pair=25&step=0&fs=1#play',
    );
  });

  it('hides long SEO content in play mode', () => {
    renderPage('/free-letter-tracing-game-for-kids?level=1&pair=0&step=0');

    expect(screen.getByTestId('letter-tracing-game')).toBeInTheDocument();
    expect(screen.queryByText(/what children practise/i)).toBeNull();
    expect(screen.queryByText(/practice letter tracing a to z/i)).toBeNull();
    expect(screen.queryByRole('heading', { level: 1, name: /free letter tracing game for kids/i })).toBeNull();
  });
});
