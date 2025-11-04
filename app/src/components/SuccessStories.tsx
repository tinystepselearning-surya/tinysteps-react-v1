type Story = {
  name: string;
  details: string;
  quote: string;
  outcome: string;
  avatarColor: string;
};

const stories: Story[] = [
  {
    name: "Kavya · Grade 1",
    details: "Started: struggling with SATPIN · After 12 weeks: reading storybooks independently",
    quote: "The structured digital practice meant we never had to print worksheets. Kavya reads nightly and shares voice notes with her teacher.",
    outcome: "Moved from emerging to proficient on phonics dashboard.",
    avatarColor: "bg-gradient-to-br from-[#ffddc8] to-[#ff9a5c]",
  },
  {
    name: "Aarav · Grade 4",
    details: "Started: avoided writing paragraphs · After 16 weeks: published persuasive essays",
    quote: "The grammar labs feel like creative workshops. The weekly feedback voice notes keep us aligned without hovering.",
    outcome: "Scored 28/30 in school writing assessment and leads class presentations.",
    avatarColor: "bg-gradient-to-br from-[#c7d2fe] to-[#6366f1]",
  },
  {
    name: "Riya · Grade 5",
    details: "Started: whispered during show & tell · After 20 weeks: hosted school assembly",
    quote: "Video clips after each session helped us watch Riya’s progress together. She now speaks with pace and poise.",
    outcome: "Won district storytelling contest and mentors juniors in school club.",
    avatarColor: "bg-gradient-to-br from-[#fbcfe8] to-[#f472b6]",
  },
];

export default function SuccessStories() {
  return (
    <section className="bg-[#f5f0ff] py-20" id="success-stories">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7c3aed]">Success stories</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-[#0f172a]">Real families, measurable transformations</h2>
          <p className="mt-3 text-lg text-gray-600">
            Our dashboards show the numbers and parents share the joy. Here are a few journeys from the 3,500+ children we’ve
            coached.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.name} className="flex h-full flex-col gap-4 rounded-3xl border border-white/60 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${story.avatarColor}`}>
                  {story.name.charAt(0)}
                </span>
                <p className="text-sm font-semibold text-[#0f172a]">{story.name}</p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7c3aed]">Progress snapshot</p>
              <p className="text-sm text-gray-600 leading-relaxed">{story.details}</p>
              <blockquote className="text-[0.95rem] font-medium leading-6 text-gray-900">“{story.quote}”</blockquote>
              <p className="mt-auto text-sm font-semibold text-[#0f172a]">Outcome: {story.outcome}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
