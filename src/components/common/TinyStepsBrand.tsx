import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@components/lib/utils';

interface TinyStepsBrandProps {
  className?: string;
  logoClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  titleClassName?: string;
  to?: string;
}

function TinyStepsBrand({
  className,
  logoClassName,
  subtitle = 'Online School',
  subtitleClassName,
  titleClassName,
  to = '/',
}: TinyStepsBrandProps) {
  const content = (
    <>
      <img
        src="/logo-header.webp"
        alt="Tiny Steps logo"
        width={44}
        height={44}
        decoding="async"
        loading="lazy"
        className={cn(
          'h-11 w-11 shrink-0 rounded-full object-contain shadow-sm ring-1 ring-slate-200/80',
          logoClassName,
        )}
      />
      <div className="min-w-0">
        <div className={cn('text-xl font-bold tracking-tight text-orange-500', titleClassName)}>
          Tiny Steps
        </div>
        {subtitle ? (
          <div
            className={cn(
              'text-[11px] uppercase tracking-[0.28em] text-slate-500',
              subtitleClassName,
            )}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </>
  );

  if (!to) {
    return <div className={cn('flex items-center gap-3', className)}>{content}</div>;
  }

  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-3 rounded-full px-1 py-1 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200',
        className,
      )}
      aria-label="Go to Tiny Steps home page"
    >
      {content}
    </Link>
  );
}

export default memo(TinyStepsBrand);
