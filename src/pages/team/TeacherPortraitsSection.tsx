import { Link } from 'react-router-dom';
import { publicTeacherPhotos } from 'virtual:tiny-steps-team-photos';

export function TeacherPortraitsSection() {
  return (
    <section id="teachers" aria-labelledby="team-teachers-title" className="border-y border-[#E4DCF8] bg-gradient-to-br from-[#FFF7EC] via-[#FBF8FF] to-[#EAF6FF] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">Our teaching team</p>
          <h2 id="team-teachers-title" className="mx-auto mt-3 max-w-3xl font-heading text-3xl font-bold tracking-tight text-[#102A43] sm:text-4xl">
            Meet the educators behind every live lesson
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Our graduate educators guide children in phonics, reading, grammar, writing and public speaking.
            They work with structured lessons, a shared curriculum and ongoing academic guidance to support each child&apos;s learning.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 sm:mt-14">
          <span className="hidden h-px max-w-24 flex-1 bg-[#e9d9cb] sm:block" aria-hidden="true" />
          <h3 className="font-heading text-center text-lg font-bold leading-snug text-[#102A43] sm:text-xl">
            Early Years &amp; Primary English Educators
          </h3>
          <span className="hidden h-px max-w-24 flex-1 bg-[#e9d9cb] sm:block" aria-hidden="true" />
        </div>

        {publicTeacherPhotos.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 sm:gap-y-12 lg:grid-cols-4 xl:grid-cols-5">
            {publicTeacherPhotos.map((teacher) => (
              <figure key={teacher.src} className="flex min-w-0 flex-col items-center">
                <div className="aspect-[4/5] w-full max-w-[230px] overflow-hidden rounded-[50%] border-4 border-white bg-[#f7ead8] shadow-[0_10px_28px_rgba(15,23,42,0.09)] ring-1 ring-[#ecd8ca]">
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
                <figcaption className="mt-4 max-w-full px-1 text-center">
                  <h3 className="font-heading text-base font-bold leading-snug text-[#102A43] sm:text-lg">{teacher.name}</h3>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="mx-auto mt-12 max-w-3xl border-t border-[#e9d9cb] pt-7 text-center">
          <p className="text-sm leading-6 text-slate-600">
            See how our educators bring lessons to life.{' '}
            <Link to="/class-samples" className="font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950">View real class samples</Link>
            {' '}or{' '}
            <Link to="/book-demo" className="font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950">request a free demo assessment</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
