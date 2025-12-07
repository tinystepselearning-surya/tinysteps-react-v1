import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import { fetchMdxPosts } from '../content/blogMdx';
import Meta from '../components/common/Meta';
import NewsletterForm from '../components/common/NewsletterForm';
const BlogPage = () => {
    const [topic, setTopic] = useState('All');
    const [sort, setSort] = useState('Newest');
    const posts = useMemo(() => {
        const list = blogPosts.filter((p) => topic === 'All' || p.category === topic);
        if (sort === 'Newest')
            return list.sort((a, b) => (a.date < b.date ? 1 : -1));
        if (sort === 'Most Popular')
            return list.sort((a, b) => ((b.popularScore || 0) - (a.popularScore || 0)));
        if (sort === 'Most Read')
            return list.sort((a, b) => ((b.viewsCount || 0) - (a.viewsCount || 0)));
        return list;
    }, [topic, sort]);
    const [mdxPosts, setMdxPosts] = useState([]);
    useEffect(() => {
        fetchMdxPosts().then(setMdxPosts).catch(() => setMdxPosts([]));
    }, []);
    const mdxConverted = mdxPosts.map((m) => ({
        slug: m.slug,
        title: m.title || m.slug,
        category: m.category || 'Parent Tips',
        author: m.author || 'Tiny Steps',
        date: m.date || new Date().toISOString().slice(0, 10),
        readTime: m.readTime || '5 min',
        hero: m.hero,
        excerpt: m.excerpt || ''
    }));
    const combined = useMemo(() => [...mdxConverted, ...blogPosts], [mdxConverted]);
    const blogSchema = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Tiny Steps Blog',
        blogPost: combined.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            author: { '@type': 'Person', name: post.author || 'Tiny Steps' },
            url: `https://tinystepslearning.com/blog/${post.slug}`
        }))
    }), [combined]);
    const featured = combined
        .filter((p) => topic === 'All' || p.category === topic)
        .sort((a, b) => (sort === 'Newest' ? (a.date < b.date ? 1 : -1) : 0))[0];
    useEffect(() => { document.title = 'Insights for Indian Parents | Tiny Steps Blog'; }, []);
    return (_jsxs("div", { className: "bg-white", children: [_jsx(Meta, { title: "Tiny Steps Blog | Insights for Indian Parents", description: "Expert tips, research\u2011backed articles, and success stories for Indian parents. Phonics, grammar, and public speaking.", canonical: "https://tinystepslearning.com/blog", jsonLd: blogSchema }), _jsxs("div", { className: "mx-auto max-w-6xl px-6 py-10", children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h1", { className: "font-heading text-3xl font-bold md:text-4xl", children: "Insights for Indian Parents" }), _jsx("p", { className: "mt-2 text-base text-gray-700", children: "Expert tips, research\u2011backed articles, success stories" })] }), _jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-3", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: ['All', 'Phonics', 'Grammar', 'Public Speaking', 'Parent Tips', 'Research'].map((t) => (_jsx("button", { onClick: () => setTopic(t), className: `rounded-full px-3 py-1 text-sm ${topic === t ? 'bg-primary-500 text-white' : 'bg-slate-100'}`, children: t }, t))) }), _jsxs("div", { className: "text-sm", children: [_jsx("label", { className: "mr-2 text-gray-700", children: "Sort:" }), _jsx("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "rounded-full border px-3 py-1 text-sm", children: ['Newest', 'Most Popular', 'Most Read'].map((s) => _jsx("option", { children: s }, s)) })] })] }), featured && (_jsx(Link, { to: `/blog/${featured.slug}`, className: "block rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200", children: _jsxs("div", { className: "grid gap-6 md:grid-cols-[1.2fr_1fr]", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: featured.title }), _jsxs("div", { className: "mt-1 text-sm text-gray-600", children: ["by ", featured.author, " \u2022 ", featured.readTime, " \u2022 ", new Date(featured.date).toLocaleDateString()] }), _jsx("p", { className: "mt-3 text-gray-700", children: featured.excerpt })] }), _jsx("div", { className: "aspect-video w-full rounded-xl bg-slate-100", style: { backgroundImage: `url(${featured.hero || ''})`, backgroundSize: 'cover' } })] }) })), _jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: combined.slice(1).map((p) => (_jsxs(Link, { to: `/blog/${p.slug}`, className: "rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200 transition-transform hover:-translate-y-1", children: [_jsx("div", { className: "aspect-video w-full rounded-xl bg-slate-100 mb-4", style: { backgroundImage: `url(${p.hero || ''})`, backgroundSize: 'cover' } }), _jsx("div", { className: "text-xs text-primary-600", children: p.category }), _jsx("div", { className: "mt-1 font-semibold text-gray-900", children: p.title }), _jsxs("div", { className: "text-xs text-gray-600", children: [p.readTime, " \u2022 ", new Date(p.date).toLocaleDateString()] }), _jsx("p", { className: "mt-2 text-sm text-gray-700 line-clamp-3", children: p.excerpt })] }, p.slug))) }), _jsxs("div", { className: "mt-12 mx-auto max-w-xl rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 text-center ring-1 ring-slate-200", children: [_jsx("div", { className: "font-semibold", children: "Get weekly tips for your child\\'s English journey" }), _jsx("div", { className: "mt-3", children: _jsx(NewsletterForm, {}) })] })] })] }));
};
export default BlogPage;
