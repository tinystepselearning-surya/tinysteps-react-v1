import { useLegacyPage } from "../../hooks/useLegacyPage";

export default function BlogIndex() {
  const transform = (doc: Document) => {
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
      "/roles/parent/": "/login/parents",
      "/roles/parent": "/login/parents",
      "/blog/": "/blog",
    };

    doc.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
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
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-600">
        Loading blog articles…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-red-600">
        We couldn’t load the blog right now. Please refresh to try again.
      </div>
    );
  }

  return <div className="legacy-page" dangerouslySetInnerHTML={{ __html: html }} />;
}
