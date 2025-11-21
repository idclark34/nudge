import type { EntryCategory } from "./journal";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface Prompt {
  id: number;
  text: string;
  categoryId: number;
  category: EntryCategory;
  isActive: boolean;
  requiresProject: boolean;
}

export interface PromptSelectionContext {
  timeOfDay: TimeOfDay;
  recentCategoryHistory: EntryCategory[];
  activeProjectTags: string[];
}

export interface PromptResult {
  prompt: Prompt;
  projectTagSuggestion: string | null;
}

