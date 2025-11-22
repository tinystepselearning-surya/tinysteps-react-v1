import { jsx as _jsx } from "react/jsx-runtime";
// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import ReadingAdventure from '../../../components/ReadingAdventure/ReadingAdventure.jsx';
export default function ReadingAdventurePage() {
    const { childId } = useParams();
    return (_jsx(KidGameShell, { childId: childId, title: "Reading Adventure \uD83D\uDCDA", subtitle: "Read chapters, answer comprehension, and unlock the story.", highlight: "Groq chapters \u00B7 progress shown below", children: _jsx(ReadingAdventure, {}) }));
}
