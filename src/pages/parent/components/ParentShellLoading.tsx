type ParentShellLoadingProps = {
  showNativeTabBar: boolean;
};

export default function ParentShellLoading({
  showNativeTabBar,
}: ParentShellLoadingProps) {
  return (
    <div
      className="min-h-[100dvh] w-full overflow-hidden bg-slate-100"
      aria-label="Loading parent dashboard"
      role="status"
    >
      <span className="sr-only">Loading parent dashboard</span>
      <div className="ts-parent-mobile-header border-b border-slate-200/80 bg-white/95">
        <div className="flex h-14 items-center gap-3 px-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-300" />
            <div className="h-2.5 w-16 rounded bg-slate-200" />
          </div>
          <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="space-y-4 p-3 sm:p-6">
        <div className="h-36 rounded-2xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-24 rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
      {showNativeTabBar && (
        <div
          className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-3 pt-2"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-hidden="true"
        >
          <div className="grid h-[68px] grid-cols-5 items-center gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="mx-auto h-9 w-9 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
