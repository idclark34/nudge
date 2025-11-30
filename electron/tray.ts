import { Menu, Tray, nativeImage, BrowserWindow } from "electron";
import type { AppSettings, SettingsPatch } from "../src/types/settings";
import { PROMPT_INTERVAL_END_OF_DAY } from "../src/types/settings";

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
  const frequencyOptions = [
    { value: 10, label: "Every 10 minutes (testing)" },
    { value: 30, label: "Every 30 minutes" },
    { value: 60, label: "Every 60 minutes" },
    { value: 90, label: "Every 90 minutes" },
    { value: 120, label: "Every 2 hours" },
    {
      value: PROMPT_INTERVAL_END_OF_DAY,
      label: "End of day (9:00 PM)",
    },
  ];
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
          submenu: frequencyOptions.map((option) => ({
            label: option.label,
            type: "radio",
            checked: settings.promptIntervalMinutes === option.value,
            click: async () => {
              try {
                await options.updateSettings({
                  promptIntervalMinutes: option.value,
                });
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

