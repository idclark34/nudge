import path from "node:path";
import { app, BrowserWindow, nativeTheme, Tray } from "electron";
import { getDatabase } from "./database";
import { createMainWindow } from "./windows/mainWindow";
import { createPromptWindow } from "./windows/promptWindow";
import { registerIpcHandlers } from "./ipc/registerHandlers";
import {
  getSettings as readSettings,
  pausePrompts,
  resumePrompts,
  updateSettings as writeSettings,
} from "./services/settingsService";
import { createQuietQuestionsTray } from "./tray";
import { PromptScheduler } from "./promptScheduler";

let mainWindow: BrowserWindow | null = null;
let promptWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scheduler: PromptScheduler | null = null;

const getRendererUrl = () => {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    return devServerUrl;
  }

  return `file://${path.join(__dirname, "../renderer/index.html")}`;
};

const getPreloadPath = () => path.join(__dirname, "preload.js");

const isPromptWindowOpen = () =>
  !!promptWindow && !promptWindow.isDestroyed();

const focusOrRestore = (window: BrowserWindow) => {
  if (window.isMinimized()) {
    window.restore();
  }
  if (!window.isVisible()) {
    window.show();
  }
  window.focus();
};

const openMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow({
      preloadPath: getPreloadPath(),
      rendererUrl: getRendererUrl(),
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } else {
    focusOrRestore(mainWindow);
  }
};

const openPromptWindow = (options?: { quickEntry?: boolean }) => {
  if (promptWindow && !promptWindow.isDestroyed()) {
    focusOrRestore(promptWindow);
    return;
  }

  promptWindow = createPromptWindow({
    preloadPath: getPreloadPath(),
    rendererUrl: getRendererUrl(),
    quickEntry: options?.quickEntry,
  });

  promptWindow.on("closed", () => {
    promptWindow = null;
  });
};

const setupScheduler = () => {
  scheduler = new PromptScheduler({
    getSettings: readSettings,
    isPromptWindowOpen,
    openPromptWindow: () => openPromptWindow(),
  });
  scheduler.start();
};

const setupTray = async () => {
  tray = await createQuietQuestionsTray({
    getMainWindow: () => mainWindow,
    openMainWindow,
    openPromptWindow,
    pausePrompts: async () => {
      const settings = pausePrompts();
      scheduler?.refresh();
      return settings;
    },
    resumePrompts: async () => {
      const settings = resumePrompts();
      scheduler?.refresh();
      return settings;
    },
    getSettings: async () => readSettings(),
    updateSettings: async (patch) => {
      const updated = writeSettings(patch);
      scheduler?.refresh();
      return updated;
    },
    refreshScheduler: () => scheduler?.refresh(),
    quit: () => {
      scheduler?.stop();
      app.quit();
    },
  });
};

const bootstrap = async () => {
  app.setAppUserModelId("com.quietquestions.app");
  nativeTheme.themeSource = "light";

  getDatabase();
  openMainWindow();

  registerIpcHandlers({
    openPromptWindow: (options) => {
      openPromptWindow(options);
    },
    refreshScheduler: () => scheduler?.refresh(),
    snoozePrompt: (minutes) => scheduler?.snooze(minutes ?? 15),
  });

  setupScheduler();
  await setupTray();
};

app.on("ready", bootstrap);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  scheduler?.stop();
});

