import type { AppSettings } from "../src/types/settings";
import { PROMPT_INTERVAL_END_OF_DAY } from "../src/types/settings";

interface PromptSchedulerOptions {
  getSettings: () => AppSettings;
  isPromptWindowOpen: () => boolean;
  openPromptWindow: () => void;
}

const minutesToMilliseconds = (minutes: number) =>
  Math.max(minutes, 1) * 60 * 1000;

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

const DEFAULT_END_OF_DAY_MINUTES = 21 * 60; // 9:00 PM local time
const MIN_END_OF_DAY_MINUTES = 12 * 60; // Never schedule earlier than noon
const PRE_QUIET_BUFFER_MINUTES = 5;

const resolveEndOfDayMinutes = (settings: AppSettings): number => {
  const quietStart = parseTimeToMinutes(settings.quietHoursStart);
  const quietEnd = parseTimeToMinutes(settings.quietHoursEnd);

  if (quietStart === quietEnd) {
    return DEFAULT_END_OF_DAY_MINUTES;
  }

  if (quietStart <= DEFAULT_END_OF_DAY_MINUTES) {
    const target = Math.max(
      quietStart - PRE_QUIET_BUFFER_MINUTES,
      MIN_END_OF_DAY_MINUTES,
    );
    return target;
  }

  return DEFAULT_END_OF_DAY_MINUTES;
};

const SETTLE_DELAY_MINUTES = 10;
const SETTLE_DELAY_MS = SETTLE_DELAY_MINUTES * 60 * 1000;

const setTimeForDay = (base: Date, minutes: number) => {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export class PromptScheduler {
  private timer: NodeJS.Timeout | null = null;
  private lastEndOfDayPromptDate: string | null = null;
  private endOfDaySettleUntil: Date | null = null;

  constructor(private readonly options: PromptSchedulerOptions) {}

  start() {
    this.clearTimer();
    const settings = this.options.getSettings();
    if (settings.promptIntervalMinutes === PROMPT_INTERVAL_END_OF_DAY) {
      this.scheduleNext(this.computeEndOfDayDelay(settings));
      return;
    }
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
    const now = new Date();
    const isEndOfDay =
      settings.promptIntervalMinutes === PROMPT_INTERVAL_END_OF_DAY;

    if (isEndOfDay) {
      const delay = this.computeEndOfDayDelay(settings, now);
      if (delay > 0) {
        this.scheduleNext(delay);
        return;
      }
    }

    if (settings.isPaused) {
      this.scheduleNext(
        isEndOfDay
          ? this.computeEndOfDayDelay(settings, now)
          : minutesToMilliseconds(settings.promptIntervalMinutes),
      );
      return;
    }

    if (this.options.isPromptWindowOpen()) {
      this.scheduleNext(minutesToMilliseconds(5));
      return;
    }

    if (isWithinQuietHours(settings)) {
      this.scheduleNext(
        isEndOfDay
          ? this.computeEndOfDayDelay(settings, now)
          : getMillisecondsUntilQuietEnds(settings),
      );
      return;
    }

    this.options.openPromptWindow();
    if (isEndOfDay) {
      this.lastEndOfDayPromptDate = toDateKey(now);
      this.endOfDaySettleUntil = null;
    }
    this.scheduleNext(
      isEndOfDay
        ? this.computeEndOfDayDelay(settings, now)
        : minutesToMilliseconds(settings.promptIntervalMinutes),
    );
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private computeEndOfDayDelay(
    settings: AppSettings,
    now = new Date(),
  ): number {
    const targetMinutes = resolveEndOfDayMinutes(settings);
    const todayKey = toDateKey(now);

    const scheduleForNextDay = () => {
      this.endOfDaySettleUntil = null;
      const nextTarget = setTimeForDay(addDays(now, 1), targetMinutes);
      return nextTarget.getTime() - now.getTime();
    };

    if (this.lastEndOfDayPromptDate === todayKey) {
      return scheduleForNextDay();
    }

    if (isWithinQuietHours(settings, now)) {
      return scheduleForNextDay();
    }

    const targetToday = setTimeForDay(now, targetMinutes);

    if (now < targetToday) {
      this.endOfDaySettleUntil = new Date(targetToday.getTime() + SETTLE_DELAY_MS);
      return targetToday.getTime() - now.getTime();
    }

    if (!this.endOfDaySettleUntil || now >= this.endOfDaySettleUntil) {
      this.endOfDaySettleUntil = new Date(now.getTime() + SETTLE_DELAY_MS);
    }

    if (now < this.endOfDaySettleUntil) {
      return this.endOfDaySettleUntil.getTime() - now.getTime();
    }

    this.endOfDaySettleUntil = null;
    return 0;
  }
}

