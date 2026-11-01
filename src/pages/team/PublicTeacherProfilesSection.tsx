import { BookOpenCheck, GraduationCap, MessageCircle, Mic2, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  APPROVED_ACADEMIC_LEADERSHIP_PROFILES,
  APPROVED_PUBLIC_TEACHER_PROFILES,
  APPROVED_PUBLIC_TRAINER_PROFILES,
  TRAINING_FOCUS_AREAS,
  isApprovedPublicProfile,
  type PublicAcademicProfile,
  type PublicTeacherProfile,
  type TeachingSpecialism,
} from './publicTeacherProfiles';

/**
 * Public academic profiles are deliberately curated separately from private
 * employment/auth records. Never derive this content from Firestore or HR data.
 */
function ProfileCard({
  profile,
  detail,
}: {
  profile: PublicAcademicProfile;
  detail?: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
      <div className="flex gap-4 p-5 sm:p-6">
        {profile.photoPath ? (
          <img
            src={profile.photoPath}
            alt={`${profile.publicName}, ${profile.position} at Tiny Steps Learning`}
            loading="lazy"
            width={144}
            height={176}
            className="h-36 w-28 shrink-0 rounded-2xl bg-slate-100 object-cover object-top sm:h-44 sm:w-36"
          />
        ) : (
          <div aria-hidden="true" className="flex h-36 w-28 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 sm:h-44 sm:w-36">
            <GraduationCap className="h-10 w-10" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-bold text-slate-950 sm:text-xl">{profile.publicName}</h3>
          <p className="mt-1 text-sm font-semibold text-orange-700">{profile.position}</p>
          {profile.experienceSummary ? (
            <p className="mt-3 text-sm leading-6 text-slate-700">{profile.experienceSummary}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-auto border-t border-orange-100 px-5 pb-5 pt-4 sm:px-6">
        <p className="text-sm font-bold text-slate-900">Education & qualifications</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-700">
          {profile.qualifications.map((qualification) => <li key={qualification}>{qualification}</li>)}
        </ul>
        {detail ? <p className="mt-3 text-sm leading-6 text-slate-700">{detail}</p> : null}
      </div>
    </article>
  );
}

const leadership = APPROVED_ACADEMIC_LEADERSHIP_PROFILES.filter(isApprovedPublicProfile);
const trainers = APPROVED_PUBLIC_TRAINER_PROFILES.filter(isApprovedPublicProfile);
const teachers = APPROVED_PUBLIC_TEACHER_PROFILES.filter(isApprovedPublicProfile)
  .filter((teacher) => teacher.specialisms.length > 0);

const SUBJECTS: readonly {
  id: string;
  specialism: TeachingSpecialism;
  title: string;
  description: string;
}[] = [
  {
    id: 'teachers-phonics',
    specialism: 'phonics',
    title: 'Phonics & Reading Educators',
    description: 'Sound awareness, blending, decoding, spelling and reading fluency.',
  },
  {
    id: 'teachers-grammar',
    specialism: 'grammar',
    title: 'Grammar & Writing Educators',
    description: 'Sentence structure, grammar concepts, correction and practical writing.',
  },
  {
    id: 'teachers-public-speaking',
    specialism: 'public-speaking',
    title: 'Public Speaking & Communication Educators',
    description: 'Storytelling, organised expression, listening and confident communication.',
  },
];

function TeacherCard({ teacher }: { teacher: PublicTeacherProfile }) {
  const trainingDetail = teacher.internalTrainingStatus === 'assessed-and-certified'
    ? 'Tiny Steps internal assessment and certification completed'
    : teacher.internalTrainingStatus === 'completed'
      ? 'Tiny Steps internal programme training completed'
      : null;

  return (
    <div className="space-y-2">
      <ProfileCard
        profile={teacher}
        detail={teacher.expertise?.length ? `Teaching expertise: ${teacher.expertise.join(' · ')}` : undefined}
      />
      {trainingDetail ? (
        <p className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-700">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          {trainingDetail}
        </p>
      ) : null}
    </div>
  );
}

export function AcademicLeadershipProfilesSection() {
  return (
    <section aria-labelledby="academic-leader-heading" className="bg-[#fffaf3] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Academic leadership</p>
        <h2 id="academic-leader-heading" className="mt-3 font-heading text-2xl font-bold text-slate-950 sm:text-3xl">
          Academic guidance behind the classroom
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Alongside our founder, academic leadership oversees curriculum implementation,
          teacher development and the quality of learning experiences.
        </p>
        {leadership.length > 0 ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {leadership.map((person) => <ProfileCard key={person.id} profile={person} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function TeacherTrainingFacultySection() {
  return (
    <section id="teacher-training" aria-labelledby="teacher-training-heading" className="bg-[#f3f7fb] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Level 2 · Teacher training & development</p>
        <h2 id="teacher-training-heading" className="mt-3 font-heading text-3xl font-bold text-slate-950 sm:text-4xl">
          Weekly learning and coaching for our teachers
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Our internal academic trainers guide weekly teacher-development sessions.
          The focus is practical: strengthen subject teaching, child-centred delivery,
          lesson preparation and responsive classroom techniques.
        </p>
        <h3 className="mt-9 font-heading text-lg font-bold text-slate-950">Training focus areas</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRAINING_FOCUS_AREAS.map((area) => (
            <article key={area.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <BookOpenCheck className="h-6 w-6 text-orange-700" aria-hidden="true" />
              <h4 className="mt-3 font-heading text-lg font-bold text-slate-950">{area.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-700">{area.description}</p>
            </article>
          ))}
        </div>
        {trainers.length > 0 ? (
          <div className="mt-10">
            <h3 className="font-heading text-2xl font-bold text-slate-950">Meet our academic trainers</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {trainers.map((trainer) => (
                <ProfileCard
                  key={trainer.id}
                  profile={trainer}
                  detail={`Training areas: ${TRAINING_FOCUS_AREAS.filter((area) => trainer.focusAreas.includes(area.id)).map((area) => area.title).join(' · ')}`}
                />
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-8 max-w-4xl border-l-4 border-orange-400 pl-4 text-sm leading-6 text-slate-700">
          Tiny Steps training is internal professional development. Any individual internal
          certification is shown only after the relevant assessment is completed and verified;
          it is not an external university or board accreditation.
        </p>
      </div>
    </section>
  );
}

export default function PublicTeacherProfilesSection() {
  return (
    <section id="our-teachers" aria-labelledby="our-teachers-heading" className="bg-[#fffaf3] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Level 3 · Teaching faculty</p>
        <h2 id="our-teachers-heading" className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Meet our teachers and their qualifications
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Our educators teach Phonics, Reading, Grammar, Writing and Public Speaking
          using structured programme resources, guided practice and individual feedback.
          Teacher profiles are published only after qualifications and consent are verified.
        </p>
        <nav aria-label="Browse teachers by subject" className="mt-7 flex flex-wrap gap-3">
          {SUBJECTS.map((subject) => (
            <a key={subject.id} href={`#${subject.id}`} className="inline-flex min-h-11 items-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-400 hover:bg-orange-50">
              {subject.title.replace(' Educators', '')}
            </a>
          ))}
        </nav>
        <div className="mt-9 space-y-12">
          {SUBJECTS.map((subject) => {
            const matching = teachers.filter((teacher) => teacher.specialisms.includes(subject.specialism));
            return (
              <div id={subject.id} key={subject.id} className="scroll-mt-28">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700" aria-hidden="true">
                    {subject.specialism === 'public-speaking' ? <Mic2 className="h-5 w-5" /> : subject.specialism === 'grammar' ? <MessageCircle className="h-5 w-5" /> : <BookOpenCheck className="h-5 w-5" />}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-slate-950 sm:text-2xl">{subject.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{subject.description}</p>
                  </div>
                </div>
                {matching.length > 0 ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {matching.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} />)}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-orange-100 bg-white px-5 py-4 text-sm leading-6 text-slate-700">
                    <UsersRound className="mr-2 inline h-5 w-5 text-orange-700" aria-hidden="true" />
                    For information about the educators available for your child, please contact our academic team.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-white p-5">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-950">Questions about your child's teacher?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">Our academic team can discuss relevant teaching experience and suitability. A listed profile does not guarantee timetable availability.</p>
          </div>
          <Link to="/contact" className="inline-flex min-h-11 items-center rounded-full bg-[#10243e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b4269]">
            Contact our academic team
          </Link>
        </div>
      </div>
    </section>
  );
}
