const items = [
  { h: "Phonics", p: "SATPIN to long vowels and beyond." },
  { h: "Grammar", p: "From simple sentences to tenses." },
  { h: "Public Speaking", p: "Confidence, clarity, and expression." },
];

export default function Highlights() {
  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 grid gap-6 md:grid-cols-3">
        {items.map((x) => (
          <article
            key={x.h}
            className="rounded-3xl border border-gray-100 shadow-sm p-6 bg-white"
          >
            <h3 className="text-lg font-semibold">{x.h}</h3>
            <p className="mt-2 text-gray-600">{x.p}</p>
            <a href="#" className="mt-4 inline-block text-sm underline">
              Learn more
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
