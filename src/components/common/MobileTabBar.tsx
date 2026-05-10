import type { LucideIcon } from 'lucide-react';
import { cn } from '@components/lib/utils';
import { hapticSelection } from '../../lib/nativeHaptics';

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

  const useFixedGrid = items.length <= 5;
  const usesFiveColumnGrid = items.length === 5;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 min-h-[var(--ts-mobile-tabbar-height)] w-full min-w-0 max-w-full translate-y-0 transform-gpu overflow-hidden px-3 pb-[env(safe-area-inset-bottom,0px)] pt-2 [backface-visibility:hidden] [contain:layout_paint] lg:hidden',
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-hidden rounded-[1.625rem] border border-slate-200/80 bg-white/95 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div
          className={cn(
            useFixedGrid
              ? 'overflow-hidden'
              : 'scrollbar-hide touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain] [overscroll-behavior-y:none] [-webkit-overflow-scrolling:touch]',
          )}
        >
          <div
            className={cn(
              useFixedGrid ? 'grid gap-1 px-0.5' : 'flex w-max min-w-full gap-1 px-0.5',
              usesFiveColumnGrid && 'grid-cols-5',
            )}
            style={
              useFixedGrid && !usesFiveColumnGrid
                ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }
                : undefined
            }
          >
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
                  onClick={() => {
                    hapticSelection();
                    onSelect(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-2 text-[11px] font-semibold transition-all duration-150 ease-out active:scale-[0.97]',
                    useFixedGrid ? 'min-w-0 w-full' : 'min-w-[74px] snap-center',
                    isActive
                      ? 'bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]'
                      : 'text-slate-500 active:bg-slate-100 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="mb-1 h-[18px] w-[18px]" />
                  <span className="max-w-full truncate px-0.5 leading-none">{item.label}</span>
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
