import { BrowserWindow } from "electron";

interface CreatePromptWindowOptions {
  preloadPath: string;
  rendererUrl: string;
  quickEntry?: boolean;
}

export const createPromptWindow = ({
  preloadPath,
  rendererUrl,
  quickEntry,
}: CreatePromptWindowOptions): BrowserWindow => {
  const window = new BrowserWindow({
    width: 420,
    height: 360,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    show: false,
    frame: false,
    title: quickEntry ? "Quiet Questions — Quick Entry" : "Quiet Questions",
    backgroundColor: "#fdfbf5",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
  });

  window.once("ready-to-show", () => window.show());

  const urlBase = rendererUrl.endsWith("/")
    ? `${rendererUrl}#/prompt`
    : `${rendererUrl}/#/prompt`;
  const url = quickEntry ? `${urlBase}?quick=1` : urlBase;

  window.loadURL(url);
  return window;
};

