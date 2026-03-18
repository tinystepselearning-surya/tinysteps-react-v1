import type { LucideIcon } from 'lucide-react';
import { cn } from '@components/lib/utils';

export interface MobileTabBarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MobileTabBarProps {
  items: MobileTabBarItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export default function MobileTabBar({
  items,
  activeId,
  onSelect,
  className,
}: MobileTabBarProps) {
  if (!items.length) return null;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 lg:hidden',
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-[58px] flex-col items-center justify-center rounded-xl px-1 text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="truncate leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

