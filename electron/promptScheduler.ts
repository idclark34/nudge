import type { AppSettings } from "../src/types/settings";

interface PromptSchedulerOptions {
  getSettings: () => AppSettings;
  isPromptWindowOpen: () => boolean;
  openPromptWindow: () => void;
}

const minutesToMilliseconds = (minutes: number) => Math.max(minutes, 1) * 60 * 1000;

const parseTimeToMinutes = (value: string): number => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const isWithinQuietHours = (settings: AppSettings, now = new Date()): boolean => {
  const start = parseTimeToMinutes(settings.quietHoursStart);
  const end = parseTimeToMinutes(settings.quietHoursEnd);
  const current = now.getHours() * 60 + now.getMinutes();

  if (start === end) {
    return false;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  // quiet hours span overnight
  return current >= start || current < end;
};

const getMillisecondsUntilQuietEnds = (
  settings: AppSettings,
  now = new Date(),
): number => {
  const quietEnd = parseTimeToMinutes(settings.quietHoursEnd);
  const current = now.getHours() * 60 + now.getMinutes();

  let minutesUntilEnd = quietEnd - current;
  if (minutesUntilEnd <= 0) {
    minutesUntilEnd += 24 * 60;
  }

  return minutesUntilEnd * 60 * 1000;
};

export class PromptScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly options: PromptSchedulerOptions) {}

  start() {
    this.clearTimer();
    this.scheduleNext(0);
  }

  refresh() {
    this.start();
  }

  snooze(minutes: number) {
    this.clearTimer();
    this.scheduleNext(minutesToMilliseconds(minutes));
  }

  stop() {
    this.clearTimer();
  }

  private scheduleNext(delay: number) {
    this.clearTimer();
    this.timer = setTimeout(() => this.tick(), Math.max(delay, 1000));
  }

  private tick() {
    const settings = this.options.getSettings();

    if (settings.isPaused) {
      this.scheduleNext(minutesToMilliseconds(settings.promptIntervalMinutes));
      return;
    }

    if (this.options.isPromptWindowOpen()) {
      this.scheduleNext(minutesToMilliseconds(5));
      return;
    }

    if (isWithinQuietHours(settings)) {
      this.scheduleNext(getMillisecondsUntilQuietEnds(settings));
      return;
    }

    this.options.openPromptWindow();
    this.scheduleNext(minutesToMilliseconds(settings.promptIntervalMinutes));
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

