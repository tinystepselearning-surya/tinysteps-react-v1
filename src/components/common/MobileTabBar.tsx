import type { LucideIcon } from 'lucide-react';
import { cn } from '@components/lib/utils';

export interface MobileTabBarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
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
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur">
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1 pr-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            const badgeCount = Math.max(0, Number(item.badgeCount || 0));
            const hasBadge = badgeCount > 0;
            const badgeLabel = badgeCount > 99 ? '99+' : String(badgeCount);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[58px] min-w-[78px] flex-col items-center justify-center rounded-xl px-2 text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="truncate leading-tight">{item.label}</span>
                {hasBadge && (
                  <span
                    className={cn(
                      'absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                      isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                    )}
                  >
                    {badgeLabel}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </nav>
  );
}
