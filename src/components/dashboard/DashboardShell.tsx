import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type DashboardNavItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  active?: boolean;
  href?: string;
  onSelect?: () => void;
};

type DashboardShellProps = {
  navItems: DashboardNavItem[];
  header: {
    title: string;
    subtitle?: string;
    toolbar?: ReactNode;
  };
  rightRail?: ReactNode;
  children: ReactNode;
};

/** Shared dashboard layout used across teacher, parent, and learning manager previews. */
export default function DashboardShell({ navItems, header, rightRail, children }: DashboardShellProps) {
  return (
    <div className="bg-gradient-to-br from-[#eef6ff] via-[#f6f3ff] to-[#ffeef4] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-12 pt-8 md:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-3 transition hover:opacity-90">
            <img
              src="/assets/images/logo.png"
              alt="Tiny Steps logo"
              className="h-11 w-11 rounded-2xl border border-white/70 bg-white/90 p-1 shadow-sm shadow-slate-900/10"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7c2d58]">Tiny Steps</p>
              <p className="text-base font-semibold text-slate-800">Learning suite</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-2" aria-label="Section navigation">
            {navItems.map((item) => {
              const className = [
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "bg-gradient-to-r from-[#7dd3fc]/40 via-[#c4b5fd]/40 to-[#f9a8d4]/40 text-[#1d4ed8] ring-2 ring-[#7dd3fc]/40"
                  : "text-slate-600 hover:bg-white/70 hover:text-[#1d4ed8]",
              ].join(" ");
              const content = (
                <>
                  {item.icon && (
                    <span
                      className={`grid h-9 w-9 place-content-center rounded-xl ${
                        item.active ? "bg-white text-[#1d4ed8]" : "bg-white/60 text-[#7c2d58]"
                      }`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-[#1d4ed8] shadow-sm shadow-slate-900/5">
                      {item.badge}
                    </span>
                  )}
                </>
              );

              if (item.href) {
                return (
                  <Link key={item.key} to={item.href} className={className} onClick={item.onSelect}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={item.key} type="button" className={className} onClick={item.onSelect}>
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-gradient-to-r from-[#7dd3fc]/30 via-[#c4b5fd]/30 to-[#f9a8d4]/30 p-4 text-sm text-[#1f2937]">
            <p className="font-semibold text-[#1d4ed8]">Need something?</p>
            <p className="mt-1 text-slate-600">
              Learning Managers coordinate parents, teachers, and lesson plans so everyone stays aligned.
            </p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <header className="rounded-3xl border border-white/60 bg-white/85 px-6 py-6 shadow-lg shadow-slate-900/8 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2563eb]/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                  Workspace preview
                </p>
                <h1 className="mt-2 text-3xl font-bold text-[#1f2937]">{header.title}</h1>
                {header.subtitle && <p className="mt-2 max-w-xl text-sm text-slate-500">{header.subtitle}</p>}
              </div>
              <div className="flex flex-col gap-3 self-stretch sm:flex-row sm:items-center sm:justify-end sm:self-auto">
                {header.toolbar}
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#1d4ed8]/20 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#1d4ed8] shadow-sm transition hover:bg-[#1d4ed8]/10"
                >
                  ← Back to main site
                </Link>
              </div>
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Workspace navigation">
              {navItems.map((item) => {
                const className = `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  item.active ? "bg-[#2563eb]/10 text-[#1d4ed8]" : "bg-white/80 text-slate-500"
                }`;
                const content = (
                  <>
                    <span className="text-[#7c2d58]">{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-[#1d4ed8]">
                        {item.badge}
                      </span>
                    )}
                  </>
                );
                if (item.href) {
                  return (
                    <Link key={item.key} to={item.href} className={className} onClick={item.onSelect}>
                      {content}
                    </Link>
                  );
                }
                return (
                  <button key={item.key} type="button" className={className} onClick={item.onSelect}>
                    {content}
                  </button>
                );
              })}
            </nav>
          </header>

          <div className="flex flex-1 flex-col gap-6 lg:flex-row">
            <main className="flex-1 space-y-6">{children}</main>
            {rightRail && (
              <aside className="w-full shrink-0 space-y-6 lg:w-72">
                {rightRail}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
