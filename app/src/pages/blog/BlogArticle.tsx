import { useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useLegacyPage } from "../../hooks/useLegacyPage";

const headerScript = { src: "/shared/header.js", type: "text/javascript", defer: true } as const;

type LegacyConfig = {
  path: string;
  styles: string[];
  scripts: { src: string; type?: "module" | "text/javascript"; defer?: boolean }[];
  fallbackTitle: string;
};

const BLOG_PAGES: Record<string, LegacyConfig> = {
  week1: {
    path: "/blog/week1.html",
    styles: ["/shared/ui.css", "/blog/week1.css"],
    scripts: [headerScript, { src: "/blog/week1.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 1 – Tiny Steps Blog",
  },
  week2: {
    path: "/blog/week2.html",
    styles: ["/shared/ui.css", "/blog/week2.css"],
    scripts: [headerScript, { src: "/blog/week2.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 2 – Tiny Steps Blog",
  },
  week3: {
    path: "/blog/week3.html",
    styles: ["/shared/ui.css", "/blog/week3.css"],
    scripts: [headerScript, { src: "/blog/week3.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 3 – Tiny Steps Blog",
  },
  week4: {
    path: "/blog/week4.html",
    styles: ["/shared/ui.css", "/blog/week4.css"],
    scripts: [headerScript, { src: "/blog/week4.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 4 – Tiny Steps Blog",
  },
  week5: {
    path: "/blog/week5.html",
    styles: ["/shared/ui.css", "/blog/week5.css"],
    scripts: [headerScript, { src: "/blog/week5.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 5 – Tiny Steps Blog",
  },
  week6: {
    path: "/blog/week6.html",
    styles: ["/shared/ui.css", "/blog/week6.css"],
    scripts: [headerScript, { src: "/blog/week6.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 6 – Tiny Steps Blog",
  },
  week7: {
    path: "/blog/week7.html",
    styles: ["/shared/ui.css", "/blog/week7.css"],
    scripts: [headerScript, { src: "/blog/week7.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 7 – Tiny Steps Blog",
  },
  week8: {
    path: "/blog/week8.html",
    styles: ["/shared/ui.css", "/blog/week8.css"],
    scripts: [headerScript, { src: "/blog/week8.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 8 – Tiny Steps Blog",
  },
  week9: {
    path: "/blog/week9.html",
    styles: ["/shared/ui.css", "/blog/week9.css"],
    scripts: [headerScript, { src: "/blog/week9.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 9 – Tiny Steps Blog",
  },
  week10: {
    path: "/blog/week10.html",
    styles: ["/shared/ui.css", "/blog/week10.css"],
    scripts: [headerScript, { src: "/blog/week10.js", type: "text/javascript", defer: true }],
    fallbackTitle: "Week 10 – Tiny Steps Blog",
  },
  "phonics-at-home-activities": {
    path: "/blog/phonics-at-home-activities/index.html",
    styles: ["/shared/ui.css", "/blog/phonics-at-home-activities/phonics.css"],
    scripts: [
      headerScript,
      { src: "/blog/phonics-at-home-activities/phonics.js", type: "text/javascript", defer: true },
    ],
    fallbackTitle: "Phonics at Home – Tiny Steps Blog",
  },
  "week-1-learning-begins": {
    path: "/blog/week-1-learning-begins/index.html",
    styles: ["/shared/ui.css"],
    scripts: [headerScript],
    fallbackTitle: "Week 1 Learning Begins – Tiny Steps Blog",
  },
};

export default function BlogArticle() {
  const params = useParams();
  const slugParam = params.slug ?? "";
  const slug = slugParam.replace(/\.html$/i, "");
  const hasConfig = Object.prototype.hasOwnProperty.call(BLOG_PAGES, slug);
  const config = hasConfig ? BLOG_PAGES[slug as keyof typeof BLOG_PAGES] : null;

  const transform = useCallback((doc: Document) => {
    doc.querySelector("header.site-header")?.remove();
    doc.querySelector("footer.footer")?.remove();

    const linkMap: Record<string, string> = {
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
      "/roles/parent/": "/parent-login",
      "/roles/parent": "/parent-login",
      "/blog/": "/blog",
    };

    doc.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
      const replacement = linkMap[anchor.getAttribute("href") ?? ""];
      if (replacement) {
        anchor.setAttribute("href", replacement);
      }
    });
  }, []);

  const { html, loading, error } = useLegacyPage(
    config
      ? {
          path: config.path,
          styles: config.styles,
          scripts: config.scripts,
          titleFallback: config.fallbackTitle,
          transform,
        }
      : {
          path: "",
          styles: [],
          scripts: [],
          titleFallback: "",
          transform,
        },
  );

  if (!hasConfig) {
    return <Navigate to="/blog" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-600">
        Loading story…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-red-600">
        We couldn’t load this story. Please head back to the blog and try another article.
      </div>
    );
  }

  return <div className="legacy-page" dangerouslySetInnerHTML={{ __html: html }} />;
}
