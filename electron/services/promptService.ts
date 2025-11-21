import { getDatabase } from "../database";
import type {
  Prompt,
  PromptResult,
  PromptSelectionContext,
  TimeOfDay,
} from "../../src/types/prompt";
import type { EntryCategory } from "../../src/types/journal";
import {
  getRecentCategories,
  getRecentProjectTags,
} from "./journalService";
import { listProjects } from "./projectsService";

interface PromptRow {
  id: number;
  text: string;
  category_id: number;
  category: EntryCategory;
  is_active: number;
  requires_project: number;
}

const mapPrompt = (row: PromptRow): Prompt => ({
  id: Number(row.id),
  text: row.text,
  categoryId: Number(row.category_id),
  category: row.category,
  isActive: Boolean(row.is_active),
  requiresProject: Boolean(row.requires_project),
});

const timeCategoryPreferences: Record<TimeOfDay, EntryCategory[]> = {
  morning: ["identity", "productivity", "behavior", "project"],
  afternoon: ["project", "productivity", "trait"],
  evening: ["emotion", "trait", "small_win"],
  night: ["emotion", "identity", "small_win"],
};

const getTimeOfDay = (date = new Date()): TimeOfDay => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

const pickCategoryOrder = (
  context: PromptSelectionContext,
  availableCategories: EntryCategory[],
) => {
  const history = new Set(context.recentCategoryHistory.slice(0, 3));
  const preference = timeCategoryPreferences[context.timeOfDay];

  const combined = [
    ...preference,
    ...(context.activeProjectTags.length ? ["project"] : []),
    ...availableCategories,
  ];

  const unique = Array.from(new Set(combined)).filter((category) =>
    availableCategories.includes(category),
  );

  const prioritized = unique.filter((category) => !history.has(category));
  return prioritized.length ? prioritized : unique;
};

export const selectPrompt = (
  context?: Partial<PromptSelectionContext>,
): PromptResult | null => {
  const db = getDatabase();

  const rows = db
    .prepare(
      `
      SELECT p.id,
             p.text,
             p.category_id,
             c.name AS category,
             p.is_active,
             p.requires_project
      FROM prompts p
      JOIN prompt_categories c ON c.id = p.category_id
      WHERE p.is_active = 1;
    `,
    )
    .all() as PromptRow[];

  if (!rows.length) {
    return null;
  }

  const prompts = rows.map(mapPrompt);
  const categories = Array.from(
    new Set(prompts.map((prompt) => prompt.category)),
  );

  const fallbackRecentCategories = getRecentCategories(5);
  const fallbackProjects = listProjects().map((project) => project.name);
  const recentProjectTags =
    getRecentProjectTags(5).concat(fallbackProjects).filter(Boolean);

  const resolvedContext: PromptSelectionContext = {
    timeOfDay: context?.timeOfDay ?? getTimeOfDay(),
    recentCategoryHistory:
      context?.recentCategoryHistory?.length
        ? context.recentCategoryHistory
        : fallbackRecentCategories,
    activeProjectTags:
      context?.activeProjectTags?.length
        ? context.activeProjectTags
        : Array.from(new Set(recentProjectTags)),
  };

  const categoryOrder = pickCategoryOrder(resolvedContext, categories);

  for (const category of categoryOrder) {
    const categoryPrompts = prompts.filter(
      (prompt) => prompt.category === category,
    );
    if (!categoryPrompts.length) continue;

    const prompt =
      categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];

    let projectTagSuggestion: string | null = null;
    if (prompt.requiresProject && resolvedContext.activeProjectTags.length) {
      projectTagSuggestion =
        resolvedContext.activeProjectTags[
          Math.floor(Math.random() * resolvedContext.activeProjectTags.length)
        ];
    }

    return {
      prompt,
      projectTagSuggestion,
    };
  }

  return {
    prompt: prompts[Math.floor(Math.random() * prompts.length)],
    projectTagSuggestion:
      resolvedContext.activeProjectTags[0] ?? null,
  };
};

export const markPromptHandled = (): void => {
  // Placeholder for future analytics (AI sentiment, prompt streaks, etc.)
};

