// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
// Phonics Maze feature removed — page kept as a placeholder.

export default function PhonicsMazePage() {
  const { childId } = useParams<{ childId: string }>();

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold">Phonics Maze (Removed)</h2>
    </div>
  );
}
