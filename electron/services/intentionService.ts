import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { getDatabase } from "../database";
import type {
  Intention,
  IntentionInput,
  IntentionCheckIn,
  IntentionCheckInInput,
  IntentionPromptContext,
} from "../../src/types/intention";

dayjs.extend(isoWeek);

interface IntentionRow {
  id: number;
  text: string;
  month: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface CheckInRow {
  id: number;
  intention_id: number;
  week: string;
  reflection: string;
  progress: string;
  created_at: string;
}

const mapIntention = (row: IntentionRow): Intention => ({
  id: Number(row.id),
  text: row.text,
  month: row.month,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCheckIn = (row: CheckInRow): IntentionCheckIn => ({
  id: Number(row.id),
  intentionId: Number(row.intention_id),
  week: row.week,
  reflection: row.reflection,
  progress: row.progress as IntentionCheckIn["progress"],
  createdAt: row.created_at,
});

const getDb = () => getDatabase();

/**
 * Get the current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => dayjs().format("YYYY-MM");

/**
 * Get the current ISO week in YYYY-Www format
 */
export const getCurrentWeek = (): string => {
  const now = dayjs();
  return `${now.isoWeekYear()}-W${String(now.isoWeek()).padStart(2, "0")}`;
};

/**
 * Create a new intention
 */
export const createIntention = (input: IntentionInput): Intention => {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(
    `INSERT INTO intentions (text, month, is_active, created_at, updated_at)
     VALUES (@text, @month, 1, @created_at, @updated_at);`,
  ).run({
    text: input.text,
    month: input.month,
    created_at: now,
    updated_at: now,
  });

  return getIntentionById(Number(result.lastInsertRowid))!;
};

/**
 * Update an existing intention text
 */
export const updateIntention = (id: number, text: string): Intention => {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`UPDATE intentions SET text = ?, updated_at = ? WHERE id = ?;`).run(text, now, id);
  return getIntentionById(id)!;
};

/**
 * Toggle intention active state
 */
export const toggleIntentionActive = (id: number, isActive: boolean): Intention => {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`UPDATE intentions SET is_active = ?, updated_at = ? WHERE id = ?;`).run(isActive ? 1 : 0, now, id);
  return getIntentionById(id)!;
};

/**
 * Delete an intention and its check-ins
 */
export const deleteIntention = (id: number): void => {
  const db = getDb();
  db.prepare("DELETE FROM intention_check_ins WHERE intention_id = ?;").run(id);
  db.prepare("DELETE FROM intentions WHERE id = ?;").run(id);
};

/**
 * Get intention by ID
 */
export const getIntentionById = (id: number): Intention | null => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM intentions WHERE id = ?;").get(id) as IntentionRow | undefined;
  return row ? mapIntention(row) : null;
};

/**
 * Get all intentions for a specific month
 */
export const getIntentionsForMonth = (month: string): Intention[] => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM intentions WHERE month = ? ORDER BY created_at ASC;")
    .all(month) as IntentionRow[];
  return rows.map(mapIntention);
};

/**
 * Get active intentions for a specific month
 */
export const getActiveIntentionsForMonth = (month: string): Intention[] => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM intentions WHERE month = ? AND is_active = 1 ORDER BY created_at ASC;")
    .all(month) as IntentionRow[];
  return rows.map(mapIntention);
};

/**
 * Get all current month's intentions
 */
export const getCurrentIntentions = (): Intention[] => {
  return getIntentionsForMonth(getCurrentMonth());
};

/**
 * Get active current month's intentions
 */
export const getActiveCurrentIntentions = (): Intention[] => {
  return getActiveIntentionsForMonth(getCurrentMonth());
};

/**
 * Legacy: Get "current intention" (first active one) - for backward compatibility
 */
export const getCurrentIntention = (): Intention | null => {
  const intentions = getActiveCurrentIntentions();
  return intentions.length > 0 ? intentions[0] : null;
};

/**
 * Legacy: setIntention - creates a new intention (backward compatible)
 */
export const setIntention = (input: IntentionInput): Intention => {
  return createIntention(input);
};

/**
 * Get all intentions (for history view)
 */
export const listIntentions = (): Intention[] => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM intentions ORDER BY month DESC, created_at ASC;")
    .all() as IntentionRow[];

  return rows.map(mapIntention);
};

/**
 * Create a check-in for an intention
 */
export const createCheckIn = (input: IntentionCheckInInput): IntentionCheckIn => {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `
      INSERT INTO intention_check_ins (intention_id, week, reflection, progress, created_at)
      VALUES (@intention_id, @week, @reflection, @progress, @created_at)
      ON CONFLICT(intention_id, week) DO UPDATE SET
        reflection = @reflection,
        progress = @progress;
    `,
    )
    .run({
      intention_id: input.intentionId,
      week: input.week,
      reflection: input.reflection,
      progress: input.progress,
      created_at: now,
    });

  return getCheckInById(Number(result.lastInsertRowid)) ?? getCheckInForWeek(input.intentionId, input.week)!;
};

/**
 * Get check-in by ID
 */
export const getCheckInById = (id: number): IntentionCheckIn | null => {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM intention_check_ins WHERE id = ?;")
    .get(id) as CheckInRow | undefined;

  return row ? mapCheckIn(row) : null;
};

/**
 * Get check-in for a specific week and intention
 */
export const getCheckInForWeek = (intentionId: number, week: string): IntentionCheckIn | null => {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM intention_check_ins WHERE intention_id = ? AND week = ?;")
    .get(intentionId, week) as CheckInRow | undefined;

  return row ? mapCheckIn(row) : null;
};

/**
 * Get all check-ins for an intention
 */
export const getCheckInsForIntention = (intentionId: number): IntentionCheckIn[] => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM intention_check_ins WHERE intention_id = ? ORDER BY week DESC;")
    .all(intentionId) as CheckInRow[];

  return rows.map(mapCheckIn);
};

/**
 * Get the latest check-in for the current intention
 */
export const getLatestCheckIn = (intentionId: number): IntentionCheckIn | null => {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM intention_check_ins WHERE intention_id = ? ORDER BY week DESC LIMIT 1;")
    .get(intentionId) as CheckInRow | undefined;

  return row ? mapCheckIn(row) : null;
};

/**
 * Determine what type of intention prompt to show (if any)
 * Returns null if no intention prompt is needed
 */
export const getIntentionPromptContext = (): IntentionPromptContext | null => {
  const currentWeek = getCurrentWeek();
  const currentIntentions = getActiveCurrentIntentions();

  // Check if it's the first week of the month (days 1-7)
  const dayOfMonth = dayjs().date();
  const isFirstWeekOfMonth = dayOfMonth <= 7;

  // No intentions set for current month and it's the first week
  if (currentIntentions.length === 0 && isFirstWeekOfMonth) {
    return {
      type: "new_intention",
      currentIntention: null,
      currentIntentions: [],
      lastCheckIn: null,
    };
  }

  // No intentions set and not first week - prompt for new intention
  if (currentIntentions.length === 0) {
    return {
      type: "new_intention",
      currentIntention: null,
      currentIntentions: [],
      lastCheckIn: null,
    };
  }

  // Find intentions that need check-ins this week
  const intentionsNeedingCheckIn: Intention[] = [];
  
  for (const intention of currentIntentions) {
    const lastCheckIn = getLatestCheckIn(intention.id);
    
    // No check-ins yet and we're past day 7
    if (!lastCheckIn && dayOfMonth > 7) {
      intentionsNeedingCheckIn.push(intention);
      continue;
    }
    
    // Check if last check-in was from a previous week
    if (lastCheckIn && lastCheckIn.week !== currentWeek) {
      const lastCheckInWeekNum = parseInt(lastCheckIn.week.split("-W")[1], 10);
      const currentWeekNum = parseInt(currentWeek.split("-W")[1], 10);
      const lastCheckInYear = parseInt(lastCheckIn.week.split("-W")[0], 10);
      const currentYear = parseInt(currentWeek.split("-W")[0], 10);

      if (lastCheckInYear < currentYear || currentWeekNum > lastCheckInWeekNum) {
        intentionsNeedingCheckIn.push(intention);
      }
    }
  }

  if (intentionsNeedingCheckIn.length > 0) {
    const firstIntention = intentionsNeedingCheckIn[0];
    return {
      type: "check_in",
      currentIntention: firstIntention,
      currentIntentions,
      lastCheckIn: getLatestCheckIn(firstIntention.id),
      intentionsNeedingCheckIn,
    };
  }

  return null;
};

/**
 * Check if we should show an intention prompt based on how recently we last asked
 * This prevents overwhelming the user with intention prompts
 */
export const shouldShowIntentionPrompt = (): boolean => {
  const db = getDb();
  const currentMonth = getCurrentMonth();
  
  // Check last intention prompt time (stored in settings or a separate tracking table)
  // For simplicity, we'll check based on intention existence and check-in state
  const context = getIntentionPromptContext();
  
  return context !== null;
};

