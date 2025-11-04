import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
const stories = [
    {
        program: "Phonics Foundations",
        lead: "“Within four weeks Kavya was decoding storybooks independently.”",
        name: "Anita Rao",
        place: "Bengaluru · Kavya, Grade 1",
        body: "Kavya recognised only a handful of sounds when we joined. The diagnostic report outlined exactly where to begin, and the weekly WhatsApp notes tell us how to practise at home. Kavya now reaches for her library bag every evening and reads aloud with confidence.",
        photo: "/assets/images/joyfullearning.jpg",
    },
    {
        program: "Phonics Foundations",
        lead: "“The SATPIN routine made reading feel like playtime for Vihaan.”",
        name: "Siddharth & Nisha Patel",
        place: "Ahmedabad · Vihaan, Senior KG",
        body: "Tiny Steps keeps the sessions joyful, but also methodical. The teacher shares short video clips so we can mirror the pronunciation at home. Vihaan blends new words daily and we receive a crisp progress email every Friday. It’s the structure we were looking for.",
        photo: "/assets/images/phonics.jpg",
    },
    {
        program: "Grammar & Writing Lab",
        lead: "“Aarav finally understands grammar rules and applies them in stories.”",
        name: "Rahul & Sneha Sharma",
        place: "Pune · Aarav, Grade 4",
        body: "The roadmap made milestones crystal clear. Aarav submits drafts through the parent portal, receives voice notes highlighting wins, and gets two actionable points to work on. His school essays are now organised and his teacher has noticed the difference.",
        photo: "/assets/images/grammar.jpg",
    },
    {
        program: "Grammar & Writing Lab",
        lead: "“The rubrics and mini-deadlines made writing enjoyable for Diya.”",
        name: "Priyanka Menon",
        place: "Chennai · Diya, Grade 5",
        body: "Weekly writing studios combine imagination with technique. We can see rubric scores update instantly, and the mentor shares a 5-minute debrief call after every project. Diya now drafts without fear of red marks because she understands the ‘why’ behind every edit.",
        photo: "/assets/images/resources/tenses-cheatsheet.webp",
    },
    {
        program: "Public Speaking Studio",
        lead: "“Riya now walks on stage with a smile and clear voice.”",
        name: "Meera Joshi",
        place: "Mumbai · Riya, Grade 5",
        body: "The studio gave Riya a safe space to experiment. Coaches upload annotated videos, mark delivery on a speaking rubric, and set a ‘spotlight goal’ for the next week. We can literally watch her posture, pace, and confidence evolve.",
        photo: "/assets/images/speaking.jpg",
    },
    {
        program: "Public Speaking Studio",
        lead: "“Arnav hosted his school assembly after two terms in the studio.”",
        name: "Vikram Kulkarni",
        place: "Hyderabad · Arnav, Grade 6",
        body: "Sessions blend breathing drills, storytelling games, and audience feedback. Coaches send concise debriefs and recommend practice cues we try during dinner conversations. Arnav now projects clearly and enjoys presenting — a huge shift from where we started.",
        photo: "/assets/images/onetoone.jpg",
    },
];
const GROUP_SIZE = 3;
export default function Testimonials() {
    const [open, setOpen] = useState(false);
    const [activeStory, setActiveStory] = useState(0);
    const [slide, setSlide] = useState(0);
    const contentRef = useRef(null);
    const sectionRef = useScrollReveal({ variant: "right" });
    useEffect(() => {
        if (!open)
            return;
        contentRef.current?.focus();
    }, [open]);
    const totalSlides = Math.ceil(stories.length / GROUP_SIZE);
    const goTo = (next) => {
        setSlide((next + totalSlides) % totalSlides);
    };
    return (_jsxs("section", { ref: sectionRef, id: "testimonials", className: "mx-auto max-w-6xl px-4 my-20", children: [_jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [_jsx("p", { "data-reveal-child": true, className: "text-sm md:text-base font-semibold uppercase tracking-[0.24em] text-[#7c3aed]", children: "Parent Voices" }), _jsx("h2", { "data-reveal-child": true, style: { "--reveal-child-delay": "60ms" }, className: "mt-2 text-3xl md:text-4xl font-extrabold text-gray-900", children: "Families see measurable progress and lasting confidence" }), _jsx("p", { "data-reveal-child": true, style: { "--reveal-child-delay": "120ms" }, className: "mt-3 text-gray-600 text-lg", children: "Hear how Tiny Steps learning managers, teachers, and parent updates work together across phonics, writing, and public speaking programs." })] }), _jsxs("div", { className: "relative mt-10", children: [_jsx("div", { className: "overflow-hidden", children: _jsx("div", { className: "flex transition-transform duration-500 ease-out", style: { transform: `translateX(-${slide * 100}%)` }, children: Array.from({ length: totalSlides }, (_, slideIndex) => {
                                const start = slideIndex * GROUP_SIZE;
                                const slice = stories.slice(start, start + GROUP_SIZE);
                                return (_jsx("div", { className: "w-full shrink-0 px-0 md:px-1", children: _jsx("div", { className: "grid gap-6 md:grid-cols-3", role: "list", children: slice.map((story, idx) => {
                                            const absoluteIndex = start + idx;
                                            return (_jsxs("article", { role: "listitem", className: "flex h-full flex-col gap-4 rounded-2xl bg-white p-6 shadow shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg", children: [_jsx("img", { src: story.photo, alt: `${story.name} testimonial`, loading: "lazy", className: "h-40 w-full rounded-2xl object-cover" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-[#4f46e5]", children: story.program }), _jsx("blockquote", { className: "m-0 text-[1.05rem] font-semibold leading-7 text-gray-900", children: story.lead }), _jsxs("footer", { className: "mt-auto", children: [_jsx("cite", { className: "not-italic font-extrabold text-[#e05c0a]", children: story.name }), _jsx("span", { className: "mt-0.5 block text-sm text-gray-600", children: story.place })] }), _jsx("button", { onClick: () => {
                                                            setActiveStory(absoluteIndex);
                                                            setOpen(true);
                                                        }, className: "self-start rounded-full bg-[#ffefe6] px-3 py-2 text-sm font-extrabold text-[#e05c0a] transition hover:bg-[#ffd9c6]", children: "Read full story" })] }, story.lead));
                                        }) }) }, slideIndex));
                            }) }) }), totalSlides > 1 && (_jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsx("button", { onClick: () => goTo(slide - 1), className: "inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#ff751f] hover:text-[#e05c0a]", children: "\u2039 Prev" }), _jsx("div", { className: "flex items-center gap-2", children: Array.from({ length: totalSlides }, (_, idx) => (_jsx("button", { onClick: () => goTo(idx), className: `h-2.5 w-8 rounded-full transition ${slide === idx ? "bg-[#ff751f]" : "bg-gray-200 hover:bg-gray-300"}`, "aria-label": `Show parent stories ${idx * GROUP_SIZE + 1} to ${Math.min((idx + 1) * GROUP_SIZE, stories.length)}` }, idx))) }), _jsx("button", { onClick: () => goTo(slide + 1), className: "inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#ff751f] hover:text-[#e05c0a]", children: "Next \u203A" })] }))] }), open && (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur", onClick: () => setOpen(false) }), _jsxs("div", { ref: contentRef, tabIndex: -1, className: "relative max-h-[90svh] w-[min(720px,92vw)] overflow-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8", role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsx("h3", { className: "text-xl font-extrabold text-[#e05c0a]", children: "Parent stories" }), _jsx("button", { onClick: () => setOpen(false), className: "rounded-lg px-2 text-2xl leading-none text-gray-500 transition hover:bg-[#fff3ec]", "aria-label": "Close testimonials", children: "\u00D7" })] }), _jsx("p", { className: "mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#4f46e5]", children: stories[activeStory].program }), _jsx("p", { className: "mt-2 text-lg font-semibold text-gray-900", children: stories[activeStory].lead }), _jsx("p", { className: "mt-3 text-gray-700", children: stories[activeStory].body }), _jsxs("footer", { className: "mt-4 text-gray-600", children: [_jsx("strong", { className: "block text-[#e05c0a]", children: stories[activeStory].name }), _jsx("span", { className: "text-sm", children: stories[activeStory].place })] }), _jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsx("button", { className: "rounded-full bg-[#ffd9c6] px-4 py-2 font-extrabold text-[#e05c0a] transition hover:bg-[#ffc9aa]", onClick: () => setActiveStory((prev) => (prev - 1 + stories.length) % stories.length), children: "\u2039 Prev" }), _jsx("div", { className: "flex gap-2", children: stories.map((_, idx) => (_jsx("button", { onClick: () => setActiveStory(idx), className: `h-2.5 w-2.5 rounded-full ${activeStory === idx ? "bg-[#ff751f]" : "bg-gray-200"}`, "aria-label": `Show parent story ${idx + 1}` }, idx))) }), _jsx("button", { className: "rounded-full bg-[#ffd9c6] px-4 py-2 font-extrabold text-[#e05c0a] transition hover:bg-[#ffc9aa]", onClick: () => setActiveStory((prev) => (prev + 1) % stories.length), children: "Next \u203A" })] })] })] }))] }));
}
//# sourceMappingURL=Testimonials.js.map