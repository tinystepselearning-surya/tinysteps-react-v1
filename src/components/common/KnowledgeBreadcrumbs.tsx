import type { FC } from 'react';
import { Link } from 'react-router-dom';

type BreadcrumbItem = {
  name: string;
  path: string;
};

type KnowledgeBreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
  tone?: 'light' | 'dark';
  className?: string;
};

const KnowledgeBreadcrumbs: FC<KnowledgeBreadcrumbsProps> = ({ items, tone = 'light', className = '' }) => {
  if (!items?.length) return null;

  const linkClass = tone === 'dark'
    ? 'text-slate-300 transition hover:text-white'
    : 'text-slate-500 transition hover:text-slate-950';
  const currentClass = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const separatorClass = tone === 'dark' ? 'text-slate-500' : 'text-slate-300';

  return (
    <nav
      aria-label="Breadcrumb"
      data-knowledge-breadcrumb="true"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold ${className}`.trim()}
    >
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <span key={`${item.path}-${index}`} className="inline-flex min-w-0 items-center gap-2">
            {index > 0 ? <span aria-hidden="true" className={separatorClass}>/</span> : null}
            {isCurrent ? (
              <span aria-current="page" className={`max-w-[22rem] truncate ${currentClass}`}>{item.name}</span>
            ) : (
              <Link to={item.path} className={linkClass}>{item.name}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default KnowledgeBreadcrumbs;
