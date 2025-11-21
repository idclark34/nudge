import { getDatabase } from "../database";
import type { AppSettings, SettingsPatch } from "../../src/types/settings";

const mapSettingsRow = (row: {
  prompt_interval_minutes: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  is_paused: number;
}) =>
  ({
    promptIntervalMinutes: row.prompt_interval_minutes,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    isPaused: Boolean(row.is_paused),
  }) satisfies AppSettings;

export const getSettings = (): AppSettings => {
  const db = getDatabase();
  const row = db
    .prepare(
      `
      SELECT prompt_interval_minutes,
             quiet_hours_start,
             quiet_hours_end,
             is_paused
      FROM settings
      WHERE id = 1;
    `,
    )
    .get() as
    | {
        prompt_interval_minutes: number;
        quiet_hours_start: string;
        quiet_hours_end: string;
        is_paused: number;
      }
    | undefined;

  if (!row) {
    throw new Error("Settings record missing");
  }

  return mapSettingsRow(row);
};

export const updateSettings = (patch: SettingsPatch): AppSettings => {
  const db = getDatabase();
  const fields: string[] = [];
  const params: Record<string, unknown> = {};

  if (patch.promptIntervalMinutes !== undefined) {
    fields.push("prompt_interval_minutes = @prompt_interval_minutes");
    params.prompt_interval_minutes = patch.promptIntervalMinutes;
  }
  if (patch.quietHoursStart !== undefined) {
    fields.push("quiet_hours_start = @quiet_hours_start");
    params.quiet_hours_start = patch.quietHoursStart;
  }
  if (patch.quietHoursEnd !== undefined) {
    fields.push("quiet_hours_end = @quiet_hours_end");
    params.quiet_hours_end = patch.quietHoursEnd;
  }
  if (patch.isPaused !== undefined) {
    fields.push("is_paused = @is_paused");
    params.is_paused = patch.isPaused ? 1 : 0;
  }

  if (fields.length) {
    db.prepare(
      `
        UPDATE settings
        SET ${fields.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `,
    ).run(params);
  }

  return getSettings();
};

export const pausePrompts = (): AppSettings =>
  updateSettings({ isPaused: true });

export const resumePrompts = (): AppSettings =>
  updateSettings({ isPaused: false });

