import React from 'react';
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import ReadingAdventure from '../../../components/ReadingAdventure/ReadingAdventure';

export default function ReadingAdventurePage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <KidGameShell
      childId={childId}
      title="Reading Adventure 📚"
      subtitle="Read chapters, answer comprehension, and unlock the story."
      highlight="Groq chapters · progress shown below"
    >
      <ReadingAdventure />
    </KidGameShell>
  );
}
