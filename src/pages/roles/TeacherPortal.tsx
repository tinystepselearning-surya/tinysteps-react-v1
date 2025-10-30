import { useLegacyPage } from "../../hooks/useLegacyPage";

export default function TeacherPortal() {
  const { html, loading, error } = useLegacyPage({
    path: "/roles/teacher/index.html",
    titleFallback: "Tiny Steps — Teacher Portal",
    styles: ["/shared/ui.css", "/roles/teacher/teacher.css"],
    scripts: [{ src: "/roles/teacher/teacher.js", type: "module" }],
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-600">
        Loading teacher workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-red-600">
        Failed to load the teacher experience. Please refresh the page.
      </div>
    );
  }

  return <div className="legacy-page" dangerouslySetInnerHTML={{ __html: html }} />;
}
