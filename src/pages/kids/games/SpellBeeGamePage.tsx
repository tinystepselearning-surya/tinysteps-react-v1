import React from 'react';
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import SpellBeeGame from '../../../components/SpellBeeGame/SpellBeeGame';

export default function SpellBeeGamePage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <KidGameShell
      childId={childId}
      title="SpellBee Trainer 🐝"
      subtitle="Spell the words you hear and get instant feedback."
      highlight="Powered by Groq SpellBee · tracks your streaks"
    >
      <SpellBeeGame userId={childId} />
    </KidGameShell>
  );
}
