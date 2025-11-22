// SpellBeeGame hook removed — stubbed to avoid runtime dependencies on removed game logic.
export function useSpellBeeGame() {
  return {
    loading: false,
    error: null,
    currentWord: null,
    score: 0,
    streak: 0,
    attempts: 0,
    difficulty: 'easy',
    adaptive: {},
    index: 0,
    total: 0,
    results: [],
    isGameOver: true,
    submitAnswer: async () => null,
    resetGame: () => {},
  };
}

export default useSpellBeeGame;
