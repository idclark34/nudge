import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSettings } from "@/hooks/useSettings";
import { useProjects } from "@/hooks/useProjects";
import { useTraits } from "@/hooks/useTraits";

const frequencyOptions = [30, 60, 90, 120];

export const SettingsPage = () => {
  const { settings, loading, saveSettings, togglePrompts } = useSettings();
  const {
    projects,
    createProject,
    deleteProject,
    updateProject,
    loading: projectsLoading,
  } = useProjects();
  const {
    traits,
    createTrait,
    deleteTrait,
    updateTrait,
    loading: traitsLoading,
  } = useTraits();

  const [newProject, setNewProject] = useState("");
  const [newTrait, setNewTrait] = useState("");

  const promptLabel = useMemo(() => {
    if (!settings) return "";
    return settings.isPaused ? "Prompts paused" : "Prompts active";
  }, [settings]);

  if (loading || !settings) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white/70 p-6 text-sm text-slate-500">
        Loading your preferences…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title="Prompt rhythm"
        description="Tune how often Quiet Questions checks in with you."
        actions={
          <Button variant="ghost" onClick={() => togglePrompts()}>
            {settings.isPaused ? "Resume prompts" : "Pause prompts"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Prompt frequency
            <select
              className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
              value={settings.promptIntervalMinutes}
              onChange={(event) =>
                saveSettings({ promptIntervalMinutes: Number(event.target.value) })
              }
            >
              {frequencyOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  Every {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2 text-sm text-slate-600">
            Quiet hours
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                From
                <input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(event) =>
                    saveSettings({ quietHoursStart: event.target.value })
                  }
                  className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
                />
              </label>
              <label className="flex flex-col gap-1">
                To
                <input
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(event) =>
                    saveSettings({ quietHoursEnd: event.target.value })
                  }
                  className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
                />
              </label>
            </div>
            <p className="text-xs text-slate-400">{promptLabel}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Projects"
          description="Projects help Quiet Questions nudge you about meaningful work."
        >
          <form
            className="mb-4 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newProject.trim()) return;
              createProject(newProject.trim());
              setNewProject("");
            }}
          >
            <input
              type="text"
              placeholder="Add a project…"
              value={newProject}
              onChange={(event) => setNewProject(event.target.value)}
              className="flex-1 rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
            />
            <Button type="submit" disabled={!newProject.trim() || projectsLoading}>
              Add
            </Button>
          </form>

          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/70 px-4 py-3"
              >
                <span className="font-medium text-slate-700">{project.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = window.prompt(
                        "Rename project",
                        project.name,
                      );
                      if (updated && updated.trim() && updated !== project.name) {
                        updateProject(project.id, updated.trim());
                      }
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => deleteProject(project.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {!projects.length && (
              <p className="rounded-2xl border border-sky-100 bg-white/60 px-4 py-3 text-xs text-slate-400">
                Add projects like “Agora”, “Studio”, or “Health” to tailor prompts.
              </p>
            )}
          </div>
        </Card>

        <Card
          title="Traits"
          description="Traits highlight the qualities you want to notice."
        >
          <form
            className="mb-4 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newTrait.trim()) return;
              createTrait(newTrait.trim());
              setNewTrait("");
            }}
          >
            <input
              type="text"
              placeholder="Add a trait…"
              value={newTrait}
              onChange={(event) => setNewTrait(event.target.value)}
              className="flex-1 rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
            />
            <Button type="submit" disabled={!newTrait.trim() || traitsLoading}>
              Add
            </Button>
          </form>

          <div className="space-y-2">
            {traits.map((trait) => (
              <div
                key={trait.id}
                className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/70 px-4 py-3"
              >
                <span className="font-medium text-slate-700">{trait.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = window.prompt("Rename trait", trait.name);
                      if (updated && updated.trim() && updated !== trait.name) {
                        updateTrait(trait.id, updated.trim());
                      }
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => deleteTrait(trait.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {!traits.length && (
              <p className="rounded-2xl border border-sky-100 bg-white/60 px-4 py-3 text-xs text-slate-400">
                Add traits like “Curiosity”, “Resilience”, or “Calm” to help prompts
                rotate thoughtfully.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card
        title="Appearance"
        description="Dark mode and palette adjustments are coming soon."
      >
        <div className="rounded-2xl border border-sky-100 bg-white/70 px-4 py-6 text-sm text-slate-500">
          Quiet Questions currently uses a soft daylight palette. A night-friendly
          dark mode is on the roadmap.
        </div>
      </Card>
    </div>
  );
};

