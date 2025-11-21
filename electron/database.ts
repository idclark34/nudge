import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import type { EntryCategory } from "../src/types/journal";

export interface JournalEntryRecord {
  id: number;
  created_at: string;
  prompt_id: number | null;
  prompt_text: string | null;
  category: EntryCategory;
  project_tag: string | null;
  trait_tag: string | null;
  text: string;
  sentiment: string | null;
  meta: string | null;
}

export interface SettingsRecord {
  id: number;
  prompt_interval_minutes: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  is_paused: number;
  updated_at: string;
}

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  const userDataPath = app.getPath("userData");
  const dbDirectory = path.join(userDataPath, "storage");
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }

  const dbPath = path.join(dbDirectory, "quiet-questions.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);
  seedStaticData(db);

  return db;
};

const runMigrations = (database: Database.Database) => {
  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS prompt_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `,
    )
    .run();

  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        requires_project INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES prompt_categories(id)
      );
    `,
    )
    .run();

  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        prompt_id INTEGER,
        prompt_text TEXT,
        category TEXT NOT NULL,
        project_tag TEXT,
        trait_tag TEXT,
        text TEXT NOT NULL,
        sentiment TEXT,
        meta TEXT,
        FOREIGN KEY (prompt_id) REFERENCES prompts(id)
      );
    `,
    )
    .run();

  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
    )
    .run();

  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS traits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
    )
    .run();

  database
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        prompt_interval_minutes INTEGER NOT NULL,
        quiet_hours_start TEXT NOT NULL,
        quiet_hours_end TEXT NOT NULL,
        is_paused INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `,
    )
    .run();
};

const seedStaticData = (database: Database.Database) => {
  const existingSettings = database
    .prepare("SELECT COUNT(*) as count FROM settings WHERE id = 1;")
    .get() as { count: number };
  if (!existingSettings.count) {
    database
      .prepare(
        `
        INSERT INTO settings (id, prompt_interval_minutes, quiet_hours_start, quiet_hours_end, is_paused, updated_at)
        VALUES (1, 90, '22:00', '07:00', 0, CURRENT_TIMESTAMP);
      `,
      )
      .run();
  }

  const categories: EntryCategory[] = [
    "project",
    "emotion",
    "trait",
    "productivity",
    "identity",
    "small_win",
    "behavior",
  ];

  const insertCategory = database.prepare(
    "INSERT OR IGNORE INTO prompt_categories (name) VALUES (?);",
  );
  categories.forEach((categoryName) => insertCategory.run(categoryName));

  const promptsSeed: Array<{
    text: string;
    category: EntryCategory;
    requiresProject?: boolean;
  }> = [
    {
      text: "How has the [PROJECT] project been coming today?",
      category: "project",
      requiresProject: true,
    },
    {
      text: "What progress did you make today on [PROJECT]?",
      category: "project",
      requiresProject: true,
    },
    {
      text: "What emotion kept showing up for you today?",
      category: "emotion",
    },
    {
      text: "What feeling surprised you today?",
      category: "emotion",
    },
    {
      text: "How did you practice resilience today?",
      category: "trait",
    },
    {
      text: "Where did you show curiosity today?",
      category: "trait",
    },
    {
      text: "What is one meaningful thing you completed recently?",
      category: "productivity",
    },
    {
      text: "What small task could you do next to build momentum?",
      category: "productivity",
    },
    {
      text: "If your future self saw you right now, what would they say?",
      category: "identity",
    },
    {
      text: "What’s one tiny win from today?",
      category: "small_win",
    },
    {
      text: "What action are you avoiding that would actually help?",
      category: "behavior",
    },
    {
      text: "What's blocking your focus right now?",
      category: "behavior",
    },
  ];

  const insertPrompt = database.prepare(
    `
      INSERT OR IGNORE INTO prompts (text, category_id, is_active, requires_project)
      VALUES (
        @text,
        (SELECT id FROM prompt_categories WHERE name = @category),
        1,
        @requires_project
      );
    `,
  );

  const existingPrompts = new Set<string>();
  const promptRows = database
    .prepare("SELECT text FROM prompts;")
    .all() as Array<{ text: string }>;
  promptRows.forEach((row) => existingPrompts.add(row.text));

  promptsSeed.forEach((prompt) => {
    if (!existingPrompts.has(prompt.text)) {
      insertPrompt.run({
        text: prompt.text,
        category: prompt.category,
        requires_project: prompt.requiresProject ? 1 : 0,
      });
    }
  });
};

