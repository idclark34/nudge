import { contextBridge, ipcRenderer } from "electron";
import type { RendererApi } from "../src/types/ipc";
import type {
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
} from "../src/types/journal";
import type { PromptSelectionContext } from "../src/types/prompt";
import type { SettingsPatch } from "../src/types/settings";
import type { IntentionInput, IntentionCheckInInput } from "../src/types/intention";

const api: RendererApi = {
  createEntry: (payload: JournalEntryInput) =>
    ipcRenderer.invoke("entries:create", payload),

  getEntries: (filters: JournalEntryFilters) =>
    ipcRenderer.invoke("entries:get", filters),

  updateEntry: (id: number, patch: JournalEntryPatch) =>
    ipcRenderer.invoke("entries:update", id, patch),

  deleteEntry: (id: number) => ipcRenderer.invoke("entries:delete", id),

  getPrompt: (context?: PromptSelectionContext) =>
    ipcRenderer.invoke("prompts:get", context),

  markPromptHandled: (promptId: number, action: "saved" | "skipped") =>
    ipcRenderer.invoke("prompts:handled", promptId, action),

  snoozePrompt: (minutes: number) =>
    ipcRenderer.invoke("prompts:snooze", minutes),

  getSettings: () => ipcRenderer.invoke("settings:get"),

  updateSettings: (patch: SettingsPatch) =>
    ipcRenderer.invoke("settings:update", patch),

  pausePrompts: () => ipcRenderer.invoke("settings:pause"),

  resumePrompts: () => ipcRenderer.invoke("settings:resume"),

  listProjects: () => ipcRenderer.invoke("projects:list"),

  createProject: (name: string) =>
    ipcRenderer.invoke("projects:create", name),

  updateProject: (id: number, name: string) =>
    ipcRenderer.invoke("projects:update", id, name),

  deleteProject: (id: number) =>
    ipcRenderer.invoke("projects:delete", id),

  listTraits: () => ipcRenderer.invoke("traits:list"),

  createTrait: (name: string) =>
    ipcRenderer.invoke("traits:create", name),

  updateTrait: (id: number, name: string) =>
    ipcRenderer.invoke("traits:update", id, name),

  deleteTrait: (id: number) =>
    ipcRenderer.invoke("traits:delete", id),

  getStats: () => ipcRenderer.invoke("stats:get"),

  openQuickEntry: () => ipcRenderer.invoke("prompts:quick-entry"),

  // Intentions
  createIntention: (input: IntentionInput) =>
    ipcRenderer.invoke("intentions:create", input),

  updateIntention: (id: number, text: string) =>
    ipcRenderer.invoke("intentions:update", id, text),

  deleteIntention: (id: number) =>
    ipcRenderer.invoke("intentions:delete", id),

  toggleIntentionActive: (id: number, isActive: boolean) =>
    ipcRenderer.invoke("intentions:toggle-active", id, isActive),

  getCurrentIntention: () => ipcRenderer.invoke("intentions:current"),

  getCurrentIntentions: () => ipcRenderer.invoke("intentions:current-all"),

  listIntentions: () => ipcRenderer.invoke("intentions:list"),

  createCheckIn: (input: IntentionCheckInInput) =>
    ipcRenderer.invoke("intentions:check-in", input),

  getCheckInsForIntention: (intentionId: number) =>
    ipcRenderer.invoke("intentions:check-ins", intentionId),

  getIntentionPromptContext: () =>
    ipcRenderer.invoke("intentions:prompt-context"),
};

contextBridge.exposeInMainWorld("api", api);

