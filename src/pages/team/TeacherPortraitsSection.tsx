import { Link } from 'react-router-dom';
import { publicTeacherPhotos } from 'virtual:tiny-steps-team-photos';

export function TeacherPortraitsSection() {
  return (
    <section id="teachers" aria-labelledby="team-teachers-title" className="border-y border-[#f0e5d9] bg-[#fffbf6] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
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
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
            {publicTeacherPhotos.map((teacher) => (
              <figure key={teacher.src} className="flex min-w-0 flex-col items-center">
                <div className="aspect-[4/5] w-full max-w-[230px] overflow-hidden rounded-[50%] border-[5px] border-white bg-[#f7ead8] shadow-[0_10px_28px_rgba(16,36,62,0.08)] ring-1 ring-[#ead7c6]">
                  <img
                    src={teacher.src}
                    alt={teacher.name + ', Tiny Steps educator'}
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={1200}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <figcaption className="mt-3 max-w-full px-1 text-center">
                  <h3 className="font-heading text-base font-bold leading-snug text-slate-900 sm:text-lg">{teacher.name}</h3>
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