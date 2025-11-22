// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import PublicSpeakingStage from '../../../components/PublicSpeaking/PublicSpeakingStage.jsx';

export default function PublicSpeakingPage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <KidGameShell
      childId={childId}
      title="Public Speaking Stage 🎤"
      subtitle="Practice prompts, record your voice, and get feedback."
      highlight="Mic required · Groq prompt + placeholder feedback"
    >
      <PublicSpeakingStage userId={childId} />
    </KidGameShell>
  );
}
