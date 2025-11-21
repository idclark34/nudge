import { Menu, Tray, nativeImage, BrowserWindow } from "electron";
import type { AppSettings, SettingsPatch } from "../src/types/settings";

interface TrayOptions {
  getMainWindow: () => BrowserWindow | null;
  openMainWindow: () => void;
  openPromptWindow: (options?: { quickEntry?: boolean }) => void;
  pausePrompts: () => Promise<AppSettings>;
  resumePrompts: () => Promise<AppSettings>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (patch: SettingsPatch) => Promise<AppSettings>;
  refreshScheduler: () => void;
  quit: () => void;
}

const buildIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8BB2D9"/>
          <stop offset="100%" stop-color="#F5D8A5"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#grad)"/>
      <text x="48" y="60" text-anchor="middle" font-family="Avenir, Helvetica, Arial, sans-serif" font-size="44" fill="#1F2933" font-weight="600">Q</text>
    </svg>
  `;
  const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return nativeImage.createFromDataURL(svgUrl).resize({ width: 22, height: 22 });
};

export const createQuietQuestionsTray = async (options: TrayOptions) => {
  const frequencyOptions = [30, 60, 90, 120];
  const icon = buildIcon();
  const tray = new Tray(icon);
  tray.setToolTip("Quiet Questions");
  if (process.platform === "darwin") {
    tray.setTitle("QQ");
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[QuietQuestions] Tray ready");
  }

  const refreshMenu = async () => {
    const settings = await options.getSettings();
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Open Quiet Questions",
          click: () => options.openMainWindow(),
        },
        {
          label: "New quick entry…",
          click: () => options.openPromptWindow({ quickEntry: true }),
        },
        {
          type: "separator",
        },
        {
          label: "Prompt frequency",
          submenu: frequencyOptions.map((minutes) => ({
            label: `Every ${minutes} minutes`,
            type: "radio",
            checked: settings.promptIntervalMinutes === minutes,
            click: async () => {
              try {
                await options.updateSettings({ promptIntervalMinutes: minutes });
                options.refreshScheduler();
              } catch (error) {
                console.error("[QuietQuestions] Failed to update frequency", error);
              } finally {
                refreshMenu();
              }
            },
          })),
        },
        {
          label: settings.isPaused ? "Resume prompts" : "Pause prompts",
          click: async () => {
            if (settings.isPaused) {
              await options.resumePrompts();
            } else {
              await options.pausePrompts();
            }
            refreshMenu();
          },
        },
        {
          type: "separator",
        },
        {
          label: "Quit",
          role: "quit",
          click: () => options.quit(),
        },
      ]),
    );
  };

  tray.on("click", () => {
    tray.popUpContextMenu();
  });

  await refreshMenu();
  return tray;
};

