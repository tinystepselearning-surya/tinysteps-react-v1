var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import Meta from '../components/common/Meta';
const BlogPostPage = () => {
    const { slug } = useParams();
    const post = useMemo(() => blogPosts.find((p) => p.slug === slug), [slug]);
    const [MdxComp, setMdxComp] = useState(null);
    const [mdxMeta, setMdxMeta] = useState(null);
    useEffect(() => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            if (post || !slug)
                return;
            try {
                // const mod: any = await import(`../content/blog/${slug}.mdx`);
                // setMdxComp(() => mod.default);
                // setMdxMeta(mod.meta || {});
            }
            catch (e) {
                // not mdx
            }
        }))();
    }, [slug]);
    if (!post && !MdxComp) {
        return (_jsxs("div", { className: "mx-auto max-w-4xl px-6 py-20", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Article not found" }), _jsx("p", { className: "mt-2", children: _jsx(Link, { className: "text-primary-600", to: "/blog", children: "Back to blog" }) })] }));
    }
    const metaSource = post || mdxMeta || {};
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metaSource.title,
        author: { '@type': 'Person', name: metaSource.author || 'Tiny Steps' },
        datePublished: new Date(metaSource.date || Date.now()).toISOString(),
        image: metaSource.hero ? `${location.origin}${metaSource.hero}` : undefined,
        wordCount: 2500,
        articleBody: post ? post.body.map(b => b.content).join('\n') : ''
    };
    return (_jsxs("div", { className: "bg-white", children: [_jsx(Meta, { title: `${metaSource.title} | Tiny Steps Blog`, description: metaSource.excerpt || '', canonical: `https://tinystepslearning.com/blog/${slug}`, jsonLd: jsonLd }), _jsxs("div", { className: "mx-auto max-w-3xl px-6 py-10", children: [_jsx("div", { className: "text-xs text-primary-600", children: metaSource.category || 'Parent Tips' }), _jsx("h1", { className: "mt-1 text-3xl font-bold text-gray-900", children: metaSource.title }), _jsxs("div", { className: "mt-1 text-sm text-gray-600", children: ["by ", metaSource.author || 'Tiny Steps', " \u2022 ", metaSource.readTime || '5 min', " \u2022 ", new Date(metaSource.date || Date.now()).toLocaleDateString()] }), metaSource.hero && _jsx("div", { className: "mt-4 aspect-video w-full rounded-xl bg-slate-100", style: { backgroundImage: `url(${metaSource.hero})`, backgroundSize: 'cover' } }), _jsxs("article", { className: "prose prose-slate mt-6 max-w-none", children: [post && post.body.map((b, i) => {
                                if (b.type === 'h2')
                                    return _jsx("h2", { children: b.content }, i);
                                if (b.type === 'h3')
                                    return _jsx("h3", { children: b.content }, i);
                                if (b.type === 'li')
                                    return _jsx("li", { children: b.content }, i);
                                return _jsx("p", { children: b.content }, i);
                            }), MdxComp && _jsx(MdxComp, {})] }), _jsxs("div", { className: "mt-8 flex justify-between text-sm", children: [_jsx(Link, { className: "text-primary-600", to: "/courses", children: "Learn more about our courses \u2192" }), _jsx(Link, { className: "text-primary-600", to: "/", children: "Book your free class \u2192" })] })] })] }));
};
export default BlogPostPage;
