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
import { catalogs, curriculumBySlug } from '../content/courses';
import { getCourseWeeksOverride } from '../content/curriculumLoader';
import Meta from '../components/common/Meta';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
const CourseDetailPage = () => {
    const { slug } = useParams();
    const course = useMemo(() => catalogs.find((c) => c.slug === slug), [slug]);
    const base = curriculumBySlug[slug || ''] || {};
    const [weeks, setWeeks] = useState(base.weeks || []);
    useEffect(() => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            if (!slug)
                return;
            const override = yield getCourseWeeksOverride(slug);
            if (override && override.length)
                setWeeks(override);
            else
                setWeeks(base.weeks || []);
        }))();
    }, [slug]);
    useEffect(() => {
        if (course)
            document.title = `${course.name} | Tiny Steps`;
    }, [course]);
    if (!course) {
        return (_jsxs("div", { className: "mx-auto max-w-4xl px-6 py-20", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Course not found" }), _jsx("p", { className: "mt-2", children: _jsx(Link, { className: "text-primary-600", to: "/courses", children: "Back to courses" }) })] }));
    }
    const priceNumber = (course.price || '').replace(/[^0-9]/g, '') || '0';
    const reviewCountMatch = (course.reviews || '').match(/\((\d+) reviews\)/i);
    const ratingCount = reviewCountMatch ? reviewCountMatch[1] : undefined;
    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Course',
        name: course.name,
        description: `${course.name} — ${course.overview.join(', ')}`,
        provider: { '@type': 'Organization', name: 'Tiny Steps Online School', sameAs: 'https://tinystepslearning.com' },
        courseCode: course.slug.toUpperCase().replace(/-/g, '_'),
        educationLevel: course.level,
        audience: { '@type': 'EducationalAudience', educationalRole: 'student', age: course.age.replace('Ages ', '') },
        duration: 'P12W',
        hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'OnlineCoursePlatform',
            offers: {
                '@type': 'Offer',
                price: priceNumber,
                priceCurrency: 'INR',
                availability: 'http://schema.org/InStock'
            }
        }
    };
    if (ratingCount) {
        jsonLd.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: '5.0',
            ratingCount
        };
    }
    return (_jsxs("div", { className: "bg-white", children: [_jsx(Meta, { title: `${course.name} | Tiny Steps`, description: `${course.name}: ${course.overview.slice(0, 3).join(' • ')} • ${course.frequency} • ${course.price}`, canonical: `https://tinystepslearning.com/courses/${course.slug}`, jsonLd: jsonLd }), _jsxs("div", { className: "mx-auto max-w-6xl px-6 py-10", children: [_jsxs("div", { className: "flex items-center gap-2 text-2xl font-bold text-gray-900", children: [_jsx("span", { className: "text-3xl", children: course.icon }), _jsx("h1", { children: course.name })] }), _jsxs("div", { className: "mt-1 text-sm text-gray-600", children: [course.age, " \u2022 ", course.duration, " \u2022 ", course.frequency, " \u2022 Level: ", course.level] }), _jsxs("div", { className: "mt-4 grid gap-6 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-semibold", children: "Quick Overview" }), _jsx("ul", { className: "mt-2 list-disc pl-5 text-sm text-gray-800", children: course.overview.map((o) => _jsx("li", { children: o }, o)) })] }), _jsxs("div", { children: [_jsx("h2", { className: "font-semibold", children: "Learning Outcomes" }), _jsx("ul", { className: "mt-2 list-disc pl-5 text-sm text-gray-800", children: course.outcomes.map((o) => _jsx("li", { children: o }, o)) })] })] }), _jsxs("div", { className: "mt-10", children: [_jsx("h2", { className: "font-heading text-2xl font-bold", children: "Detailed Curriculum" }), weeks && weeks.length ? (_jsx("div", { className: "mt-3", children: _jsx(WeekAccordion, { items: weeks }) })) : (_jsx("p", { className: "mt-2 text-sm text-gray-700", children: "Detailed week\u2011by\u2011week curriculum coming soon." }))] }), _jsx("div", { className: "mt-10 text-sm text-gray-700", children: _jsx(Link, { className: "text-primary-600", to: "/courses", children: "\u2190 Back to all courses" }) })] })] }));
};
export default CourseDetailPage;
