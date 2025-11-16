import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import SightWordBingo from '../../../components/SightWordBingo/SightWordBingo';

export default function SightWordBingoPage() {
  const { childId, roomId } = useParams<{ childId: string; roomId?: string }>();
  const activeRoomId = useMemo(() => roomId || (childId ? `${childId}-bingo` : 'default-room'), [childId, roomId]);

  return (
    <KidGameShell
      childId={childId}
      title="Sight Word Bingo 🎯"
      subtitle="Mark the words that match the AI's clue. First to five in a row wins!"
      highlight={`Room: ${activeRoomId} · Share this URL for multiplayer`}
    >
      <SightWordBingo roomId={activeRoomId} userId={childId} />
    </KidGameShell>
  );
}
