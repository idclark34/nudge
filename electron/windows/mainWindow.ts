import { BrowserWindow, shell } from "electron";

interface RendererTarget {
  isFile: boolean;
  entry: string;
}

interface CreateMainWindowOptions {
  preloadPath: string;
  rendererTarget: RendererTarget;
}

export const createMainWindow = ({
  preloadPath,
  rendererTarget,
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

  if (rendererTarget.isFile) {
    window.loadFile(rendererTarget.entry, { hash: "/" });
  } else {
    const baseUrl = rendererTarget.entry.endsWith("/")
      ? rendererTarget.entry
      : `${rendererTarget.entry}/`;
    window.loadURL(`${baseUrl}#/`);
  }

  return window;
};

