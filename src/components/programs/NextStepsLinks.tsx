import React from 'react';
import { Link } from 'react-router-dom';

type NextStepsLinksProps = {
  title?: string;
  links: Array<{
    label: string;
    href: string;
    description?: string;
    icon?: string;
  }>;
};

export default function NextStepsLinks({ title = 'Explore More', links }: NextStepsLinksProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h2 className="text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-600">Learn more about Tiny Steps programs and approach</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                {link.icon && <span className="text-lg">{link.icon}</span>}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                  {link.description && (
                    <p className="mt-0.5 text-xs text-slate-600">{link.description}</p>
                  )}
                </div>
              </div>
              <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
