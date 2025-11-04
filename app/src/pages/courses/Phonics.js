import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ shared Accordion component
export default function Phonics() {
    return (_jsxs("div", { className: "px-4 py-10 max-w-6xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Phonics Classes for Kids (Online)" }), _jsx("p", { className: "text-gray-700 mb-3", children: "Systematic phonics that connects letter\u2013sound mastery to confident, expressive reading. SATPIN, Magic-E, digraphs and more." }), _jsx("p", { className: "text-base text-gray-600 mb-8", children: "Communication sits at the centre of every lesson\u2014children learn to decode, discuss stories, and share reflections so they can compete and collaborate with confidence in school." }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Curriculum & methodology" }), _jsxs("ul", { className: "grid md:grid-cols-2 gap-4 text-gray-700", children: [_jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Sound-to-symbol mastery: Jolly Phonics sequencing with multi-sensory drills, actions, and stories." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Guided blending labs with decodable readers and fluency runs." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Digraphs & long vowels with word-sorting games." }), _jsx("li", { className: "p-4 rounded-xl bg-gray-50", children: "Fluency & comprehension with weekly retell prompts." })] }), _jsx("p", { className: "mt-4 text-sm text-[#6366f1]", children: _jsx(Link, { to: "/curriculum#phonics", className: "font-semibold hover:underline", children: "View the full Phonics mastery roadmap \u2192" }) })] }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Age groups & schedules" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsx("div", { className: "p-4 rounded-xl border", children: "Early readers (3.5\u20135 yrs) \u00B7 35 mins \u00D7 3 / week" }), _jsx("div", { className: "p-4 rounded-xl border", children: "Grade 1\u20132 \u00B7 35 mins \u00D7 3 / week" }), _jsx("div", { className: "p-4 rounded-xl border", children: "Grade 3+ \u00B7 35 mins \u00D7 3 / week + reading journal" })] })] }), _jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Pricing" }), _jsx(PricingCard, { title: "Phonics", price: "\u20B94,200", blurb: "12 one-to-one sessions \u00B7 35 mins \u00B7 \u20B9350 per session (weekly 3 classes).", features: [
                            "SATPIN → digraphs → long vowels",
                            "Fluency runs & comprehension prompts",
                            "Weekly parent summary",
                            "Digital worksheets • Wordwall & web games • Minimal parent prep",
                        ], ctaText: "Book Phonics Demo", ctaHref: "/main/book-demo/?programme=phonics", accent: "orange" })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: "Phonics FAQs" }), _jsx(Accordion, { items: [
                            {
                                question: "What batch size options do you offer?",
                                answer: "Families can choose the best fit—1:1 coaching, paired batches (1 teacher : 2 learners), small groups of 4, or collaborative pods of 6. Even in shared batches we use breakout rooms and individual feedback so every child gets personal attention.",
                            },
                            {
                                question: "Do you share digital worksheets or will I need to print homework?",
                                answer: "We share interactive worksheets, Wordwall games, and web-based blends so children practise on screens with joyful activities. Printing is optional; most families complete homework digitally within minutes.",
                            },
                            {
                                question: "Will 35-minute one-to-one sessions clash with school homework?",
                                answer: "We schedule around your child’s school day and keep each session laser-focused. The teacher recaps the school phonics list, reinforces tricky sounds, and closes with a two-minute plan so your child finishes homework faster, not slower.",
                            },
                            {
                                question: "My child is in a CBSE/ICSE board. Will this align with the school sequence?",
                                answer: "Yes. We follow the Jolly Phonics order to build decoding muscle and then align weekly lists with the school reader. Teachers flag tricky spellings on your dashboard so you can communicate with class teachers confidently.",
                            },
                            {
                                question: "How much support do you need from parents between sessions?",
                                answer: "Very little. Teachers send a two-minute activity with digital worksheets or a Wordwall link. Children can complete it independently with a quick emoji-style check-in so busy parents stay in the loop without printing or manual effort.",
                            },
                            {
                                question: "How do you involve parents between classes?",
                                answer: "Communication is the cornerstone. After every session you’ll receive a WhatsApp voice note, the skill covered, and a 5-star focus indicator. A quick two-minute activity keeps the momentum without overwhelming working parents.",
                            },
                            {
                                question: "What if my child already recognises letters?",
                                answer: "We begin with a diagnostic. If letter-sound recall is strong, we jump straight into digraphs, Magic-E, and vocabulary building. The idea is to respect existing mastery and move toward fluent reading and expressive communication.",
                            },
                            {
                                question: "How soon will we see a change in reading fluency?",
                                answer: "Most families notice smoother blending by week three because we meet thrice a week. You’ll see the growth on the dashboard through recorded reading clips and the mastery bar that moves from emerging to proficient.",
                            },
                            {
                                question: "What happens if we miss a class due to school events?",
                                answer: "Just pick a new slot in the calendar—make-ups are part of your plan. We refresh the previous concept during the next class so your child never feels left behind.",
                            },
                        ] })] })] }));
}
//# sourceMappingURL=Phonics.js.map