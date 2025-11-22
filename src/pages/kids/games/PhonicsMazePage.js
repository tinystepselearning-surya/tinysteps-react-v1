import { jsx as _jsx } from "react/jsx-runtime";
// React import removed (unused)
import { useParams } from 'react-router-dom';
import KidGameShell from './KidGameShell';
export default function PhonicsMazePage() {
    const { childId } = useParams();
       return (
           // Simple placeholder so the route remains functional
           _jsx("div", { className: "p-8", children: _jsx("h2", { className: "text-xl font-bold", children: "Phonics Maze (Removed)" }) })
       );
}
