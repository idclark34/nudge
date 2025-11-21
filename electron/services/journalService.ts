import type Database from "better-sqlite3";
import dayjs from "dayjs";
import { getDatabase } from "../database";
import type {
  JournalEntry,
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
} from "../../src/types/journal";

const entryFields = [
  "id",
  "created_at",
  "prompt_id",
  "prompt_text",
  "category",
  "project_tag",
  "trait_tag",
  "text",
  "sentiment",
  "meta",
] as const;

type EntryRow = Record<(typeof entryFields)[number], unknown>;

const mapEntry = (row: EntryRow): JournalEntry => ({
  id: Number(row.id),
  createdAt: String(row.created_at),
  promptId: row.prompt_id !== null ? Number(row.prompt_id) : null,
  promptText: row.prompt_text !== null ? String(row.prompt_text) : null,
  category: row.category as JournalEntry["category"],
  projectTag: row.project_tag !== null ? String(row.project_tag) : null,
  traitTag: row.trait_tag !== null ? String(row.trait_tag) : null,
  text: String(row.text ?? ""),
  sentiment: row.sentiment !== null ? String(row.sentiment) : null,
  meta:
    typeof row.meta === "string" && row.meta.length
      ? (JSON.parse(String(row.meta)) as Record<string, unknown>)
      : null,
});

const getDb = (): Database.Database => getDatabase();

export const createEntry = (input: JournalEntryInput): JournalEntry => {
  const db = getDb();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const result = db
    .prepare(
      `
      INSERT INTO journal_entries (
        created_at,
        prompt_id,
        prompt_text,
        category,
        project_tag,
        trait_tag,
        text,
        sentiment,
        meta
      ) VALUES (
        @created_at,
        @prompt_id,
        @prompt_text,
        @category,
        @project_tag,
        @trait_tag,
        @text,
        @sentiment,
        @meta
      );
    `,
    )
    .run({
      created_at: createdAt,
      prompt_id: input.promptId ?? null,
      prompt_text: input.promptText ?? null,
      category: input.category,
      project_tag: input.projectTag ?? null,
      trait_tag: input.traitTag ?? null,
      text: input.text,
      sentiment: input.sentiment ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    });

  return getEntryById(Number(result.lastInsertRowid));
};

export const getEntryById = (id: number): JournalEntry => {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT ${entryFields.join(", ")}
      FROM journal_entries
      WHERE id = ?;
    `,
    )
    .get(id) as EntryRow | undefined;

  if (!row) {
    throw new Error(`Entry ${id} not found`);
  }

  return mapEntry(row);
};

export const getEntries = (
  filters: JournalEntryFilters,
): { entries: JournalEntry[]; total: number } => {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.fromDate) {
    where.push("datetime(created_at) >= datetime(@fromDate)");
    params.fromDate = filters.fromDate;
  }
  if (filters.toDate) {
    where.push("datetime(created_at) <= datetime(@toDate)");
    params.toDate = filters.toDate;
  }
  if (filters.category) {
    where.push("category = @category");
    params.category = filters.category;
  }
  if (filters.projectTag) {
    where.push("project_tag = @projectTag");
    params.projectTag = filters.projectTag;
  }
  if (filters.traitTag) {
    where.push("trait_tag = @traitTag");
    params.traitTag = filters.traitTag;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Number(filters.limit ?? 50);
  const offset = Number(filters.offset ?? 0);

  const rows = db
    .prepare(
      `
      SELECT ${entryFields.join(", ")}
      FROM journal_entries
      ${whereClause}
      ORDER BY datetime(created_at) DESC
      LIMIT @limit OFFSET @offset;
    `,
    )
    .all({ ...params, limit, offset }) as EntryRow[];

  const totalRow = db
    .prepare(
      `
      SELECT COUNT(*) as total
      FROM journal_entries
      ${whereClause};
    `,
    )
    .get(params) as { total: number };

  return {
    entries: rows.map(mapEntry),
    total: totalRow?.total ?? 0,
  };
};

export const updateEntry = (
  id: number,
  patch: JournalEntryPatch,
): JournalEntry => {
  const db = getDb();
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };

  if (patch.promptId !== undefined) {
    fields.push("prompt_id = @prompt_id");
    params.prompt_id = patch.promptId;
  }
  if (patch.promptText !== undefined) {
    fields.push("prompt_text = @prompt_text");
    params.prompt_text = patch.promptText;
  }
  if (patch.category !== undefined) {
    fields.push("category = @category");
    params.category = patch.category;
  }
  if (patch.projectTag !== undefined) {
    fields.push("project_tag = @project_tag");
    params.project_tag = patch.projectTag;
  }
  if (patch.traitTag !== undefined) {
    fields.push("trait_tag = @trait_tag");
    params.trait_tag = patch.traitTag;
  }
  if (patch.text !== undefined) {
    fields.push("text = @text");
    params.text = patch.text;
  }
  if (patch.sentiment !== undefined) {
    fields.push("sentiment = @sentiment");
    params.sentiment = patch.sentiment;
  }
  if (patch.meta !== undefined) {
    fields.push("meta = @meta");
    params.meta = patch.meta ? JSON.stringify(patch.meta) : null;
  }
  if (patch.createdAt !== undefined) {
    fields.push("created_at = @created_at");
    params.created_at = patch.createdAt;
  }

  if (!fields.length) {
    return getEntryById(id);
  }

  db.prepare(
    `
      UPDATE journal_entries
      SET ${fields.join(", ")}
      WHERE id = @id;
    `,
  ).run(params);

  return getEntryById(id);
};

export const deleteEntry = (id: number): void => {
  const db = getDb();
  db.prepare("DELETE FROM journal_entries WHERE id = ?;").run(id);
};

export const getRecentCategories = (limit = 10): Array<JournalEntry["category"]> => {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT category
      FROM journal_entries
      ORDER BY datetime(created_at) DESC
      LIMIT ?;
    `,
    )
    .all(limit) as Array<{ category: JournalEntry["category"] }>;

  return rows.map((row) => row.category);
};

export const getRecentProjectTags = (limit = 10): string[] => {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT project_tag as projectTag
      FROM journal_entries
      WHERE project_tag IS NOT NULL AND project_tag != ''
      ORDER BY datetime(created_at) DESC
      LIMIT ?;
    `,
    )
    .all(limit) as Array<{ projectTag: string }>;

  return rows.map((row) => row.projectTag);
};

export const getStatsSnapshot = () => {
  const db = getDb();
  const startOfWeek = dayjs().startOf("week").toISOString();

  const total = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE datetime(created_at) >= datetime(?);
    `,
    )
    .get(startOfWeek) as { count: number };

  const categoryCounts = db
    .prepare(
      `
      SELECT category, COUNT(*) as count
      FROM journal_entries
      GROUP BY category
      ORDER BY count DESC;
    `,
    )
    .all() as Array<{ category: JournalEntry["category"]; count: number }>;

  const projectCounts = db
    .prepare(
      `
      SELECT project_tag as projectTag, COUNT(*) as count
      FROM journal_entries
      WHERE project_tag IS NOT NULL AND project_tag != ''
      GROUP BY project_tag
      ORDER BY count DESC
      LIMIT 5;
    `,
    )
    .all() as Array<{ projectTag: string; count: number }>;

  const traitCounts = db
    .prepare(
      `
      SELECT trait_tag as traitTag, COUNT(*) as count
      FROM journal_entries
      WHERE trait_tag IS NOT NULL AND trait_tag != ''
      GROUP BY trait_tag
      ORDER BY count DESC
      LIMIT 5;
    `,
    )
    .all() as Array<{ traitTag: string; count: number }>;

  return {
    totalThisWeek: total?.count ?? 0,
    categoryCounts,
    projectCounts,
    traitCounts,
  };
};

