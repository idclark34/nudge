import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useWeeklyVibe } from "@/hooks/useWeeklyVibe";

const navItems = [
  { to: "/", label: "This Week", icon: "✨" },
  { to: "/history", label: "History", icon: "📚" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

// Dynamic gradient colors based on vibe level
const vibeButtonGradients = {
  low: "from-slate-400 to-indigo-500",
  foggy: "from-blue-400 to-indigo-500",
  balanced: "from-teal-400 to-emerald-500",
  motivated: "from-amber-400 to-orange-500",
  electric: "from-rose-400 to-violet-500",
};

const vibeNavActiveGradients = {
  low: "from-slate-100 to-indigo-100 text-slate-700",
  foggy: "from-blue-100 to-indigo-100 text-blue-700",
  balanced: "from-teal-100 to-emerald-100 text-teal-700",
  motivated: "from-amber-100 to-orange-100 text-amber-800",
  electric: "from-rose-100 to-violet-100 text-violet-700",
};

const vibeNavHoverColors = {
  low: "hover:bg-slate-50 hover:text-slate-700",
  foggy: "hover:bg-blue-50 hover:text-blue-700",
  balanced: "hover:bg-teal-50 hover:text-teal-700",
  motivated: "hover:bg-amber-50 hover:text-amber-700",
  electric: "hover:bg-rose-50 hover:text-violet-700",
};

export const AppShell = () => {
  const vibe = useWeeklyVibe();

  return (
    <div className={cn(
      "animated-gradient-bg relative flex min-h-screen flex-col overflow-hidden transition-colors duration-700",
      `bg-gradient-to-br ${vibe.bgGradient}`
    )}>
      {/* Animated aurora blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={cn(
          "aurora-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full blur-3xl",
          vibe.vibeLevel === "low" && "bg-slate-300/30",
          vibe.vibeLevel === "foggy" && "bg-blue-300/30",
          vibe.vibeLevel === "balanced" && "bg-teal-300/30",
          vibe.vibeLevel === "motivated" && "bg-amber-300/30",
          vibe.vibeLevel === "electric" && "bg-rose-300/30",
        )} />
        <div className={cn(
          "aurora-blob-delayed absolute -right-32 top-1/2 h-80 w-80 rounded-full blur-3xl",
          vibe.vibeLevel === "low" && "bg-indigo-300/25",
          vibe.vibeLevel === "foggy" && "bg-indigo-300/25",
          vibe.vibeLevel === "balanced" && "bg-emerald-300/25",
          vibe.vibeLevel === "motivated" && "bg-orange-300/25",
          vibe.vibeLevel === "electric" && "bg-violet-300/25",
        )} />
        <div className={cn(
          "aurora-blob-slow absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full blur-3xl",
          vibe.vibeLevel === "low" && "bg-slate-400/20",
          vibe.vibeLevel === "foggy" && "bg-cyan-300/20",
          vibe.vibeLevel === "balanced" && "bg-cyan-300/20",
          vibe.vibeLevel === "motivated" && "bg-rose-300/20",
          vibe.vibeLevel === "electric" && "bg-fuchsia-300/20",
        )} />
      </div>
      <header className={cn(
        "sticky top-0 z-20 overflow-hidden border-b border-white/60 backdrop-blur-xl transition-colors duration-700",
        `bg-gradient-to-r ${vibe.headerGradient}`
      )}>
        {/* Decorative background elements - colors based on vibe */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute -left-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-colors duration-700",
            vibe.vibeLevel === "low" && "bg-gradient-to-br from-slate-200/40 to-indigo-200/30",
            vibe.vibeLevel === "foggy" && "bg-gradient-to-br from-blue-200/40 to-indigo-200/30",
            vibe.vibeLevel === "balanced" && "bg-gradient-to-br from-teal-200/40 to-emerald-200/30",
            vibe.vibeLevel === "motivated" && "bg-gradient-to-br from-amber-200/40 to-orange-200/30",
            vibe.vibeLevel === "electric" && "bg-gradient-to-br from-rose-200/40 to-violet-200/30",
          )} />
          <div className={cn(
            "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-colors duration-700",
            vibe.vibeLevel === "low" && "bg-gradient-to-br from-indigo-200/40 to-slate-200/30",
            vibe.vibeLevel === "foggy" && "bg-gradient-to-br from-indigo-200/40 to-blue-200/30",
            vibe.vibeLevel === "balanced" && "bg-gradient-to-br from-emerald-200/40 to-cyan-200/30",
            vibe.vibeLevel === "motivated" && "bg-gradient-to-br from-orange-200/40 to-rose-200/30",
            vibe.vibeLevel === "electric" && "bg-gradient-to-br from-violet-200/40 to-fuchsia-200/30",
          )} />
        </div>
        
        <div className="relative mx-auto w-full max-w-6xl px-6 py-4">
          {/* Top row: Brand centered, New Entry on right */}
          <div className="relative flex items-center justify-center">
            {/* Centered brand */}
            <div className="flex items-center gap-3">
              <span className="animate-bounce-slow text-4xl">{vibe.emoji}</span>
              <h1 className={cn(
                "bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl transition-all duration-700",
                `bg-gradient-to-r ${vibe.gradient}`
              )}>
                Spark
              </h1>
              <span className="animate-bounce-slow text-4xl" style={{ animationDelay: "0.15s" }}>⚡</span>
            </div>
            
            {/* New Entry button - absolute positioned on right */}
            <Button
              variant="primary"
              size="md"
              onClick={() => api.openQuickEntry()}
              className={cn(
                "absolute right-0 shadow-lg transition-all hover:scale-105 hover:shadow-xl",
                `bg-gradient-to-r ${vibeButtonGradients[vibe.vibeLevel]}`
              )}
            >
              <span className="mr-1.5">🌟</span>
              New spark
            </Button>
          </div>
          
          {/* Vibe indicator */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-lg">{vibe.emoji}</span>
            <p className="text-sm text-slate-600">
              {vibe.label}
              {vibe.moodCount > 0 && (
                <span className="ml-1 text-slate-400">
                  · {vibe.averageMood}/10 avg from {vibe.moodCount} check-in{vibe.moodCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          
          {/* Navigation tabs */}
          <nav className="mt-4 flex items-center justify-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? `bg-gradient-to-r ${vibeNavActiveGradients[vibe.vibeLevel]} shadow-sm`
                      : `text-slate-500 ${vibeNavHoverColors[vibe.vibeLevel]}`,
                  )
                }
                end={item.to === "/"}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-white/60 bg-white/80 py-4 text-center text-xs text-slate-400 backdrop-blur-sm">
        Spark · Local-first reflections for brighter days
      </footer>
    </div>
  );
};

