import { Link } from 'react-router-dom';
import { publicTeacherPhotos } from 'virtual:tiny-steps-team-photos';

export function TeacherPortraitsSection() {
  return (
    <section id="teachers" aria-labelledby="team-teachers-title" className="border-y border-orange-100 bg-[#fffaf3] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">Our teachers</p>
        <h2 id="team-teachers-title" className="mt-3 max-w-4xl font-heading text-3xl font-bold tracking-tight text-[#10243e] sm:text-4xl">
          Meet the educators behind every live lesson
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Our graduate educators support children across early-years and primary English foundations, reading, grammar, writing and speaking.
          They teach within a shared curriculum, preparation and academic-review system.
        </p>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-[#604577]">
          Early Years &amp; Primary English Educators
        </p>
        {publicTeacherPhotos.length > 0 && (
          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {publicTeacherPhotos.map((teacher) => (
              <figure key={teacher.src} className="overflow-hidden rounded-[22px] border border-orange-100 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                <img
                  src={teacher.src}
                  alt={teacher.name + ', Tiny Steps educator'}
                  loading="lazy"
                  decoding="async"
                  width={960}
                  height={1200}
                  className="aspect-[4/5] w-full bg-slate-100 object-cover object-top"
                />
                <figcaption className="px-3 py-4 text-center">
                  <h3 className="font-heading text-base font-bold text-slate-900 sm:text-lg">{teacher.name}</h3>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-600">
          Want to see how our teaching works?{' '}
          <Link to="/class-samples" className="font-semibold text-blue-800 underline underline-offset-4">View real class samples</Link>
          {' '}or{' '}
          <Link to="/book-demo" className="font-semibold text-blue-800 underline underline-offset-4">request a free demo assessment</Link>.
        </p>
      </div>
    </section>
  );
}