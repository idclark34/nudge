import path from "node:path";
import { BrowserWindow, shell } from "electron";

interface CreateMainWindowOptions {
  preloadPath: string;
  rendererUrl: string;
}

export const createMainWindow = ({
  preloadPath,
  rendererUrl,
}: CreateMainWindowOptions): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    title: "Quiet Questions",
    backgroundColor: "#fdfbf5",
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 16 },
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
    },
  });

  window.once("ready-to-show", () => {
    if (!window.isDestroyed()) {
      window.show();
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const targetUrl = rendererUrl.endsWith("/")
    ? `${rendererUrl}#/`
    : `${rendererUrl}/#/`;
  window.loadURL(targetUrl);

  return window;
};

