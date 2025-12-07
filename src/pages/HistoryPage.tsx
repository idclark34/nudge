import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { EntryCategory, JournalEntryFilters } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTraits } from "@/hooks/useTraits";

dayjs.extend(relativeTime);

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

const categoryGradients: Record<EntryCategory, string> = {
  project: "from-blue-100 to-indigo-100",
  emotion: "from-pink-100 to-rose-100",
  trait: "from-emerald-100 to-teal-100",
  productivity: "from-amber-100 to-orange-100",
  identity: "from-violet-100 to-purple-100",
  small_win: "from-yellow-100 to-amber-100",
  behavior: "from-sky-100 to-cyan-100",
};

const defaultFilters: JournalEntryFilters = {
  limit: 100,
  offset: 0,
};

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
  
  // Fallback for old entries - just show "Mood Check-in" or a snippet
  if (entry.text.includes("Mood check-in:")) {
    return "Mood Check-in";
  }
  
  // Last resort - use promptText or generic label
  return entry.promptText ?? "Reflection";
};

export const HistoryPage = () => {
  const [filters, setFilters] = useState<JournalEntryFilters>(defaultFilters);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const { entries, total, loading, error, deleteEntry, refresh } =
    useJournalEntries(filters);
  const { projects } = useProjects();
  const { traits } = useTraits();

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  useEffect(() => {
    if (!selectedEntryId && entries.length) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

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

  const hasActiveFilters = Boolean(
    filters.category || filters.projectTag || filters.traitTag || filters.fromDate || filters.toDate
  );

  // Group entries by month
  const entriesByMonth = useMemo(() => {
    const groups: Record<string, typeof entries> = {};
    entries.forEach((entry) => {
      const monthKey = dayjs(entry.createdAt).format("MMMM YYYY");
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(entry);
    });
    return groups;
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-600 transition-all hover:bg-white hover:shadow-sm"
            >
              ←
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                <span>📚</span>
                Full History
              </h1>
              <p className="text-sm text-slate-500">
                {loading ? "Loading..." : `${total} total sparks captured`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#C5FFD8]/50 bg-white/70 p-5 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(defaultFilters)}
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Category
            <select
              className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
              value={filters.category ?? ""}
              onChange={(e) =>
                handleFilterChange({
                  category: (e.target.value as EntryCategory) || undefined,
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
              onChange={(e) =>
                handleFilterChange({
                  projectTag: e.target.value || undefined,
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
              onChange={(e) =>
                handleFilterChange({
                  traitTag: e.target.value || undefined,
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
              onChange={(e) =>
                handleFilterChange({ fromDate: e.target.value || undefined })
              }
              className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            To
            <input
              type="date"
              value={filters.toDate ?? ""}
              onChange={(e) =>
                handleFilterChange({ toDate: e.target.value || undefined })
              }
              className="rounded-xl border border-[#A9EDEB]/50 bg-white/70 px-3 py-2 text-sm focus:border-[#78BCEB] focus:ring-[#9FD8FF]"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Entries grouped by month */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {Object.entries(entriesByMonth).map(([month, monthEntries]) => (
            <div key={month} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span>📅</span>
                {month}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {monthEntries.length}
                </span>
              </h3>
              
              <div className="space-y-2">
                {monthEntries.map((entry) => {
                  const isActive = entry.id === selectedEntryId;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                      className={cn(
                        "entry-card group w-full rounded-2xl border-2 p-4 text-left transition-all",
                        isActive
                          ? "border-[#78BCEB]/50 bg-gradient-to-br from-white to-[#F0FBFF] shadow-md"
                          : "border-transparent bg-white/60 hover:border-[#C5FFD8]/50 hover:bg-gradient-to-br hover:from-white hover:to-[#F0FFF4]"
                      )}
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
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
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
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && !entries.length && (
            <div className="rounded-2xl border border-dashed border-[#A9EDEB] bg-gradient-to-br from-[#F0FFF4] to-[#F0FBFF] px-6 py-10 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm font-medium text-slate-600">
                No sparks found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try adjusting your filters or create new entries.
              </p>
            </div>
          )}
        </div>

        {/* Entry detail sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[#FFDEB5]/50 bg-gradient-to-br from-white to-[#FFFDF9] p-5 shadow-soft backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <span className="emoji-wiggle">📌</span>
              Details
            </h2>

            {selectedEntry ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    {dayjs(selectedEntry.createdAt).format("dddd, MMM D, YYYY · HH:mm")}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-slate-800">
                    {getEntryTitle(selectedEntry)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                      `bg-gradient-to-r ${categoryGradients[selectedEntry.category]} text-slate-700`
                    )}
                  >
                    <span>{categoryIcons[selectedEntry.category]}</span>
                    {categoryLabels[selectedEntry.category]}
                  </span>
                  {selectedEntry.projectTag && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      🛠️ {selectedEntry.projectTag}
                    </span>
                  )}
                  {selectedEntry.traitTag && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      🧠 {selectedEntry.traitTag}
                    </span>
                  )}
                </div>

                <p className="rounded-2xl border border-[#FFDEB5]/30 bg-[#FFFDF9] p-4 text-sm leading-relaxed text-slate-700">
                  {selectedEntry.text}
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedEntryId && deleteEntry(selectedEntryId)}
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#FFDEB5] bg-[#FFFDF9]/50 p-6 text-center">
                <span className="text-3xl">👆</span>
                <p className="mt-2 text-xs text-slate-500">
                  Select an entry to see details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

