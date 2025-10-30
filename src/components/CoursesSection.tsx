import { Link } from "react-router-dom";
import { coursePrograms } from "../data/courses";

export default function CoursesSection() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff7a45]">Our Courses</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Beautifully Crafted Learning Tracks</h2>
          <p className="mt-2 max-w-xl text-gray-600">
            Each pathway blends research-backed curriculum, joyful teaching, and measurable progress so your child
            can thrive from day one.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-[#4f46e5] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-600/40"
        >
          See all programs →
        </Link>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 md:grid-cols-3">
        {coursePrograms.map((course) => (
          <article
            key={course.title}
            className="group relative isolate flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5 transition hover:-translate-y-2 hover:shadow-2xl"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-60 ${course.accent.glow}`}
            />
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.image}
                alt={`${course.title} hero`}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${course.accent.gradient} opacity-60 transition group-hover:opacity-75`}
                aria-hidden="true"
              />
            </div>

            <div className="relative flex h-full flex-col gap-5 p-6">
              <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${course.accent.badge}`}>
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                <span>{course.subtitle}</span>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 transition-colors group-hover:text-gray-50">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 transition-colors group-hover:text-gray-100/90">
                  {course.description}
                </p>
              </div>

              <ul className="flex flex-wrap gap-2 text-sm font-medium">
                {course.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 transition-colors group-hover:border-white/40 group-hover:text-white/90"
                  >
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between pt-2">
                <Link
                  to={course.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f46e5] transition-colors group-hover:text-white"
                >
                  View program
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <span className="text-xs uppercase tracking-[0.24em] text-gray-400 transition-colors group-hover:text-white/70">
                  Ages 3–10
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
