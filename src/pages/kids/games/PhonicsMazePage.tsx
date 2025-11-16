import React from 'react';
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import PhoneticsMaze from '../../../components/PhonicsMaze/PhoneticsMaze';

export default function PhonicsMazePage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <KidGameShell
      childId={childId}
      title="Phonics Maze 🌀"
      subtitle="Follow the correct sounds to escape the maze."
      highlight="Uses Groq-generated mazes and tracks progress"
    >
      <PhoneticsMaze userId={childId} />
    </KidGameShell>
  );
}
