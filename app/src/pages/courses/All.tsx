import { Link } from "react-router-dom";
import { coursePrograms } from "../../data/courses";
import PricingCard from "../../components/PricingCard";
import { pricingPlans } from "../../data/pricing";

export default function AllCourses() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff7a45]">All Programs</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">Every pathway at Tiny Steps</h1>
        <p className="mt-3 text-lg text-gray-600">
          Explore our flagship programs for phonics, grammar, and public speaking. Each track combines joyful classrooms,
          measurable milestones, and weekly parent touchpoints.
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {coursePrograms.map((course) => (
          <Link
            key={course.title}
            to={course.href}
            className="group relative isolate flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5 transition hover:-translate-y-2 hover:shadow-2xl"
          >
            <span
              aria-hidden
              className={`absolute -top-20 left-1/2 h-44 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-70 ${course.accent.glow}`}
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
                <h2 className="text-2xl font-semibold text-gray-900 transition-colors group-hover:text-gray-50">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 transition-colors group-hover:text-gray-100/90">
                  {course.description}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2 text-sm font-medium">
                {course.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 transition-colors group-hover:border-white/40 group-hover:text-white/90"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center justify-between gap-2 text-sm font-semibold text-[#4f46e5] transition-colors group-hover:text-white">
                View program <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section id="pricing" className="mt-16 rounded-3xl bg-[#fff6ef] p-8 shadow-inner shadow-[#ffddb5]/70">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-[#d94b03]">1:1 program pricing</h2>
          <p className="mt-3 text-lg text-gray-700">
            Choose the pathway that suits your child. Every plan includes personalised Learning Partner support, weekly feedback
            loops, and dashboard updates for parents.
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.26em] text-gray-500">
            35-minute classes · 3 sessions every week · ₹350 per session
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              blurb={plan.blurb}
              features={plan.features}
              ctaText={plan.ctaText}
              ctaHref={plan.ctaHref}
              accent={plan.accent}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
