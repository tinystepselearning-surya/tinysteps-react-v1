import { Link } from 'react-router-dom';
import TinyStepsBrand from './TinyStepsBrand';

interface AuthPageBrandHeaderProps {
  label: string;
}

export default function AuthPageBrandHeader({ label }: AuthPageBrandHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TinyStepsBrand subtitle="Online School" />
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
          {label}
        </div>
        <Link
          to="/"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          Back to website
        </Link>
      </div>
    </div>
  );
}
