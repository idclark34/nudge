import { ipcMain } from "electron";
import type {
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
} from "../../src/types/journal";
import type { PromptSelectionContext } from "../../src/types/prompt";
import type { SettingsPatch } from "../../src/types/settings";
import {
  createEntry,
  deleteEntry,
  getEntries,
  updateEntry,
} from "../services/journalService";
import {
  selectPrompt,
  markPromptHandled,
} from "../services/promptService";
import {
  getSettings,
  pausePrompts,
  resumePrompts,
  updateSettings,
} from "../services/settingsService";
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../services/projectsService";
import {
  createTrait,
  deleteTrait,
  listTraits,
  updateTrait,
} from "../services/traitsService";
import { buildInsightsSummary } from "../services/statsService";

export interface IpcHandlerContext {
  openPromptWindow: (options?: { quickEntry?: boolean }) => void;
  refreshScheduler: () => void;
  snoozePrompt: (minutes: number) => void;
}

export const registerIpcHandlers = (ctx: IpcHandlerContext) => {
  ipcMain.handle("entries:create", async (_event, payload: JournalEntryInput) =>
    createEntry(payload),
  );

  ipcMain.handle("entries:get", async (_event, filters: JournalEntryFilters) =>
    getEntries(filters),
  );

  ipcMain.handle(
    "entries:update",
    async (_event, id: number, patch: JournalEntryPatch) =>
      updateEntry(id, patch),
  );

  ipcMain.handle("entries:delete", async (_event, id: number) => {
    deleteEntry(id);
    return true;
  });

  ipcMain.handle(
    "prompts:get",
    async (_event, context?: PromptSelectionContext) =>
      selectPrompt(context ?? undefined),
  );

  ipcMain.handle(
    "prompts:handled",
    async (_event, promptId: number, action: "saved" | "skipped") => {
      markPromptHandled();
      return { promptId, action };
    },
  );

  ipcMain.handle("prompts:quick-entry", async () => {
    ctx.openPromptWindow({ quickEntry: true });
  });

  ipcMain.handle("prompts:snooze", async (_event, minutes: number) => {
    ctx.snoozePrompt(minutes);
    return true;
  });

  ipcMain.handle("settings:get", async () => getSettings());

  ipcMain.handle(
    "settings:update",
    async (_event, patch: SettingsPatch) => {
      const updated = updateSettings(patch);
      ctx.refreshScheduler();
      return updated;
    },
  );

  ipcMain.handle("settings:pause", async () => {
    const updated = pausePrompts();
    ctx.refreshScheduler();
    return updated;
  });
  ipcMain.handle("settings:resume", async () => {
    const updated = resumePrompts();
    ctx.refreshScheduler();
    return updated;
  });

  ipcMain.handle("projects:list", async () => listProjects());
  ipcMain.handle("projects:create", async (_event, name: string) =>
    createProject(name),
  );
  ipcMain.handle(
    "projects:update",
    async (_event, id: number, name: string) => updateProject(id, name),
  );
  ipcMain.handle("projects:delete", async (_event, id: number) => {
    deleteProject(id);
    return true;
  });

  ipcMain.handle("traits:list", async () => listTraits());
  ipcMain.handle("traits:create", async (_event, name: string) =>
    createTrait(name),
  );
  ipcMain.handle(
    "traits:update",
    async (_event, id: number, name: string) => updateTrait(id, name),
  );
  ipcMain.handle("traits:delete", async (_event, id: number) => {
    deleteTrait(id);
    return true;
  });

  ipcMain.handle("stats:get", async () => buildInsightsSummary());

  // no-op handler reserved for future needs
};

