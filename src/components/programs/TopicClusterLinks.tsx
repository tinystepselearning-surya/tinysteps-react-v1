import React from 'react';
import { Link } from 'react-router-dom';

type TopicClusterLinksProps = {
  title: string;
  className?: string; // Add className
  links: Array<{
    label: string;
    href: string;
  }>;
};

export default function TopicClusterLinks({ title, links, className = '' }: TopicClusterLinksProps) {
  return (
    <section className={`mx-auto max-w-4xl px-6 py-6 ${className}`}>
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h2 className="text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-600">Deep dive into specific topics to support your child's learning journey at home.</p>
        
        <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-2 rounded-xl py-2 px-3 text-sm font-medium text-primary-700 transition hover:bg-primary-50 hover:text-primary-800"
            >
              <span>•</span>
              <span className="underline underline-offset-2">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
