import { useLegacyPage } from "../../hooks/useLegacyPage";

export default function LearningManagerPortal() {
  const { html, loading, error } = useLegacyPage({
    path: "/roles/rm/index.html",
    titleFallback: "Tiny Steps — Learning Manager",
    styles: ["/shared/ui.css", "/roles/rm/rm.css"],
    scripts: [{ src: "/roles/rm/rm.js", type: "module" }],
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-600">
        Loading learning manager workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-red-600">
        Unable to load the learning manager experience. Please refresh and try again.
      </div>
    );
  }

  return <div className="legacy-page" dangerouslySetInnerHTML={{ __html: html }} />;
}
