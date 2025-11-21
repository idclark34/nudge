import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { EntryCategory, JournalEntryFilters } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTraits } from "@/hooks/useTraits";
import { useInsights } from "@/hooks/useInsights";

const categoryLabels: Record<EntryCategory, string> = {
  project: "Project",
  emotion: "Emotion",
  trait: "Trait",
  productivity: "Productivity",
  identity: "Identity",
  small_win: "Small win",
  behavior: "Behavior",
};

const categoryIcons: Record<EntryCategory, string> = {
  project: "🗂️",
  emotion: "💙",
  trait: "🌱",
  productivity: "⚡",
  identity: "🪞",
  small_win: "✨",
  behavior: "🎯",
};

const defaultFilters: JournalEntryFilters = {
  limit: 100,
  offset: 0,
};

export const DashboardPage = () => {
  const [filters, setFilters] = useState<JournalEntryFilters>(defaultFilters);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const { entries, total, loading, error, deleteEntry, refresh } =
    useJournalEntries(filters);
  const { projects } = useProjects();
  const { traits } = useTraits();
  const { insights } = useInsights();

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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card
          title="Filters"
          description="Narrow your reflections to spot patterns."
          actions={
            <Button variant="ghost" size="sm" onClick={() => handleFilterChange(defaultFilters)}>
              Reset
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Category
              <select
                className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
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
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Project
              <select
                className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
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
                className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
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
                className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
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
                className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
              />
            </label>
          </div>
        </Card>

        <Card
          title="Timeline"
          description={
            loading
              ? "Loading your reflections…"
              : `Showing ${entries.length} of ${total} entries.`
          }
        >
          {error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {entries.map((entry) => {
              const isActive = entry.id === selectedEntryId;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={cn(
                    "w-full rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-sky-200",
                    isActive && "border-sky-200 bg-white shadow-soft",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        {dayjs(entry.createdAt).format("ddd · MMM D, HH:mm")}
                      </p>
                      <h4 className="mt-1 text-base font-semibold text-slate-800">
                        {entry.promptText ?? "Free reflection"}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {entry.text}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Tag
                        variant="category"
                        icon={categoryIcons[entry.category]}
                      >
                        {categoryLabels[entry.category]}
                      </Tag>
                      <div className="flex flex-wrap justify-end gap-2">
                        {entry.projectTag && (
                          <Tag variant="project">{entry.projectTag}</Tag>
                        )}
                        {entry.traitTag && (
                          <Tag variant="trait">{entry.traitTag}</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!loading && !entries.length && (
            <div className="rounded-2xl border border-sky-100 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
              No reflections yet. Try creating a quick entry from the tray or wait
              for your next gentle prompt.
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Entry detail">
          {selectedEntry ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {dayjs(selectedEntry.createdAt).format("dddd, MMM D · HH:mm")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-800">
                  {selectedEntry.promptText ?? "Reflection"}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tag variant="category" icon={categoryIcons[selectedEntry.category]}>
                  {categoryLabels[selectedEntry.category]}
                </Tag>
                {selectedEntry.projectTag && (
                  <Tag variant="project">{selectedEntry.projectTag}</Tag>
                )}
                {selectedEntry.traitTag && (
                  <Tag variant="trait">{selectedEntry.traitTag}</Tag>
                )}
              </div>

              <p className="rounded-2xl border border-sky-100 bg-white/70 p-4 text-sm leading-relaxed text-slate-700">
                {selectedEntry.text}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedEntryId && deleteEntry(selectedEntryId)}
                  className="text-rose-500 hover:text-rose-600"
                >
                  Delete entry
                </Button>
                <Button variant="ghost" size="sm" onClick={() => refresh()}>
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-sky-100 bg-white/70 p-4 text-sm text-slate-500">
              Select an entry from the timeline to see full details.
            </p>
          )}
        </Card>

        <Card
          title="Weekly insights"
          description="A gentle snapshot of your focus this week."
        >
          {insights ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-sky-50/70 p-4">
                <p className="text-sm text-slate-600">
                  This week you captured{" "}
                  <span className="font-semibold text-slate-800">
                    {insights.totalThisWeek}
                  </span>{" "}
                  reflections. Your most frequent theme was{" "}
                  <span className="font-semibold text-slate-800">
                    {insights.mostFrequentCategory
                      ? categoryLabels[insights.mostFrequentCategory]
                      : "—"}
                  </span>
                  , with lots of attention on{" "}
                  <span className="font-semibold text-slate-800">
                    {insights.mostActiveProject ?? "any project that mattered"}
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-3">
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400">
                    Entries by category
                  </h4>
                  <div className="mt-2 space-y-2">
                    {insights.entriesByCategory.map((item) => (
                      <div key={item.category} className="flex items-center gap-2">
                        <span className="w-28 text-xs font-medium text-slate-500">
                          {categoryLabels[item.category]}
                        </span>
                        <div className="flex-1 rounded-full bg-sky-50">
                          <div
                            className="h-2 rounded-full bg-sky-500"
                            style={{
                              width: `${Math.min(
                                (item.count / (insights.totalThisWeek || 1)) *
                                  100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-slate-500">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400">
                    Projects with momentum
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {insights.topProjects.map((project) => (
                      <Tag key={project.projectTag} variant="project">
                        {project.projectTag} · {project.count}
                      </Tag>
                    ))}
                    {!insights.topProjects.length && (
                      <p className="text-xs text-slate-400">No tagged projects yet.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Gathering insights…</p>
          )}
        </Card>
      </div>
    </div>
  );
};

