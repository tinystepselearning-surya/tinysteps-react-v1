import { jsx as _jsx } from "react/jsx-runtime";
// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
import GrammarBuilder from '../../../components/GrammarBuilder/GrammarBuilder.jsx';
export default function GrammarBuilderPage() {
    const { childId } = useParams();
    return (_jsx(KidGameShell, { childId: childId, title: "Grammar Builder \uD83D\uDCD6", subtitle: "Pick the correct grammar option to keep building the story.", highlight: "Groq-powered snippets \u00B7 saves your story progress", children: _jsx(GrammarBuilder, {}) }));
}
