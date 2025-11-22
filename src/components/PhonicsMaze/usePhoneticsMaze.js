// Phonics maze hook removed — provide a stub to avoid runtime errors from imports.
export function usePhoneticsMaze() {
  return {
    maze: null,
    loading: false,
    error: null,
    currentCell: null,
    currentJunction: null,
    correctPath: [],
    positionIndex: 0,
    isComplete: true,
    feedback: null,
    startedAt: null,
    answerJunction: async () => null,
    reload: () => {},
  };
}

export default usePhoneticsMaze;
