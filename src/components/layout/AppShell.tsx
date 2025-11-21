import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const navItems = [
  { to: "/", label: "Timeline" },
  { to: "/settings", label: "Settings" },
];

const brandGradient =
  "bg-gradient-to-r from-sky-500 via-sun-300 to-sky-500 bg-clip-text text-transparent";

export const AppShell = () => {
  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className={cn("text-xs uppercase tracking-[0.3em] text-slate-400")}>
              Quiet Questions
            </p>
            <h1 className={cn("text-2xl font-semibold text-slate-800", brandGradient)}>
              A calm space to check in with yourself
            </h1>
          </div>
          <nav className="flex items-center gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sky-500 text-white shadow-soft"
                      : "text-slate-600 hover:bg-sky-50",
                  )
                }
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
            <Button
              variant="primary"
              size="md"
              onClick={() => api.openQuickEntry()}
              className="shadow-soft"
            >
              New entry
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/60 bg-white/80 py-4 text-center text-xs text-slate-400">
        Quiet Questions · Local-first reflections for brighter days
      </footer>
    </div>
  );
};

