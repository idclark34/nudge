export interface AppSettings {
  promptIntervalMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  isPaused: boolean;
}

export type SettingsPatch = Partial<AppSettings>;

