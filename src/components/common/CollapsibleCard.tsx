import React, { useId, useState } from 'react';
import { cn } from '../lib/utils';

type CollapsibleCardProps = {
  title: string;
  subtext?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  cta?: React.ReactNode;
};

// Performance-focused collapsible card: animates max-height (not height:auto),
// rotates chevron, and avoids page reflow jank.
export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtext,
  icon,
  children,
  defaultOpen = false,
  className,
  cta
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div
      className={cn(
        'group rounded-2xl bg-white/90 ring-1 ring-slate-200 transition-colors hover:bg-white shadow-sm hover:shadow-md',
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-xl">{icon}</div>
        <div className="flex-1 text-left">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {subtext && <div className="text-sm text-gray-600">{subtext}</div>}
        </div>
        <span
          className={cn(
            'inline-block transition-transform duration-300 text-gray-500',
            open ? 'rotate-180' : 'rotate-0'
          )}
        >
          ▼
        </span>
      </button>
      <div
        id={panelId}
        className={cn('collapsible-body px-5 pb-4', open ? 'open' : '')}
      >
        <div className="text-sm text-gray-700">{children}</div>
        {cta && <div className="mt-3">{cta}</div>}
      </div>
    </div>
  );
};

