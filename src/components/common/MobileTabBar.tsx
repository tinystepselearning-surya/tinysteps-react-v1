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
        'fixed inset-x-0 bottom-0 z-50 w-full min-w-0 max-w-[100vw] translate-y-0 transform-gpu overflow-hidden border-t border-slate-200/80 bg-white/95 px-2 pt-1.5 shadow-[0_-6px_20px_rgba(15,23,42,0.07)] backdrop-blur-xl [backface-visibility:hidden] [contain:layout_paint] [padding-bottom:env(safe-area-inset-bottom,0px)] lg:hidden',
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto h-[var(--ts-mobile-tabbar-height)] w-full min-w-0 max-w-6xl overflow-hidden">
        <div
          className={cn(
            useFixedGrid
              ? 'overflow-hidden'
              : 'scrollbar-hide touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain] [overscroll-behavior-y:none] [-webkit-overflow-scrolling:touch]',
          )}
        >
          <div
            className={cn(
              useFixedGrid ? 'grid h-full gap-1 px-0.5' : 'flex h-full w-max min-w-full gap-1 px-0.5',
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
                  data-active={isActive ? 'true' : 'false'}
                  data-selected-style={isActive ? 'icon-capsule' : undefined}
                  className={cn(
                    'group relative flex min-h-11 flex-col items-center justify-center rounded-xl px-1 text-[11px] font-medium transition duration-150 ease-out active:scale-[0.97]',
                    useFixedGrid ? 'min-w-0 w-full' : 'min-w-[74px] snap-center',
                    isActive
                      ? 'font-semibold text-slate-950'
                      : 'text-slate-600 active:bg-slate-100 hover:text-slate-950',
                  )}
                >
                  <span
                    className={cn(
                      'mb-0.5 flex h-7 w-9 items-center justify-center rounded-full transition-colors',
                      isActive
                        ? 'bg-slate-200 text-slate-950'
                        : 'text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-950',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="max-w-full truncate px-0.5 leading-4">{item.label}</span>
                  {hasBadge && (
                    <span className="absolute right-[calc(50%-25px)] top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
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
