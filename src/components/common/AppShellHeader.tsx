import type { ReactNode } from 'react';
import { cn } from '@components/lib/utils';
import TinyStepsBrand from './TinyStepsBrand';

interface AppShellHeaderProps {
  actions?: ReactNode;
  className?: string;
  footer?: ReactNode;
  roleLabel: string;
  subtitle?: ReactNode;
  title: ReactNode;
}

export default function AppShellHeader({
  actions,
  className,
  footer,
  roleLabel,
  subtitle,
  title,
}: AppShellHeaderProps) {
  return (
    <header
      className={cn(
        'rounded-[24px] border border-slate-200 bg-white/92 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[28px] sm:px-6 sm:py-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <TinyStepsBrand subtitle={`${roleLabel} workspace`} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              {roleLabel}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 xl:justify-end">{actions}</div>
        ) : null}
      </div>

      {footer ? <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div> : null}
    </header>
  );
}
