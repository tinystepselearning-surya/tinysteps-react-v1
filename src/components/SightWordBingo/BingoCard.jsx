import { useMemo } from 'react';

export default function BingoCard({ card, marks, onMark }) {
  const grid = useMemo(() => card || [], [card]);
  return (
    <div className="grid grid-cols-5 gap-2">
      {grid.flat().map((word, idx) => (
        <WordButton key={idx} word={word} marked={!!marks[word]} onClick={onMark} />
      ))}
    </div>
  );
}
