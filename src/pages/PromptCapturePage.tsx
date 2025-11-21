import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { EntryCategory, PromptResult } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useProjects } from "@/hooks/useProjects";
import { useTraits } from "@/hooks/useTraits";

const categoryOptions: Array<{ value: EntryCategory; label: string }> = [
  { value: "project", label: "Project" },
  { value: "emotion", label: "Emotion" },
  { value: "trait", label: "Trait" },
  { value: "productivity", label: "Productivity" },
  { value: "identity", label: "Identity" },
  { value: "small_win", label: "Small win" },
  { value: "behavior", label: "Behavior" },
];

const formatPromptText = (template: string, projectTag?: string | null) =>
  projectTag && template.includes("[PROJECT]")
    ? template.replace(/\[PROJECT\]/g, projectTag)
    : template;

export const PromptCapturePage = () => {
  const [params] = useSearchParams();
  const quickEntry = params.get("quick") === "1";
  const navigate = useNavigate();

  const [promptResult, setPromptResult] = useState<PromptResult | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<EntryCategory>("emotion");
  const [projectTag, setProjectTag] = useState<string | null>(null);
  const [traitTag, setTraitTag] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { projects } = useProjects();
  const { traits } = useTraits();

  const prompt = promptResult?.prompt ?? null;

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        setLoading(true);
        const result = await api.getPrompt();
        if (result) {
          setPromptResult(result);
          setProjectTag(result.projectTagSuggestion ?? null);
          setCategoryOverride(result.prompt.category);
        } else {
          setPromptResult(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not fetch prompt.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, []);

  const resolvedPromptText = useMemo(() => {
    if (!prompt) {
      return quickEntry
        ? "Capture a quick reflection."
        : "Share a short reflection about your day.";
    }
    return formatPromptText(prompt.text, projectTag ?? promptResult?.projectTagSuggestion);
  }, [prompt, projectTag, promptResult?.projectTagSuggestion, quickEntry]);

  const handleClose = () => {
    window.close();
    navigate("/");
  };

  const handleSave = useCallback(async () => {
    if (!text.trim()) {
      setError("A short reflection helps capture the moment.");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const entryCategory = prompt?.category ?? categoryOverride;

      await api.createEntry({
        promptId: prompt?.id ?? null,
        promptText: resolvedPromptText,
        category: entryCategory,
        text: text.trim(),
        projectTag: projectTag || null,
        traitTag: traitTag || null,
      });

      if (prompt?.id) {
        await api.markPromptHandled(prompt.id, "saved");
      }
      handleClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save entry right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [prompt, categoryOverride, projectTag, traitTag, resolvedPromptText, text]);

  const handleSkip = async () => {
    if (prompt?.id) {
      await api.markPromptHandled(prompt.id, "skipped");
    }
    handleClose();
  };

  const handleSnooze = async () => {
    await api.snoozePrompt(15);
    handleClose();
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-mist-50 px-4 py-8">
      <Card className="mx-auto w-full max-w-xl">
        <div className="drag-region mb-4 flex items-center justify-between">
          <Tag variant="category" className="no-drag">
            {prompt ? prompt.category : categoryOverride}
          </Tag>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose()}
            className="no-drag"
          >
            Close
          </Button>
        </div>

        <div className="no-drag">
          <h2 className="text-xl font-semibold text-slate-800">
            {resolvedPromptText}
          </h2>

          {error && (
            <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-3">
          {quickEntry && (
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Choose a theme
              <select
                className="rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200 no-drag"
                value={categoryOverride}
                onChange={(event) =>
                  setCategoryOverride(event.target.value as EntryCategory)
                }
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <textarea
            className="no-drag h-32 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Write 1–3 sentences..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Project
              <select
                className="no-drag rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
                value={projectTag ?? ""}
                onChange={(event) =>
                  setProjectTag(event.target.value || null)
                }
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Trait
              <select
                className="no-drag rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-sm focus:border-sky-300 focus:ring-sky-200"
                value={traitTag ?? ""}
                onChange={(event) => setTraitTag(event.target.value || null)}
              >
                <option value="">No trait</option>
                {traits.map((trait) => (
                  <option key={trait.id} value={trait.name}>
                    {trait.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="no-drag"
            >
              Skip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSnooze}
              className="no-drag"
            >
              Remind me later
            </Button>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className={cn("no-drag", loading && "opacity-80")}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
        </div>
      </Card>
    </div>
  );
};

