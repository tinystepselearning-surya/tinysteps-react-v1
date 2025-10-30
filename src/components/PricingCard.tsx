type Props = {
  title: string;
  price: string;
  period?: string;
  blurb?: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  accent?: "orange" | "teal" | "violet" | "indigo";
};

const accents = {
  orange: "bg-orange-50 border-orange-200",
  teal: "bg-teal-50 border-teal-200",
  violet: "bg-violet-50 border-violet-200",
  indigo: "bg-indigo-50 border-indigo-200",
};

export default function PricingCard({
  title,
  price,
  period = "/ month",
  blurb,
  features,
  ctaText,
  ctaHref,
  accent = "indigo",
}: Props) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${accents[accent]}`}>
      <h3 className="text-2xl font-bold">{title}</h3>
      <div className="mt-3 text-3xl font-extrabold">
        {price} <span className="text-base font-semibold text-gray-600">{period}</span>
      </div>
      {blurb && <p className="mt-2 text-gray-700">{blurb}</p>}
      <ul className="mt-4 space-y-2 text-gray-800">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1">✅</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
      >
        {ctaText}
      </a>
    </div>
  );
}
