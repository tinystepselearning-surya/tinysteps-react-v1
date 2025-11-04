import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ use shared component
export default function Grammar() {
    return (_jsxs("div", { className: "px-4 py-10 max-w-6xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Grammar Classes for Kids (Online)" }), _jsx("p", { className: "text-gray-700 mb-3", children: "Parts of speech, tenses, punctuation and sentence building\u2014taught with mini-lessons and writing studios." }), _jsx("p", { className: "text-base text-gray-600 mb-8", children: "Every workshop sharpens written and spoken communication so learners can articulate ideas, tackle competitive exams, and collaborate across classrooms." }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Curriculum & methodology" }), _jsxs("ul", { className: "grid md:grid-cols-2 gap-4 text-gray-700", children: [_jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Grammar mini-lessons (interactive, 15-minute bursts)." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Sentence construction & editing drills." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Weekly writing sprints (narrative/info/opinion)." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Targeted feedback loops with rubrics." })] }), _jsx("p", { className: "mt-4 text-sm text-[#6366f1]", children: _jsx(Link, { to: "/curriculum#grammar", className: "font-semibold hover:underline", children: "Explore the Grammar mastery levels \u2192" }) })] }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Age groups & schedules" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsx("div", { className: "p-4 rounded-xl border", children: "Grade 2\u20133 \u00B7 35 mins \u00D7 3 / week" }), _jsx("div", { className: "p-4 rounded-xl border", children: "Grade 4\u20135 \u00B7 35 mins \u00D7 3 / week" }), _jsx("div", { className: "p-4 rounded-xl border", children: "Grade 6+ \u00B7 35 mins \u00D7 3 / week + writing lab" })] })] }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Pricing" }), _jsx(PricingCard, { title: "Grammar", price: "\u20B94,200", blurb: "12 one-to-one writing studios \u00B7 35 mins \u00B7 \u20B9350 per session (weekly 3 classes).", features: [
                            "Parts of speech, tenses, punctuation",
                            "Sentence craft & editing drills",
                            "Weekly writing sprint + feedback",
                            "Interactive digital worksheets & games",
                        ], ctaText: "Schedule Grammar Trial", ctaHref: "/main/book-demo/?programme=grammar", accent: "teal" })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Grammar FAQs" }), _jsx(Accordion, { items: [
                            {
                                question: "What batch size options do you offer?",
                                answer: "You can opt for 1:1 mentoring, a paired batch (1 teacher : 2 learners), focused groups of 4, or collaborative pods of 6. Regardless of size, we keep live editing and feedback tailored to each child’s writing goals.",
                            },
                            {
                                question: "Do you provide digital resources or do we need to print worksheets?",
                                answer: "Everything is digital-first. Children receive grammar games, Wordwall drills, and editable worksheets they can complete on any device. Parents appreciate that there’s no printing prep—just tap, practise, and upload.",
                            },
                            {
                                question: "Will grammar drills help with school exams and Olympiads?",
                                answer: "Absolutely. We blend board-specific question styles with concept-first teaching so children know the rule and how to present it in exams. Weekly writing sprints mimic comprehension, creative writing, and grammar worksheets used by CBSE, ICSE, and Cambridge schools.",
                            },
                            {
                                question: "Do you share feedback quickly enough for parents to guide revision?",
                                answer: "After every class you’ll receive a short note with a 5-star focus rating and two action points. Parents tell us this ongoing communication helps them feel in control of English progress without micro-managing homework.",
                            },
                            {
                                question: "How much parent involvement is needed for home practice?",
                                answer: "Very little. Teachers send a quick summary with digital worksheets or Wordwall links that children complete independently. You simply review the dashboard snapshot or listen to the 30-second voice note.",
                            },
                            {
                                question: "My child finds grammar boring. How will you keep them engaged?",
                                answer: "We gamify sentence building, editing races, and peer review moments so grammar feels like a puzzle. Because sessions are one-to-one, your child’s interests drive the prompts—sports, coding, comics—whatever gets them talking and writing.",
                            },
                            {
                                question: "How does writing support long-term communication skills?",
                                answer: "Every lesson follows our Listening-Reading-Writing-Speaking loop. Children first hear a model, read a mentor text, write a draft, and close with a quick verbal reflection. This loop ensures better articulation in class debates, interviews, and everyday communication.",
                            },
                            {
                                question: "Do you help with school essays and projects?",
                                answer: "Yes. Students bring school assignments into class. Teachers break the task into a simple outline, help with drafting, and upload annotated feedback to the dashboard so parents can see the journey from idea to polished submission.",
                            },
                            {
                                question: "What if we cannot attend one of the three weekly sessions?",
                                answer: "We reschedule easily. Because you get three touchpoints a week, we can flex around PTMs or tuition. The teacher recaps the concept in the following class so there’s no gap.",
                            },
                        ] })] })] }));
}
//# sourceMappingURL=Grammar.js.map