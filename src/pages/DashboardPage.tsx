import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { EntryCategory, JournalEntryFilters } from "@/types";

dayjs.extend(relativeTime);
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTraits } from "@/hooks/useTraits";
import { useInsights } from "@/hooks/useInsights";
import { useIntention } from "@/hooks/useIntention";
import { useWeeklyPulse } from "@/hooks/useWeeklyPulse";

const categoryLabels: Record<EntryCategory, string> = {
  project: "Project",
  emotion: "Emotion",
  trait: "Trait",
  productivity: "Productivity",
  identity: "Identity",
  small_win: "Small Win",
  behavior: "Behavior",
};

const categoryIcons: Record<EntryCategory, string> = {
  project: "🛠️",
  emotion: "💙",
  trait: "🧠",
  productivity: "⚡",
  identity: "🪞",
  small_win: "🏆",
  behavior: "🎯",
};

// Gradient colors for each category
const categoryGradients: Record<EntryCategory, string> = {
  project: "from-blue-100 to-indigo-100",
  emotion: "from-pink-100 to-rose-100",
  trait: "from-emerald-100 to-teal-100",
  productivity: "from-amber-100 to-orange-100",
  identity: "from-violet-100 to-purple-100",
  small_win: "from-yellow-100 to-amber-100",
  behavior: "from-sky-100 to-cyan-100",
};

// Bar colors for insights (pastel)
const categoryBarColors: Record<EntryCategory, string> = {
  project: "bg-gradient-to-r from-blue-400 to-indigo-400",
  emotion: "bg-gradient-to-r from-pink-400 to-rose-400",
  trait: "bg-gradient-to-r from-emerald-400 to-teal-400",
  productivity: "bg-gradient-to-r from-amber-400 to-orange-400",
  identity: "bg-gradient-to-r from-violet-400 to-purple-400",
  small_win: "bg-gradient-to-r from-yellow-400 to-amber-400",
  behavior: "bg-gradient-to-r from-sky-400 to-cyan-400",
};

// Get date from 7 days ago in ISO format
const getWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
};

const defaultFilters: JournalEntryFilters = {
  limit: 50,
  offset: 0,
  fromDate: getWeekAgoDate(),
};

// Quick filter pills for categories
const quickFilterCategories: { category: EntryCategory; emoji: string }[] = [
  { category: "emotion", emoji: "💙" },
  { category: "trait", emoji: "🧠" },
  { category: "project", emoji: "🛠️" },
  { category: "small_win", emoji: "🏆" },
  { category: "productivity", emoji: "⚡" },
];

// Helper to get a better display title for entries
const getEntryTitle = (entry: { promptText: string | null; text: string }): string => {
  // If promptText looks like a mood (has emoji), use it
  if (entry.promptText && /^[🥀🌫️🌤️🔥🌈✨⚡💙🎯]/.test(entry.promptText)) {
    return entry.promptText;
  }
  
  // Try to extract mood from text
  const moodMatch = entry.text.match(/Mood check-in:.*?—\s*(.+?)(?:\n|$)/);
  if (moodMatch) {
    return moodMatch[1].trim();
  }
  
  // Fallback for old entries
  if (entry.text.includes("Mood check-in:")) {
    return "Mood Check-in";
  }
  
  return entry.promptText ?? "Reflection";
};

export const DashboardPage = () => {
  const [filters, setFilters] = useState<JournalEntryFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Intention editing state
  const [editingIntentionId, setEditingIntentionId] = useState<number | "new" | null>(null);
  const [editedIntention, setEditedIntention] = useState("");
  const [isSavingIntention, setIsSavingIntention] = useState(false);

  const { entries, total, loading, error, refresh } =
    useJournalEntries(filters);
  const { projects } = useProjects();
  const { traits } = useTraits();
  const { insights } = useInsights();
  const { 
    intentions, 
    checkIns, 
    addIntention, 
    updateIntention, 
    deleteIntention: removeIntention,
    refresh: refreshIntention 
  } = useIntention();
  const pulse = useWeeklyPulse();

  // Start editing an intention
  const handleEditIntention = (id: number) => {
    const intention = intentions.find(i => i.id === id);
    setEditedIntention(intention?.text ?? "");
    setEditingIntentionId(id);
  };

  // Start adding a new intention
  const handleAddIntention = () => {
    setEditedIntention("");
    setEditingIntentionId("new");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIntentionId(null);
    setEditedIntention("");
  };

  // Save edited intention
  const handleSaveIntention = async () => {
    if (!editedIntention.trim()) return;
    
    setIsSavingIntention(true);
    try {
      if (editingIntentionId === "new") {
        await addIntention(editedIntention.trim());
      } else if (typeof editingIntentionId === "number") {
        await updateIntention(editingIntentionId, editedIntention.trim());
      }
      setEditingIntentionId(null);
      setEditedIntention("");
      refreshIntention();
    } catch (err) {
      console.error("Failed to save intention:", err);
    } finally {
      setIsSavingIntention(false);
    }
  };

  // Delete an intention
  const handleDeleteIntention = async (id: number) => {
    if (!window.confirm("Remove this intention?")) return;
    try {
      await removeIntention(id);
      refreshIntention();
    } catch (err) {
      console.error("Failed to delete intention:", err);
    }
  };

  const uniqueProjects = useMemo(() => {
    const fromEntries = Array.from(
      new Set(entries.map((entry) => entry.projectTag).filter(Boolean)),
    ) as string[];
    const fromSettings = projects.map((project) => project.name);
    return Array.from(new Set([...fromSettings, ...fromEntries]));
  }, [entries, projects]);

  const uniqueTraits = useMemo(() => {
    const fromEntries = Array.from(
      new Set(entries.map((entry) => entry.traitTag).filter(Boolean)),
    ) as string[];
    const fromSettings = traits.map((trait) => trait.name);
    return Array.from(new Set([...fromSettings, ...fromEntries]));
  }, [entries, traits]);

  const handleFilterChange = (partial: Partial<JournalEntryFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      offset: 0,
    }));
  };

  // Check if any filters are active (excluding default limit/offset)
  const hasActiveFilters = Boolean(
    filters.category || filters.projectTag || filters.traitTag || filters.fromDate || filters.toDate
  );
  const activeFilterCount = [
    filters.category,
    filters.projectTag,
    filters.traitTag,
    filters.fromDate,
    filters.toDate,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Hero: Monthly Intention */}
      <div className="intention-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E9D5FF] via-[#C5FFD8] to-[#9FD8FF] p-8 shadow-lg md:p-10">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
          <span className="absolute left-[5%] top-[15%] animate-float text-3xl opacity-30">🌟</span>
          <span className="absolute right-[10%] top-[20%] animate-float text-2xl opacity-25" style={{ animationDelay: "0.5s" }}>✨</span>
          <span className="absolute bottom-[20%] left-[15%] animate-float text-2xl opacity-20" style={{ animationDelay: "1s" }}>💫</span>
          <span className="absolute bottom-[25%] right-[15%] animate-float text-xl opacity-25" style={{ animationDelay: "1.5s" }}>🌸</span>
          <span className="absolute left-[40%] top-[10%] animate-float text-xl opacity-20" style={{ animationDelay: "2s" }}>⭐</span>
        </div>
        
        <div className="relative z-10">
          {/* Month label */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-1.5 backdrop-blur-sm">
            <span className="text-lg">🌟</span>
            <span className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} Focus
            </span>
          </div>

          {editingIntentionId !== null ? (
            /* Edit/Add mode */
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                {editingIntentionId === "new" ? "Add a new intention" : "Edit your intention"}
              </label>
              <textarea
                value={editedIntention}
                onChange={(e) => setEditedIntention(e.target.value)}
                placeholder="What do you want to focus on this month?"
                className="w-full max-w-2xl rounded-2xl border-2 border-white/50 bg-white/60 px-4 py-3 text-lg font-medium text-slate-800 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-white focus:bg-white/80 focus:outline-none focus:ring-0"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveIntention}
                  disabled={!editedIntention.trim() || isSavingIntention}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                    editedIntention.trim()
                      ? "bg-white text-slate-800 shadow-lg hover:shadow-xl hover:scale-105"
                      : "bg-white/50 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isSavingIntention ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      {editingIntentionId === "new" ? "Add Intention" : "Save Changes"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : intentions.length > 0 ? (
            <div className="space-y-4">
              {/* Intentions list */}
              <div className="space-y-3">
                {intentions.map((intention, index) => {
                  const intentionCheckIns = checkIns.get(intention.id) ?? [];
                  const latestCheckIn = intentionCheckIns[0];
                  
                  return (
                    <div 
                      key={intention.id}
                      className={cn(
                        "group rounded-2xl bg-white/40 p-4 backdrop-blur-sm transition-all hover:bg-white/60",
                        index === 0 && "bg-white/60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 text-xl">
                          {index === 0 ? "🎯" : "💫"}
                        </span>
                        <div className="flex-1">
                          <h2 className={cn(
                            "font-bold leading-tight text-slate-800",
                            index === 0 ? "text-xl md:text-2xl" : "text-lg"
                          )}>
                            {intention.text}
                          </h2>
                          
                          {/* Progress indicators */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {intentionCheckIns.length} check-in{intentionCheckIns.length !== 1 ? "s" : ""}
                            </span>
                            
                            {latestCheckIn && (
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                latestCheckIn.progress === "on_track" && "bg-emerald-100/70 text-emerald-700",
                                latestCheckIn.progress === "struggling" && "bg-amber-100/70 text-amber-700",
                                latestCheckIn.progress === "pivoting" && "bg-blue-100/70 text-blue-700",
                                latestCheckIn.progress === "achieved" && "bg-violet-100/70 text-violet-700"
                              )}>
                                {latestCheckIn.progress === "on_track" && "🎯 On track"}
                                {latestCheckIn.progress === "struggling" && "💪 Working on it"}
                                {latestCheckIn.progress === "pivoting" && "🔄 Pivoting"}
                                {latestCheckIn.progress === "achieved" && "🎉 Achieved!"}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleEditIntention(intention.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm text-slate-600 transition-all hover:bg-white hover:text-slate-800"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteIntention(intention.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
                            title="Remove"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add new intention button */}
              <button
                onClick={handleAddIntention}
                className="flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/60"
              >
                <span>➕</span>
                Add another intention
              </button>
            </div>
          ) : (
            /* No intentions set - show create option */
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="max-w-xl text-2xl font-bold text-slate-800 md:text-3xl">
                  What's your focus for {new Date().toLocaleDateString("en-US", { month: "long" })}?
                </h1>
                <p className="text-base text-slate-600">
                  Set an intention to guide your reflections this month.
                </p>
              </div>
              <button
                onClick={handleAddIntention}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                <span>✨</span>
                Set Your First Intention
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Filter:</span>
        <button
          onClick={() => handleFilterChange({ category: undefined })}
          className={cn(
            "quick-filter-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            !filters.category
              ? "bg-gradient-to-r from-[#C5FFD8] to-[#9FD8FF] text-slate-800 shadow-md"
              : "bg-white/70 text-slate-600 hover:bg-white"
          )}
        >
          <span>🌈</span>
          <span>All</span>
        </button>
        {quickFilterCategories.map(({ category, emoji }) => (
          <button
            key={category}
            onClick={() => handleFilterChange({ 
              category: filters.category === category ? undefined : category 
            })}
            className={cn(
              "quick-filter-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              filters.category === category
                ? "bg-gradient-to-r from-[#C5FFD8] to-[#9FD8FF] text-slate-800 shadow-md"
                : "bg-white/70 text-slate-600 hover:bg-white"
            )}
          >
            <span className="emoji-wiggle">{emoji}</span>
            <span>{categoryLabels[category]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Collapsible Advanced Filters */}
          <div className="overflow-hidden rounded-2xl border border-[#C5FFD8]/50 bg-white/70 shadow-soft backdrop-blur-sm">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#C5FFD8]/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg emoji-wiggle">🔍</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Advanced Filters</h3>
                  <p className="text-xs text-slate-500">
                    {hasActiveFilters
                      ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
                      : "Date ranges, projects & more"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#78BCEB] to-[#9FD8FF] text-xs font-medium text-white">
                    {activeFilterCount}
                  </span>
                )}
                <span
                  className={cn(
                    "text-slate-400 transition-transform duration-200",
                    showFilters && "rotate-180"
                  )}
                >
                  ▼
                </span>
              </div>
            </button>

            {showFilters && (
              <div className="border-t border-[#C5FFD8]/50 px-5 pb-5 pt-4">
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange(defaultFilters)}
                    disabled={!hasActiveFilters}
                  >
                    Reset filters
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    Category
                    <select
                      className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
                      value={filters.category ?? ""}
                      onChange={(event) =>
                        handleFilterChange({
                          category: (event.target.value as EntryCategory) || undefined,
                        })
                      }
                    >
                      <option value="">All categories</option>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {categoryIcons[key as EntryCategory]} {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    Project
                    <select
                      className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
                      value={filters.projectTag ?? ""}
                      onChange={(event) =>
                        handleFilterChange({
                          projectTag: event.target.value || undefined,
                        })
                      }
                    >
                      <option value="">All projects</option>
                      {uniqueProjects.map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    Trait
                    <select
                      className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
                      value={filters.traitTag ?? ""}
                      onChange={(event) =>
                        handleFilterChange({
                          traitTag: event.target.value || undefined,
                        })
                      }
                    >
                      <option value="">All traits</option>
                      {uniqueTraits.map((trait) => (
                        <option key={trait} value={trait}>
                          {trait}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    From
                    <input
                      type="date"
                      value={filters.fromDate ?? ""}
                      onChange={(event) =>
                        handleFilterChange({ fromDate: event.target.value || undefined })
                      }
                      className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    To
                    <input
                      type="date"
                      value={filters.toDate ?? ""}
                      onChange={(event) =>
                        handleFilterChange({ toDate: event.target.value || undefined })
                      }
                      className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Section - This Week */}
          <div className="rounded-2xl border border-[#C5FFD8]/50 bg-white/70 p-5 shadow-soft backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <span className="emoji-wiggle">📖</span>
                  This Week
                </h2>
                <p className="text-xs text-slate-500">
                  {loading
                    ? "Loading your reflections…"
                    : `${entries.length} spark${entries.length !== 1 ? "s" : ""} captured`}
                </p>
              </div>
              <Link 
                to="/history"
                className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-white hover:text-slate-800 hover:shadow-sm"
              >
                <span>📚</span>
                View all history
              </Link>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="entry-card group rounded-2xl border-2 border-transparent bg-white/60 p-4 transition-all hover:border-[#C5FFD8]/50 hover:bg-gradient-to-br hover:from-white hover:to-[#F0FFF4]"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="entry-emoji text-lg group-hover:animate-wiggle">
                          {categoryIcons[entry.category]}
                        </span>
                        <p className="text-xs font-medium text-slate-400">
                          {dayjs(entry.createdAt).format("ddd · MMM D, HH:mm")}
                        </p>
                      </div>
                      <h4 className="mt-1.5 text-sm font-semibold text-slate-800">
                        {getEntryTitle(entry)}
                      </h4>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {entry.text}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                          `bg-gradient-to-r ${categoryGradients[entry.category]} text-slate-700`
                        )}
                      >
                        {categoryLabels[entry.category]}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {entry.projectTag && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            🛠️ {entry.projectTag}
                          </span>
                        )}
                        {entry.traitTag && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            🧠 {entry.traitTag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!loading && !entries.length && (
              <div className="rounded-2xl border border-dashed border-[#A9EDEB] bg-gradient-to-br from-[#F0FFF4] to-[#F0FBFF] px-6 py-10 text-center">
                <span className="text-4xl">🌱</span>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No reflections yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Create a quick entry from the tray or wait for your next gentle prompt.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Weekly Pulse */}
          <div className="rounded-2xl border border-[#FFDEB5]/50 bg-gradient-to-br from-white to-[#FFFDF9] p-5 shadow-soft backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <span className="emoji-wiggle">💫</span>
              Weekly Pulse
            </h2>
            <p className="text-xs text-slate-500">Your week at a glance</p>

            <div className="mt-4 space-y-4">
              {/* Streak */}
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-md">
                  🔥
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {pulse.currentStreak} day{pulse.currentStreak !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-500">Current streak</p>
                </div>
              </div>

              {/* Mood Trend */}
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-md",
                  pulse.moodTrend === "up" && "bg-gradient-to-br from-emerald-400 to-green-500",
                  pulse.moodTrend === "down" && "bg-gradient-to-br from-slate-400 to-slate-500",
                  pulse.moodTrend === "steady" && "bg-gradient-to-br from-sky-400 to-cyan-500",
                  pulse.moodTrend === "unknown" && "bg-gradient-to-br from-slate-300 to-slate-400",
                )}>
                  {pulse.moodTrend === "up" && "📈"}
                  {pulse.moodTrend === "down" && "📉"}
                  {pulse.moodTrend === "steady" && "➡️"}
                  {pulse.moodTrend === "unknown" && "❓"}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">
                    {pulse.moodTrend === "up" && "Trending up!"}
                    {pulse.moodTrend === "down" && "A quieter week"}
                    {pulse.moodTrend === "steady" && "Steady vibes"}
                    {pulse.moodTrend === "unknown" && "Keep checking in"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pulse.thisWeekAvg !== null ? (
                      <>
                        {pulse.thisWeekAvg}/10 avg
                        {pulse.lastWeekAvg !== null && pulse.moodTrendDelta !== 0 && (
                          <span className={cn(
                            "ml-1",
                            pulse.moodTrendDelta > 0 ? "text-emerald-600" : "text-slate-500"
                          )}>
                            ({pulse.moodTrendDelta > 0 ? "+" : ""}{pulse.moodTrendDelta} from last week)
                          </span>
                        )}
                      </>
                    ) : (
                      "No mood check-ins yet"
                    )}
                  </p>
                </div>
              </div>

              {/* Top Theme */}
              {pulse.topTheme ? (
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-2xl shadow-md">
                    {pulse.topTheme.emoji}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {pulse.topTheme.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      Most common theme · {pulse.topTheme.count}x this week
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-2xl shadow-md">
                    🎯
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      No theme yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Pick vibes during check-ins to see patterns
                    </p>
                  </div>
                </div>
              )}

              {/* Activity summary */}
              <div className="flex items-center justify-around rounded-2xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-xl font-bold text-slate-800">{pulse.activeDays}</p>
                  <p className="text-xs text-slate-500">Active days</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-xl font-bold text-slate-800">{pulse.totalCheckIns}</p>
                  <p className="text-xs text-slate-500">Check-ins</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-xl font-bold text-slate-800">{pulse.totalEntries}</p>
                  <p className="text-xs text-slate-500">Total sparks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Insights */}
          <div className="rounded-2xl border border-[#9FD8FF]/50 bg-gradient-to-br from-white to-[#F0FBFF] p-5 shadow-soft backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <span className="emoji-wiggle">📈</span>
              Weekly Glimpse
            </h2>
            <p className="text-xs text-slate-500">A gentle snapshot of your focus this week.</p>

            {insights ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-2xl bg-gradient-to-r from-[#C5FFD8]/30 to-[#9FD8FF]/30 p-4">
                  <p className="text-sm text-slate-600">
                    This week you captured{" "}
                    <span className="font-bold text-slate-800">
                      {insights.totalThisWeek}
                    </span>{" "}
                    reflections. Your most frequent theme was{" "}
                    <span className="font-bold text-slate-800">
                      {insights.mostFrequentCategory
                        ? `${categoryIcons[insights.mostFrequentCategory]} ${categoryLabels[insights.mostFrequentCategory]}`
                        : "—"}
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-4">
                  <section>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <span>🎨</span> By Category
                    </h4>
                    <div className="mt-3 space-y-2">
                      {insights.entriesByCategory.map((item) => (
                        <div key={item.category} className="flex items-center gap-2">
                          <span className="w-6 text-center">
                            {categoryIcons[item.category]}
                          </span>
                          <span className="w-20 text-xs font-medium text-slate-600">
                            {categoryLabels[item.category]}
                          </span>
                          <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                categoryBarColors[item.category]
                              )}
                              style={{
                                width: `${Math.min(
                                  (item.count / (insights.totalThisWeek || 1)) * 100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right text-xs font-medium text-slate-500">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <span>🚀</span> Projects with momentum
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {insights.topProjects.map((project) => (
                        <span
                          key={project.projectTag}
                          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          🛠️ {project.projectTag}
                          <span className="ml-1 rounded-full bg-white/60 px-1.5 py-0.5 text-xs">
                            {project.count}
                          </span>
                        </span>
                      ))}
                      {!insights.topProjects.length && (
                        <p className="text-xs italic text-slate-400">
                          No tagged projects yet. Keep going! 🌱
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span className="animate-pulse">✨</span>
                Gathering insights…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
