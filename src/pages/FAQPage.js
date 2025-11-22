import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import FAQAccordion from '../components/FAQ/FAQAccordion';
import Meta from '../components/common/Meta';
const items = [
    { id: 'q1', category: 'phonics', question: 'How to teach phonics to my child at home?', answer: 'Start with sound recognition (not letter names). Use SATPIN sequence first, then blend into words like sat/pin/tap. Keep sessions short (10–15 minutes) and playful with games rather than worksheets. Best age: 3–4. Common mistake: teaching letter names first.', relatedBlog: '/blog/parents-guide-phonics', relatedCourse: '/courses' },
    { id: 'q2', category: 'phonics', question: "Why can't my child blend sounds even though he knows phonics?", answer: 'Blending is a separate skill from recognizing sounds. Teach slow blending (c—a—t) then fast blending (cat). Expect 4–6 weeks to master. Practice with CVC Builder and minimal pairs. We target this in Week 4 explicitly.', relatedBlog: '/blog/why-blending-is-hard', relatedCourse: '/courses' },
    { id: 'q3', category: 'phonics', question: 'What is the difference between phonics and sight words?', answer: 'Phonics decodes using rules (c‑a‑t); sight words are memorized exceptions (the, was). Start with phonics since ~70% of words are decodable, then add sight words. Our curriculum teaches tricky words in Week 12.', relatedBlog: '/blog/phonics-vs-sight-words', relatedCourse: '/courses' },
    { id: 'q4', category: 'phonics', question: 'My 7-year-old struggles with reading. Is it too late for phonics?', answer: 'Not too late. With intensive phonics and gap analysis, 8–12 weeks usually closes core gaps. We identify specific needs (sounds, blending, long vowels) and focus there. Consistency drives a 95%+ success rate.' },
    { id: 'q5', category: 'phonics', question: "How do I teach tricky words like 'said', 'come', 'there'?", answer: 'Use spaced repetition and context. Pair with rhyming (said/paid), use in sentences, daily for 2 weeks then weekly refresh. We teach 40+ tricky words across levels with games and applied reading.' },
    { id: 'q6', category: 'phonics', question: 'Should my child learn phonics before starting school?', answer: 'Optional but helpful. A 12‑week foundation course 6 months prior to school builds confidence. Start with SATPIN sounds and 10‑minute daily practice.' },
    { id: 'q7', category: 'phonics', question: 'My child can read but has no comprehension. Why?', answer: 'Decoding ≠ comprehension. If most effort goes into sounding out, little is left for understanding. Build fluency and add comprehension questions. Our Advanced Phonics ends with 150–300‑word passages + Q&A.' },
    { id: 'q8', category: 'grammar', question: 'How to teach grammar to kids without boring them?', answer: 'Use games (Sentence Dice, Grammar Bingo, Picture prompts) and “mistakes games” instead of lectures. We keep sessions ~70% active practice, 30% instruction.' },
    { id: 'q9', category: 'grammar', question: "My child mixes up 'is' and 'are'. How do I explain?", answer: 'One person = is; multiple = are. Use visuals: 1 stick figure → is; 3 figures → are. We target this in Basic Grammar Week 10 with concrete‑to‑abstract scaffolding.' },
    { id: 'q10', category: 'grammar', question: 'When should children learn tenses? Is my 5-year-old too young?', answer: 'Ages 5–6: simple tenses (played/plays/will play). Ages 8+: complex tenses. We cover simple in Basic Weeks 3–4 and all 12 tenses in Advanced Weeks 1–4.' },
    { id: 'q11', category: 'grammar', question: 'How to stop grammar mistakes in writing?', answer: 'Internalize via output. Have child rewrite own sentences correctly, do peer editing games, and daily short writing. Our levels progress from sentences → paragraphs → stories with mastery checks.' },
    { id: 'q12', category: 'grammar', question: "My 8-year-old speaks well but can't write sentences. Why?", answer: 'Speaking and writing are different skills. Bridge with “speak first, write second”: record, then transcribe. Our Grammar path uses Speak → Write progression to reduce friction.' },
    { id: 'q13', category: 'speaking', question: 'My child is too shy to speak in public. How can I help?', answer: 'Start small with 15‑second safe talks at home, then expand. Celebrate effort, not perfection. Our first 2–3 weeks focus on confidence only. 90% of shy kids become confident in 8 weeks.' },
    { id: 'q14', category: 'speaking', question: 'How do I encourage class participation?', answer: 'At home, ask open‑ended questions and let them ramble. Praise participation over correctness. We teach S.P.E.A.K. habits that generalize to classrooms within 4–6 weeks.' },
    { id: 'q15', category: 'speaking', question: "How long should a child's speech be?", answer: 'Ages 4–7: 15–45s. Ages 7–10: 60–120s. Ages 10+: 3–5 minutes. We never force length; we scaffold duration across levels.' },
    { id: 'q16', category: 'speaking', question: 'My child mumbles and speaks too fast. How to slow down?', answer: 'Treat clarity and pace separately. Mirror pronunciation for mumbling; teach pause gestures to slow pace. Our Advanced Week 10 focuses on vocal variety + pacing.' },
    { id: 'q17', category: 'speaking', question: 'How to lose the Indian accent?', answer: 'Accent isn’t a problem—clarity is. Target unclear sounds (R/L/TH/W‑V). We train clarity + rhythm; accent shifts naturally with exposure.' },
    { id: 'q18', category: 'speaking', question: 'Nervous during presentations—any tips?', answer: 'Practice 5+ times, know content, breathe (3 deep breaths), focus on 1 friendly face. Our capstones start low‑pressure with teacher + parent before larger settings.' },
    { id: 'q19', category: 'online', question: 'Is online learning as good as offline?', answer: 'For English, 1:1 online often outperforms batch offline: personalization, recordings, flexibility, global teachers. Offline offers socialization. For serious skill gains, 1:1 online wins.' },
    { id: 'q20', category: 'online', question: 'How do I ensure my child is actually learning online?', answer: 'Demand transparency: weekly reports, recordings, home tasks, monthly calls, mastery bands. Tiny Steps provides all five so you can verify learning.' },
];
const categories = [
    { id: 'all', label: 'All' },
    { id: 'phonics', label: 'Phonics' },
    { id: 'grammar', label: 'Grammar' },
    { id: 'speaking', label: 'Public Speaking' },
    { id: 'online', label: 'Online Learning' }
];
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
        }
    }))
};
const FAQPage = () => {
    const [selected, setSelected] = useState('all');
    const [search, setSearch] = useState('');
    useEffect(() => { document.title = 'Frequently Asked Questions | Tiny Steps'; }, []);
    const filtered = useMemo(() => {
        return items.filter((item) => {
            const matchCategory = selected === 'all' || item.category === selected;
            const term = search.trim().toLowerCase();
            const matchSearch = !term || item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term);
            return matchCategory && matchSearch;
        });
    }, [selected, search]);
    const { user } = useAuthStore();
    return (_jsxs("div", { className: "page-gradient min-h-screen", children: [_jsx(Meta, { title: "FAQ | Tiny Steps Online School", description: "Answers to your questions about phonics, grammar & public speaking. Parents\u2019 top queries covered in one place.", canonical: "https://tinystepslearning.com/faq", jsonLd: faqSchema }), _jsx("section", { className: "px-6 pt-24 pb-10", children: _jsxs("div", { className: "mx-auto max-w-4xl glass-panel soft-grid px-8 py-10 text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "Help centre" }), _jsx("h1", { className: "mt-3 text-3xl font-bold text-gray-900", children: "Frequently Asked Questions" }), _jsx("p", { className: "mt-3 text-gray-600", children: "Everything Indian parents ask about phonics, grammar, speaking, trial classes, payments, and results." }), _jsx("div", { className: "mt-6", children: _jsx("input", { className: "interactive-input", placeholder: "Search questions...", value: search, onChange: (e) => setSearch(e.target.value) }) })] }) }), _jsxs("section", { className: "mx-auto max-w-6xl px-6 pb-16", children: [_jsx("div", { className: "mb-6 flex flex-wrap gap-3", children: categories.map((cat) => (_jsx("button", { onClick: () => setSelected(cat.id), className: `rounded-full px-4 py-2 text-sm font-semibold transition ${selected === cat.id ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg' : 'bg-white/90 text-gray-700 hover:bg-white'}`, children: cat.label }, cat.id))) }), _jsx(FAQAccordion, { items: filtered }), _jsxs("div", { className: "mt-10 rounded-3xl bg-white/80 p-6 text-sm text-gray-700 shadow-card-hover", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "Still have questions?" }), _jsx("p", { className: "mt-2", children: !user ? (_jsxs(_Fragment, { children: ["Message us on ", _jsx("a", { href: "https://wa.me/919618398383", className: "text-tiny-green-600", children: "WhatsApp" }), " or ", _jsx("a", { href: "/contact", className: "text-tiny-blue-600", children: "contact us" }), ". We\u2019ll send personalised recommendations within 12 hours."] })) : (_jsxs(_Fragment, { children: ["Message our support team via ", _jsx("a", { href: "/contact", className: "text-tiny-blue-600", children: "Contact form" }), ". We\u2019ll respond within 12 hours."] })) })] })] })] }));
};
export default FAQPage;
