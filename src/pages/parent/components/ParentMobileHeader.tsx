import { CircleUser, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";
import { getParentTabTitle, type ParentTabKey } from "../parentNavigation";

type ParentMobileHeaderProps = {
  activeTab: ParentTabKey;
  childName?: string | null;
  onMenu: () => void;
  onProfile: () => void;
  className?: string;
};

export default function ParentMobileHeader({
  activeTab,
  childName,
  onMenu,
  onProfile,
  className,
}: ParentMobileHeaderProps) {
  const normalizedChildName = String(childName || "").trim();

  return (
    <header
      className={cn(
        "ts-parent-mobile-header sticky top-0 z-50 hidden shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 max-lg:block",
        className,
      )}
      data-safe-area-owner="header"
      data-testid="parent-mobile-header"
    >
      <div className="flex h-14 min-w-0 items-center gap-2 px-2 sm:px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full text-slate-700 active:scale-95 active:bg-slate-100 hover:bg-slate-100 hover:text-slate-950"
          onClick={onMenu}
          aria-label="Open parent menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-[17px] font-bold leading-5 tracking-tight text-slate-950 dark:text-slate-100 sm:text-lg">
            {getParentTabTitle(activeTab)}
          </h1>
          {normalizedChildName && (
            <p
              className="truncate text-xs leading-4 text-slate-600 dark:text-slate-400"
              data-testid="parent-mobile-child-name"
              title={normalizedChildName}
            >
              {normalizedChildName}
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full text-slate-700 active:scale-95 active:bg-slate-100 hover:bg-slate-100 hover:text-slate-950"
          onClick={onProfile}
          aria-label="Open profile and payments"
        >
          <CircleUser className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
