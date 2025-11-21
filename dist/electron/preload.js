"use strict";

// electron/preload.ts
var import_electron = require("electron");
var api = {
  createEntry: (payload) => import_electron.ipcRenderer.invoke("entries:create", payload),
  getEntries: (filters) => import_electron.ipcRenderer.invoke("entries:get", filters),
  updateEntry: (id, patch) => import_electron.ipcRenderer.invoke("entries:update", id, patch),
  deleteEntry: (id) => import_electron.ipcRenderer.invoke("entries:delete", id),
  getPrompt: (context) => import_electron.ipcRenderer.invoke("prompts:get", context),
  markPromptHandled: (promptId, action) => import_electron.ipcRenderer.invoke("prompts:handled", promptId, action),
  snoozePrompt: (minutes) => import_electron.ipcRenderer.invoke("prompts:snooze", minutes),
  getSettings: () => import_electron.ipcRenderer.invoke("settings:get"),
  updateSettings: (patch) => import_electron.ipcRenderer.invoke("settings:update", patch),
  pausePrompts: () => import_electron.ipcRenderer.invoke("settings:pause"),
  resumePrompts: () => import_electron.ipcRenderer.invoke("settings:resume"),
  listProjects: () => import_electron.ipcRenderer.invoke("projects:list"),
  createProject: (name) => import_electron.ipcRenderer.invoke("projects:create", name),
  updateProject: (id, name) => import_electron.ipcRenderer.invoke("projects:update", id, name),
  deleteProject: (id) => import_electron.ipcRenderer.invoke("projects:delete", id),
  listTraits: () => import_electron.ipcRenderer.invoke("traits:list"),
  createTrait: (name) => import_electron.ipcRenderer.invoke("traits:create", name),
  updateTrait: (id, name) => import_electron.ipcRenderer.invoke("traits:update", id, name),
  deleteTrait: (id) => import_electron.ipcRenderer.invoke("traits:delete", id),
  getStats: () => import_electron.ipcRenderer.invoke("stats:get"),
  openQuickEntry: () => import_electron.ipcRenderer.invoke("prompts:quick-entry")
};
import_electron.contextBridge.exposeInMainWorld("api", api);
//# sourceMappingURL=preload.js.map