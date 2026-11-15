import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VisualSpellingPuzzleLab from '../../pages/kids/games/VisualSpellingPuzzleLab';

afterEach(() => vi.restoreAllMocks());

describe('free visual spelling puzzle lab', () => {
  it('allows anonymous play and stores no score or progress', () => {
    const save = vi.spyOn(Storage.prototype, 'setItem');
    const { container } = render(
      <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
        <VisualSpellingPuzzleLab />
      </MemoryRouter>
    );

    expect(screen.getByText(/no login.*nothing saved/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /everyday words/i }));
    expect(screen.getByText('A trip from one place to another.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Everyday Words', level: 2 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Build the Word', level: 3 })).toBeTruthy();

    for (const letter of ['j', 'o', 'u', 'r', 'n', 'e', 'y']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp('Add tile ' + letter + ', position') }));
    }
    fireEvent.click(screen.getByRole('button', { name: /check spelling/i }));

    expect(screen.getByText(/you got it: journey!/i)).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(container.querySelector('audio')).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it('opens the four stages without requiring a child ID', () => {
    render(
      <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
        <VisualSpellingPuzzleLab />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /everyday words/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /patterns & endings/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /tricky spellings/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /long word challenge/i })).toBeTruthy();
    expect(screen.getByText(/example words: friend · school · planet/i)).toBeTruthy();
  });
  it('shows the selected level prominently and names its specific puzzle activity', () => {
    const cases = [
      { level: /everyday words/i, title: 'Everyday Words', activity: 'Build the Word' },
      { level: /patterns & endings/i, title: 'Patterns & Endings', activity: 'Sort by Word Ending' },
      { level: /tricky spellings/i, title: 'Tricky Spellings', activity: 'Fill the Missing Letters' },
      { level: /long word challenge/i, title: 'Long Word Challenge', activity: 'Build from Word Parts' },
    ];
    for (const item of cases) {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
          <VisualSpellingPuzzleLab />
        </MemoryRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: item.level }));
      expect(screen.getByRole('heading', { name: item.title, level: 2 })).toBeTruthy();
      expect(screen.getByRole('heading', { name: item.activity, level: 3 })).toBeTruthy();
      expect(screen.getByText('Now playing: ' + item.title)).toBeTruthy();
      unmount();
    }
  });

  it('requires sorting two contrasting words before counting the puzzle complete', () => {
    render(
      <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
        <VisualSpellingPuzzleLab />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /everyday words/i }));
    for (const letter of ['j', 'o', 'u', 'r', 'n', 'e', 'y']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp('Add tile ' + letter + ', position') }));
    }
    fireEvent.click(screen.getByRole('button', { name: /check spelling/i }));
    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));
    fireEvent.click(screen.getByRole('button', { name: 'friend' }));
    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));
    fireEvent.click(screen.getByRole('button', { name: 'r' }));
    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));

    expect(screen.getByText('hopeful')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ends in -ful' }));
    expect(screen.getByText('hopeless')).toBeTruthy();
    expect(screen.getByText('Having little or no hope for a good outcome.')).toBeTruthy();
    expect(screen.queryByText(/both words sorted/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ends in -less' }));
    expect(screen.getByText(/both words sorted/i)).toBeTruthy();
    expect(screen.getByText(/compare hopeful and hopeless/i)).toBeTruthy();
  });

  it('finishes each level with independent recall rather than only recognition', () => {
    const save = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
        <VisualSpellingPuzzleLab />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /everyday words/i }));
    for (let i = 0; i < 8; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /need a hint/i }));
      fireEvent.click(screen.getByRole('button', { name: /show answer & learn/i }));
      fireEvent.click(screen.getByRole('button', {
        name: i === 7 ? /final spelling challenge/i : /next puzzle/i,
      }));
    }

    expect(screen.getByRole('heading', { name: /spell it without the tiles/i })).toBeTruthy();
    const input = screen.getByRole('textbox', { name: /type the spelling from memory/i });
    fireEvent.change(input, { target: { value: 'jorney' } });
    fireEvent.click(screen.getByRole('button', { name: /check spelling/i }));
    expect(screen.getByText(/not quite.*order of the letters/i)).toBeTruthy();
    fireEvent.change(input, { target: { value: 'journey' } });
    fireEvent.click(screen.getByRole('button', { name: /check spelling/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText(/final word recall: correct after practising/i)).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it('does not award independent sorting credit after hinting the first word', () => {
    render(
      <MemoryRouter initialEntries={['/free-spelling-game-for-kids?play=1&mode=puzzles']}>
        <VisualSpellingPuzzleLab />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /everyday words/i }));
    // Reveal the first three puzzles so independent score starts at zero.
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /need a hint/i }));
      fireEvent.click(screen.getByRole('button', { name: /show answer & learn/i }));
      fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));
    }

    // A hint on hopeful must also mark the paired hopeless answer as assisted.
    fireEvent.click(screen.getByRole('button', { name: /need a hint/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ends in -ful' }));
    expect(screen.getByText('hopeless')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ends in -less' }));
    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));

    for (let i = 4; i < 8; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /need a hint/i }));
      fireEvent.click(screen.getByRole('button', { name: /show answer & learn/i }));
      fireEvent.click(screen.getByRole('button', {
        name: i === 7 ? /final spelling challenge/i : /next puzzle/i,
      }));
    }
    fireEvent.click(screen.getByRole('button', { name: /need a hint/i }));
    fireEvent.click(screen.getByRole('button', { name: /show answer & finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText(/independent first-try puzzles: 0 of 8/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /replay mixed puzzles/i })).toBeTruthy();
  });

});
