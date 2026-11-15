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
    fireEvent.click(screen.getByRole('button', { name: /word explorer/i }));
    expect(screen.getByText('A trip from one place to another.')).toBeTruthy();

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

    expect(screen.getByRole('button', { name: /word explorer/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /pattern builder/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /spelling expert/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /word architect/i })).toBeTruthy();
  });
});
