export const PROMPT_INTERVAL_END_OF_DAY = -1;

export interface AppSettings {
  promptIntervalMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  isPaused: boolean;
}

export type SettingsPatch = Partial<AppSettings>;

