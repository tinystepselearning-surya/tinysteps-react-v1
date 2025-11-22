// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import GrammarBuilder from '../../../components/GrammarBuilder/GrammarBuilder.jsx';

export default function GrammarBuilderPage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <KidGameShell
      childId={childId}
      title="Grammar Builder 📖"
      subtitle="Pick the correct grammar option to keep building the story."
      highlight="Groq-powered snippets · saves your story progress"
    >
      <GrammarBuilder />
    </KidGameShell>
  );
}
