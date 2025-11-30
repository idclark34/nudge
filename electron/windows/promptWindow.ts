import { BrowserWindow } from "electron";

interface RendererTarget {
  isFile: boolean;
  entry: string;
}

interface CreatePromptWindowOptions {
  preloadPath: string;
  rendererTarget: RendererTarget;
  quickEntry?: boolean;
}

export const createPromptWindow = ({
  preloadPath,
  rendererTarget,
  quickEntry,
}: CreatePromptWindowOptions): BrowserWindow => {
  // Extra padding for the shadow effect
  const shadowPadding = 40;
  const contentWidth = 420;
  const contentHeight = 440;

  const window = new BrowserWindow({
    width: contentWidth + shadowPadding * 2,
    height: contentHeight + shadowPadding * 2,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    title: quickEntry ? "Quiet Questions — Quick Entry" : "Quiet Questions",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
  });

  // Gentle fade-in: start at 0 opacity and very slowly animate up (~3 seconds)
  window.setOpacity(0);
  window.once("ready-to-show", () => {
    window.show();
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.01;
      if (opacity >= 1) {
        window.setOpacity(1);
        clearInterval(fadeIn);
      } else {
        window.setOpacity(opacity);
      }
    }, 30);
  });

  // Override close to fade out gently
  let isClosing = false;
  window.on("close", (event) => {
    if (!isClosing) {
      event.preventDefault();
      isClosing = true;
      let opacity = 1;
      const fadeOut = setInterval(() => {
        opacity -= 0.03;
        if (opacity <= 0) {
          clearInterval(fadeOut);
          window.destroy();
        } else {
          window.setOpacity(opacity);
        }
      }, 20);
    }
  });

  const hash = quickEntry ? "/prompt?quick=1" : "/prompt";

  if (rendererTarget.isFile) {
    window.loadFile(rendererTarget.entry, { hash });
  } else {
    const baseUrl = rendererTarget.entry.endsWith("/")
      ? rendererTarget.entry
      : `${rendererTarget.entry}/`;
    window.loadURL(`${baseUrl}#/prompt${quickEntry ? "?quick=1" : ""}`);
  }
  return window;
};

