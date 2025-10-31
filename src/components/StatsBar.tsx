export default function StatsBar() {
  const stats = [
    { label: "Students coached", value: "3,500+", description: "Across India & the Middle East" },
    { label: "Certified educators", value: "45+", description: "Cambridge CELTA • Jolly Phonics • Trinity" },
    { label: "Years of expertise", value: "12", description: "Blending literacy, writing & speaking" },
  ];

  return (
    <section className="bg-gradient-to-r from-[#f5f0ff] via-[#f0f9ff] to-[#fff4ec] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-gray-200/60">
            <p className="text-3xl md:text-4xl font-black text-[#0f172a]">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-[#7c3aed]">{stat.label}</p>
            <p className="mt-2 text-sm text-gray-600">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
