import type { FC } from 'react';

type ContentTrustNoteProps = {
  text: string;
  className?: string;
};

const ContentTrustNote: FC<ContentTrustNoteProps> = ({ text, className = '' }) => {
  return (
    <section className={`mx-auto max-w-4xl px-6 pt-6 ${className}`.trim()}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Academic note</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
      </div>
    </section>
  );
};

export default ContentTrustNote;
