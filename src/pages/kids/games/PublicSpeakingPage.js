import { jsx as _jsx } from "react/jsx-runtime";
// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import PublicSpeakingStage from '../../../components/PublicSpeaking/PublicSpeakingStage.jsx';
export default function PublicSpeakingPage() {
    const { childId } = useParams();
    return (_jsx(KidGameShell, { childId: childId, title: "Public Speaking Stage \uD83C\uDFA4", subtitle: "Practice prompts, record your voice, and get feedback.", highlight: "Mic required \u00B7 Groq prompt + placeholder feedback", children: _jsx(PublicSpeakingStage, { userId: childId }) }));
}
