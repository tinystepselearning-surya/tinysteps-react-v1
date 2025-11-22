import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { CourseCard } from '../components/courses/CourseCard';
import { ParentReportPreview } from '../components/courses/ParentReportPreview';
import TrialForm from '../components/forms/TrialForm';
import Meta from '../components/common/Meta';
import { catalogs } from '../content/courses';
const CoursesHero = () => (_jsxs("section", { "data-animate": "fade-up", className: "relative overflow-hidden bg-gradient-hero text-white", children: [_jsxs("div", { className: "absolute inset-0 opacity-20", children: [_jsx("div", { className: "absolute -left-10 top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" }), _jsx("div", { className: "absolute right-0 bottom-10 h-64 w-64 rounded-full bg-white/30 blur-3xl" })] }), _jsx("div", { className: "relative mx-auto max-w-6xl px-6 py-16", children: _jsxs("div", { className: "grid gap-8 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-widest text-white/80", children: "Live 1:1 English programs" }), _jsx("h1", { className: "mt-3 text-4xl font-bold md:text-5xl", children: "Choose the perfect track for your child" }), _jsx("p", { className: "mt-4 text-white/90", children: "Phonics, grammar, public speaking, and custom brush-up paths\u2014each mapped week-by-week with transparent pricing." }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3 text-sm", children: [_jsx("span", { className: "rounded-full bg-white/20 px-4 py-1", children: "Ages 3\u201312" }), _jsx("span", { className: "rounded-full bg-white/20 px-4 py-1", children: "\u20B9550 per live session" }), _jsx("span", { className: "rounded-full bg-white/20 px-4 py-1", children: "Parent-rated \u2605\u2605\u2605\u2605\u2605" })] })] }), _jsxs("div", { className: "glass-panel bg-white/95 text-gray-900", id: "book-trial", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Book a Free Trial" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Tell us about your child\u2014our mentor schedules a class within 24 hours." }), _jsx("div", { className: "mt-4", children: _jsx(TrialForm, { context: "courses_hero" }) })] })] }) })] }));
const allCourses = catalogs;
const CoursesPage = () => {
    const [track, setTrack] = useState('all');
    const [query, setQuery] = useState('');
    const [level, setLevel] = useState('all');
    useEffect(() => { document.title = 'Choose Your Course | Tiny Steps'; }, []);
    const courses = useMemo(() => {
        return allCourses.filter((c) => (track === 'all' || c.track === track) && (level === 'all' || c.level === level) && (c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.overview.join(' ').toLowerCase().includes(query.toLowerCase())));
    }, [track, level, query]);
    return (_jsxs("div", { className: "page-gradient relative overflow-hidden", children: [_jsx(Meta, { title: "Online English Courses for Kids | Phonics, Grammar, Public Speaking", description: "Choose the perfect course for your child. 12\u2011week expert\u2011designed programs starting at \u20B94,400/month. Free assessment.", canonical: "https://tinystepslearning.com/courses", jsonLd: {
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    itemListElement: catalogs.map((c, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        item: {
                            '@type': 'Course',
                            name: c.name,
                            description: `${c.name} — ${c.overview.join(', ')}`,
                            provider: { '@type': 'Organization', name: 'Tiny Steps Online School' },
                            hasCourseInstance: {
                                '@type': 'CourseInstance',
                                courseMode: 'OnlineCoursePlatform',
                                offers: {
                                    '@type': 'Offer',
                                    price: c.price.replace(/[^0-9]/g, '') || '0',
                                    priceCurrency: 'INR',
                                    availability: 'http://schema.org/InStock'
                                }
                            }
                        }
                    }))
                } }), _jsx(CoursesHero, {}), _jsxs("div", { className: "mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-16 lg:grid-cols-[300px_minmax(0,1fr)]", children: [_jsxs("aside", { className: "space-y-5", "data-animate": "fade-up", children: [_jsxs("div", { className: "glass-panel p-4", children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "Track" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['all', 'phonics', 'grammar', 'speaking'].map((t) => (_jsx("button", { onClick: () => setTrack(t), className: `rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${track === t ? 'bg-primary-500 text-white' : 'bg-slate-100 text-gray-700 hover:bg-white'}`, children: t }, t))) })] }), _jsxs("div", { className: "glass-panel p-4", children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "Level" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['all', 'Foundation', 'Basic', 'Intermediate', 'Advanced', 'Brush‑Up'].map((l) => (_jsx("button", { onClick: () => setLevel(l), className: `rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${level === l ? 'bg-primary-500 text-white' : 'bg-slate-100 text-gray-700 hover:bg-white'}`, children: l }, l))) })] }), _jsxs("div", { className: "glass-panel p-4", children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "Search" }), _jsx("input", { className: "interactive-input", placeholder: "Search courses, levels, topics...", value: query, onChange: (e) => setQuery(e.target.value) })] }), _jsx("div", { "data-animate": "fade-up", "data-animate-delay": "0.05s", className: "glass-panel", children: _jsx(ParentReportPreview, { track: track }) })] }), _jsxs("main", { "data-animate": "fade-up", className: "glass-panel space-y-6 p-6", children: [_jsxs("div", { className: "mb-6 rounded-2xl bg-white/80 p-4 text-sm text-gray-700", children: ["Filtering results for ", _jsx("span", { className: "font-semibold capitalize", children: track === 'all' ? 'all tracks' : track }), level !== 'all' && _jsxs(_Fragment, { children: [" \u2022 Level: ", level] }), query && _jsxs(_Fragment, { children: [" \u2022 Keyword: \u201C", query, "\u201D"] })] }), _jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: courses.map((c) => (_jsx(CourseCard, Object.assign({}, c), c.name))) })] })] })] }));
};
export default CoursesPage;
