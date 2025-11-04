import { jsx as _jsx } from "react/jsx-runtime";
import { useLegacyPage } from "../../hooks/useLegacyPage";
export default function BlogIndex() {
    const transform = (doc) => {
        doc.querySelector("header.site-header")?.remove();
        doc.querySelector("footer.footer")?.remove();
        const linkMap = {
            "/main/courses/": "/courses",
            "/main/courses/phonics/": "/courses/phonics",
            "/main/courses/grammar/": "/courses/grammar",
            "/main/courses/public-speaking/": "/courses/public-speaking",
            "/roles/teacher/": "/login/teachers",
            "/roles/teacher": "/login/teachers",
            "/roles/rm/": "/login/learning-managers",
            "/roles/rm": "/login/learning-managers",
            "/roles/kids/": "/login/kids",
            "/roles/kids": "/login/kids",
            "/roles/parent/": "/login/parents",
            "/roles/parent": "/login/parents",
            "/blog/": "/blog",
        };
        doc.querySelectorAll("a[href]").forEach((anchor) => {
            const replacement = linkMap[anchor.getAttribute("href") ?? ""];
            if (replacement) {
                anchor.setAttribute("href", replacement);
            }
        });
    };
    const { html, loading, error } = useLegacyPage({
        path: "/blog/index.html",
        titleFallback: "Tiny Steps Blog",
        styles: ["/shared/ui.css", "/blog/blog-cards.css"],
        scripts: [
            { src: "/shared/header.js", type: "text/javascript", defer: true },
            { src: "/blog/blog-cards.js", type: "text/javascript", defer: true },
        ],
        transform,
    });
    if (loading) {
        return (_jsx("div", { className: "mx-auto max-w-6xl px-4 py-20 text-center text-gray-600", children: "Loading blog articles\u2026" }));
    }
    if (error) {
        return (_jsx("div", { className: "mx-auto max-w-6xl px-4 py-20 text-center text-red-600", children: "We couldn\u2019t load the blog right now. Please refresh to try again." }));
    }
    return _jsx("div", { className: "legacy-page", dangerouslySetInnerHTML: { __html: html } });
}
//# sourceMappingURL=BlogIndex.js.map