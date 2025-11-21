import type {
  JournalEntry,
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
} from "./journal";
import type { PromptResult, PromptSelectionContext } from "./prompt";
import type { AppSettings, SettingsPatch } from "./settings";
import type { InsightsSummary } from "./stats";
import type { Project, Trait } from "./taxonomy";

export interface RendererApi {
  createEntry(payload: JournalEntryInput): Promise<JournalEntry>;
  getEntries(
    filters: JournalEntryFilters,
  ): Promise<{ entries: JournalEntry[]; total: number }>;
  updateEntry(id: number, patch: JournalEntryPatch): Promise<JournalEntry>;
  deleteEntry(id: number): Promise<void>;

  getPrompt(
    context?: PromptSelectionContext,
  ): Promise<PromptResult | null>;
  markPromptHandled(promptId: number, action: "saved" | "skipped"): Promise<void>;
  snoozePrompt(minutes: number): Promise<void>;

  getSettings(): Promise<AppSettings>;
  updateSettings(patch: SettingsPatch): Promise<AppSettings>;
  pausePrompts(): Promise<AppSettings>;
  resumePrompts(): Promise<AppSettings>;

  listProjects(): Promise<Project[]>;
  createProject(name: string): Promise<Project>;
  updateProject(id: number, name: string): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  listTraits(): Promise<Trait[]>;
  createTrait(name: string): Promise<Trait>;
  updateTrait(id: number, name: string): Promise<Trait>;
  deleteTrait(id: number): Promise<void>;

  getStats(): Promise<InsightsSummary>;
  openQuickEntry(): Promise<void>;
}

declare global {
  interface Window {
    api: RendererApi;
  }
}

export {};

