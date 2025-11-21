import type {
  AppSettings,
  InsightsSummary,
  JournalEntry,
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
  Project,
  PromptResult,
  PromptSelectionContext,
  Trait,
} from "@/types";

const ensureApi = () => {
  if (!window.api) {
    throw new Error("Quiet Questions bridge is unavailable.");
  }
  return window.api;
};

export const api = {
  createEntry: (payload: JournalEntryInput) =>
    ensureApi().createEntry(payload),
  getEntries: (filters: JournalEntryFilters) =>
    ensureApi().getEntries(filters),
  updateEntry: (id: number, patch: JournalEntryPatch) =>
    ensureApi().updateEntry(id, patch),
  deleteEntry: (id: number) => ensureApi().deleteEntry(id),
  getPrompt: (context?: PromptSelectionContext): Promise<PromptResult | null> =>
    ensureApi().getPrompt(context),
  markPromptHandled: (promptId: number, action: "saved" | "skipped") =>
    ensureApi().markPromptHandled(promptId, action),
  snoozePrompt: (minutes: number) => ensureApi().snoozePrompt(minutes),
  getSettings: (): Promise<AppSettings> => ensureApi().getSettings(),
  updateSettings: (patch: Partial<AppSettings>) =>
    ensureApi().updateSettings(patch),
  pausePrompts: () => ensureApi().pausePrompts(),
  resumePrompts: () => ensureApi().resumePrompts(),
  listProjects: (): Promise<Project[]> => ensureApi().listProjects(),
  createProject: (name: string) => ensureApi().createProject(name),
  updateProject: (id: number, name: string) =>
    ensureApi().updateProject(id, name),
  deleteProject: (id: number) => ensureApi().deleteProject(id),
  listTraits: (): Promise<Trait[]> => ensureApi().listTraits(),
  createTrait: (name: string) => ensureApi().createTrait(name),
  updateTrait: (id: number, name: string) =>
    ensureApi().updateTrait(id, name),
  deleteTrait: (id: number) => ensureApi().deleteTrait(id),
  getStats: (): Promise<InsightsSummary> => ensureApi().getStats(),
  openQuickEntry: () => ensureApi().openQuickEntry(),
} satisfies Record<string, (...args: any[]) => Promise<any> | any>;

export type ApiClient = typeof api;

