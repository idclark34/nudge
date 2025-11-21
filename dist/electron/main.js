"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_node_path2 = __toESM(require("path"));
var import_electron6 = require("electron");

// electron/database.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_electron = require("electron");
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var db = null;
var getDatabase = () => {
  if (db) {
    return db;
  }
  const userDataPath = import_electron.app.getPath("userData");
  const dbDirectory = import_node_path.default.join(userDataPath, "storage");
  if (!import_node_fs.default.existsSync(dbDirectory)) {
    import_node_fs.default.mkdirSync(dbDirectory, { recursive: true });
  }
  const dbPath = import_node_path.default.join(dbDirectory, "quiet-questions.db");
  db = new import_better_sqlite3.default(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  seedStaticData(db);
  return db;
};
var runMigrations = (database) => {
  database.prepare(
    `
      CREATE TABLE IF NOT EXISTS prompt_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `
  ).run();
  database.prepare(
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
    `
  ).run();
  database.prepare(
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
    `
  ).run();
  database.prepare(
    `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
  ).run();
  database.prepare(
    `
      CREATE TABLE IF NOT EXISTS traits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
  ).run();
  database.prepare(
    `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        prompt_interval_minutes INTEGER NOT NULL,
        quiet_hours_start TEXT NOT NULL,
        quiet_hours_end TEXT NOT NULL,
        is_paused INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `
  ).run();
};
var seedStaticData = (database) => {
  const existingSettings = database.prepare("SELECT COUNT(*) as count FROM settings WHERE id = 1;").get();
  if (!existingSettings.count) {
    database.prepare(
      `
        INSERT INTO settings (id, prompt_interval_minutes, quiet_hours_start, quiet_hours_end, is_paused, updated_at)
        VALUES (1, 90, '22:00', '07:00', 0, CURRENT_TIMESTAMP);
      `
    ).run();
  }
  const categories = [
    "project",
    "emotion",
    "trait",
    "productivity",
    "identity",
    "small_win",
    "behavior"
  ];
  const insertCategory = database.prepare(
    "INSERT OR IGNORE INTO prompt_categories (name) VALUES (?);"
  );
  categories.forEach((categoryName) => insertCategory.run(categoryName));
  const promptsSeed = [
    {
      text: "How has the [PROJECT] project been coming today?",
      category: "project",
      requiresProject: true
    },
    {
      text: "What progress did you make today on [PROJECT]?",
      category: "project",
      requiresProject: true
    },
    {
      text: "What emotion kept showing up for you today?",
      category: "emotion"
    },
    {
      text: "What feeling surprised you today?",
      category: "emotion"
    },
    {
      text: "How did you practice resilience today?",
      category: "trait"
    },
    {
      text: "Where did you show curiosity today?",
      category: "trait"
    },
    {
      text: "What is one meaningful thing you completed recently?",
      category: "productivity"
    },
    {
      text: "What small task could you do next to build momentum?",
      category: "productivity"
    },
    {
      text: "If your future self saw you right now, what would they say?",
      category: "identity"
    },
    {
      text: "What\u2019s one tiny win from today?",
      category: "small_win"
    },
    {
      text: "What action are you avoiding that would actually help?",
      category: "behavior"
    },
    {
      text: "What's blocking your focus right now?",
      category: "behavior"
    }
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
    `
  );
  const existingPrompts = /* @__PURE__ */ new Set();
  const promptRows = database.prepare("SELECT text FROM prompts;").all();
  promptRows.forEach((row) => existingPrompts.add(row.text));
  promptsSeed.forEach((prompt) => {
    if (!existingPrompts.has(prompt.text)) {
      insertPrompt.run({
        text: prompt.text,
        category: prompt.category,
        requires_project: prompt.requiresProject ? 1 : 0
      });
    }
  });
};

// electron/windows/mainWindow.ts
var import_electron2 = require("electron");
var createMainWindow = ({
  preloadPath,
  rendererUrl
}) => {
  const window = new import_electron2.BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    title: "Quiet Questions",
    backgroundColor: "#fdfbf5",
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 16 },
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false
    }
  });
  window.once("ready-to-show", () => {
    if (!window.isDestroyed()) {
      window.show();
    }
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    import_electron2.shell.openExternal(url);
    return { action: "deny" };
  });
  const targetUrl = rendererUrl.endsWith("/") ? `${rendererUrl}#/` : `${rendererUrl}/#/`;
  window.loadURL(targetUrl);
  return window;
};

// electron/windows/promptWindow.ts
var import_electron3 = require("electron");
var createPromptWindow = ({
  preloadPath,
  rendererUrl,
  quickEntry
}) => {
  const window = new import_electron3.BrowserWindow({
    width: 420,
    height: 360,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    show: false,
    frame: false,
    title: quickEntry ? "Quiet Questions \u2014 Quick Entry" : "Quiet Questions",
    backgroundColor: "#fdfbf5",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true
    }
  });
  window.once("ready-to-show", () => window.show());
  const urlBase = rendererUrl.endsWith("/") ? `${rendererUrl}#/prompt` : `${rendererUrl}/#/prompt`;
  const url = quickEntry ? `${urlBase}?quick=1` : urlBase;
  window.loadURL(url);
  return window;
};

// electron/ipc/registerHandlers.ts
var import_electron4 = require("electron");

// electron/services/journalService.ts
var import_dayjs = __toESM(require("dayjs"));
var entryFields = [
  "id",
  "created_at",
  "prompt_id",
  "prompt_text",
  "category",
  "project_tag",
  "trait_tag",
  "text",
  "sentiment",
  "meta"
];
var mapEntry = (row) => ({
  id: Number(row.id),
  createdAt: String(row.created_at),
  promptId: row.prompt_id !== null ? Number(row.prompt_id) : null,
  promptText: row.prompt_text !== null ? String(row.prompt_text) : null,
  category: row.category,
  projectTag: row.project_tag !== null ? String(row.project_tag) : null,
  traitTag: row.trait_tag !== null ? String(row.trait_tag) : null,
  text: String(row.text ?? ""),
  sentiment: row.sentiment !== null ? String(row.sentiment) : null,
  meta: typeof row.meta === "string" && row.meta.length ? JSON.parse(String(row.meta)) : null
});
var getDb = () => getDatabase();
var createEntry = (input) => {
  const db2 = getDb();
  const createdAt = input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const result = db2.prepare(
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
    `
  ).run({
    created_at: createdAt,
    prompt_id: input.promptId ?? null,
    prompt_text: input.promptText ?? null,
    category: input.category,
    project_tag: input.projectTag ?? null,
    trait_tag: input.traitTag ?? null,
    text: input.text,
    sentiment: input.sentiment ?? null,
    meta: input.meta ? JSON.stringify(input.meta) : null
  });
  return getEntryById(Number(result.lastInsertRowid));
};
var getEntryById = (id) => {
  const db2 = getDb();
  const row = db2.prepare(
    `
      SELECT ${entryFields.join(", ")}
      FROM journal_entries
      WHERE id = ?;
    `
  ).get(id);
  if (!row) {
    throw new Error(`Entry ${id} not found`);
  }
  return mapEntry(row);
};
var getEntries = (filters) => {
  const db2 = getDb();
  const where = [];
  const params = {};
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
  const rows = db2.prepare(
    `
      SELECT ${entryFields.join(", ")}
      FROM journal_entries
      ${whereClause}
      ORDER BY datetime(created_at) DESC
      LIMIT @limit OFFSET @offset;
    `
  ).all({ ...params, limit, offset });
  const totalRow = db2.prepare(
    `
      SELECT COUNT(*) as total
      FROM journal_entries
      ${whereClause};
    `
  ).get(params);
  return {
    entries: rows.map(mapEntry),
    total: totalRow?.total ?? 0
  };
};
var updateEntry = (id, patch) => {
  const db2 = getDb();
  const fields = [];
  const params = { id };
  if (patch.promptId !== void 0) {
    fields.push("prompt_id = @prompt_id");
    params.prompt_id = patch.promptId;
  }
  if (patch.promptText !== void 0) {
    fields.push("prompt_text = @prompt_text");
    params.prompt_text = patch.promptText;
  }
  if (patch.category !== void 0) {
    fields.push("category = @category");
    params.category = patch.category;
  }
  if (patch.projectTag !== void 0) {
    fields.push("project_tag = @project_tag");
    params.project_tag = patch.projectTag;
  }
  if (patch.traitTag !== void 0) {
    fields.push("trait_tag = @trait_tag");
    params.trait_tag = patch.traitTag;
  }
  if (patch.text !== void 0) {
    fields.push("text = @text");
    params.text = patch.text;
  }
  if (patch.sentiment !== void 0) {
    fields.push("sentiment = @sentiment");
    params.sentiment = patch.sentiment;
  }
  if (patch.meta !== void 0) {
    fields.push("meta = @meta");
    params.meta = patch.meta ? JSON.stringify(patch.meta) : null;
  }
  if (patch.createdAt !== void 0) {
    fields.push("created_at = @created_at");
    params.created_at = patch.createdAt;
  }
  if (!fields.length) {
    return getEntryById(id);
  }
  db2.prepare(
    `
      UPDATE journal_entries
      SET ${fields.join(", ")}
      WHERE id = @id;
    `
  ).run(params);
  return getEntryById(id);
};
var deleteEntry = (id) => {
  const db2 = getDb();
  db2.prepare("DELETE FROM journal_entries WHERE id = ?;").run(id);
};
var getRecentCategories = (limit = 10) => {
  const db2 = getDb();
  const rows = db2.prepare(
    `
      SELECT category
      FROM journal_entries
      ORDER BY datetime(created_at) DESC
      LIMIT ?;
    `
  ).all(limit);
  return rows.map((row) => row.category);
};
var getRecentProjectTags = (limit = 10) => {
  const db2 = getDb();
  const rows = db2.prepare(
    `
      SELECT project_tag as projectTag
      FROM journal_entries
      WHERE project_tag IS NOT NULL AND project_tag != ''
      ORDER BY datetime(created_at) DESC
      LIMIT ?;
    `
  ).all(limit);
  return rows.map((row) => row.projectTag);
};
var getStatsSnapshot = () => {
  const db2 = getDb();
  const startOfWeek = (0, import_dayjs.default)().startOf("week").toISOString();
  const total = db2.prepare(
    `
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE datetime(created_at) >= datetime(?);
    `
  ).get(startOfWeek);
  const categoryCounts = db2.prepare(
    `
      SELECT category, COUNT(*) as count
      FROM journal_entries
      GROUP BY category
      ORDER BY count DESC;
    `
  ).all();
  const projectCounts = db2.prepare(
    `
      SELECT project_tag as projectTag, COUNT(*) as count
      FROM journal_entries
      WHERE project_tag IS NOT NULL AND project_tag != ''
      GROUP BY project_tag
      ORDER BY count DESC
      LIMIT 5;
    `
  ).all();
  const traitCounts = db2.prepare(
    `
      SELECT trait_tag as traitTag, COUNT(*) as count
      FROM journal_entries
      WHERE trait_tag IS NOT NULL AND trait_tag != ''
      GROUP BY trait_tag
      ORDER BY count DESC
      LIMIT 5;
    `
  ).all();
  return {
    totalThisWeek: total?.count ?? 0,
    categoryCounts,
    projectCounts,
    traitCounts
  };
};

// electron/services/projectsService.ts
var mapProject = (row) => ({
  id: Number(row.id),
  name: row.name,
  createdAt: row.created_at
});
var listProjects = () => {
  const db2 = getDatabase();
  const rows = db2.prepare(
    `
      SELECT id, name, created_at
      FROM projects
      ORDER BY name ASC;
    `
  ).all();
  return rows.map(mapProject);
};
var createProject = (name) => {
  const db2 = getDatabase();
  const result = db2.prepare(
    `
      INSERT INTO projects (name)
      VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name
      RETURNING id, name, created_at;
    `
  ).get(name);
  return mapProject(result);
};
var updateProject = (id, name) => {
  const db2 = getDatabase();
  db2.prepare("UPDATE projects SET name = ? WHERE id = ?;").run(name, id);
  const row = db2.prepare(
    `
      SELECT id, name, created_at
      FROM projects
      WHERE id = ?;
    `
  ).get(id);
  if (!row) {
    throw new Error(`Project ${id} not found`);
  }
  return mapProject(row);
};
var deleteProject = (id) => {
  const db2 = getDatabase();
  db2.prepare("DELETE FROM projects WHERE id = ?;").run(id);
};

// electron/services/promptService.ts
var mapPrompt = (row) => ({
  id: Number(row.id),
  text: row.text,
  categoryId: Number(row.category_id),
  category: row.category,
  isActive: Boolean(row.is_active),
  requiresProject: Boolean(row.requires_project)
});
var timeCategoryPreferences = {
  morning: ["identity", "productivity", "behavior", "project"],
  afternoon: ["project", "productivity", "trait"],
  evening: ["emotion", "trait", "small_win"],
  night: ["emotion", "identity", "small_win"]
};
var getTimeOfDay = (date = /* @__PURE__ */ new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};
var pickCategoryOrder = (context, availableCategories) => {
  const history = new Set(context.recentCategoryHistory.slice(0, 3));
  const preference = timeCategoryPreferences[context.timeOfDay];
  const combined = [
    ...preference,
    ...context.activeProjectTags.length ? ["project"] : [],
    ...availableCategories
  ];
  const unique = Array.from(new Set(combined)).filter(
    (category) => availableCategories.includes(category)
  );
  const prioritized = unique.filter((category) => !history.has(category));
  return prioritized.length ? prioritized : unique;
};
var selectPrompt = (context) => {
  const db2 = getDatabase();
  const rows = db2.prepare(
    `
      SELECT p.id,
             p.text,
             p.category_id,
             c.name AS category,
             p.is_active,
             p.requires_project
      FROM prompts p
      JOIN prompt_categories c ON c.id = p.category_id
      WHERE p.is_active = 1;
    `
  ).all();
  if (!rows.length) {
    return null;
  }
  const prompts = rows.map(mapPrompt);
  const categories = Array.from(
    new Set(prompts.map((prompt) => prompt.category))
  );
  const fallbackRecentCategories = getRecentCategories(5);
  const fallbackProjects = listProjects().map((project) => project.name);
  const recentProjectTags = getRecentProjectTags(5).concat(fallbackProjects).filter(Boolean);
  const resolvedContext = {
    timeOfDay: context?.timeOfDay ?? getTimeOfDay(),
    recentCategoryHistory: context?.recentCategoryHistory?.length ? context.recentCategoryHistory : fallbackRecentCategories,
    activeProjectTags: context?.activeProjectTags?.length ? context.activeProjectTags : Array.from(new Set(recentProjectTags))
  };
  const categoryOrder = pickCategoryOrder(resolvedContext, categories);
  for (const category of categoryOrder) {
    const categoryPrompts = prompts.filter(
      (prompt2) => prompt2.category === category
    );
    if (!categoryPrompts.length) continue;
    const prompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    let projectTagSuggestion = null;
    if (prompt.requiresProject && resolvedContext.activeProjectTags.length) {
      projectTagSuggestion = resolvedContext.activeProjectTags[Math.floor(Math.random() * resolvedContext.activeProjectTags.length)];
    }
    return {
      prompt,
      projectTagSuggestion
    };
  }
  return {
    prompt: prompts[Math.floor(Math.random() * prompts.length)],
    projectTagSuggestion: resolvedContext.activeProjectTags[0] ?? null
  };
};
var markPromptHandled = () => {
};

// electron/services/settingsService.ts
var mapSettingsRow = (row) => ({
  promptIntervalMinutes: row.prompt_interval_minutes,
  quietHoursStart: row.quiet_hours_start,
  quietHoursEnd: row.quiet_hours_end,
  isPaused: Boolean(row.is_paused)
});
var getSettings = () => {
  const db2 = getDatabase();
  const row = db2.prepare(
    `
      SELECT prompt_interval_minutes,
             quiet_hours_start,
             quiet_hours_end,
             is_paused
      FROM settings
      WHERE id = 1;
    `
  ).get();
  if (!row) {
    throw new Error("Settings record missing");
  }
  return mapSettingsRow(row);
};
var updateSettings = (patch) => {
  const db2 = getDatabase();
  const fields = [];
  const params = {};
  if (patch.promptIntervalMinutes !== void 0) {
    fields.push("prompt_interval_minutes = @prompt_interval_minutes");
    params.prompt_interval_minutes = patch.promptIntervalMinutes;
  }
  if (patch.quietHoursStart !== void 0) {
    fields.push("quiet_hours_start = @quiet_hours_start");
    params.quiet_hours_start = patch.quietHoursStart;
  }
  if (patch.quietHoursEnd !== void 0) {
    fields.push("quiet_hours_end = @quiet_hours_end");
    params.quiet_hours_end = patch.quietHoursEnd;
  }
  if (patch.isPaused !== void 0) {
    fields.push("is_paused = @is_paused");
    params.is_paused = patch.isPaused ? 1 : 0;
  }
  if (fields.length) {
    db2.prepare(
      `
        UPDATE settings
        SET ${fields.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `
    ).run(params);
  }
  return getSettings();
};
var pausePrompts = () => updateSettings({ isPaused: true });
var resumePrompts = () => updateSettings({ isPaused: false });

// electron/services/traitsService.ts
var mapTrait = (row) => ({
  id: Number(row.id),
  name: row.name,
  createdAt: row.created_at
});
var listTraits = () => {
  const db2 = getDatabase();
  const rows = db2.prepare(
    `
      SELECT id, name, created_at
      FROM traits
      ORDER BY name ASC;
    `
  ).all();
  return rows.map(mapTrait);
};
var createTrait = (name) => {
  const db2 = getDatabase();
  const row = db2.prepare(
    `
      INSERT INTO traits (name)
      VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name
      RETURNING id, name, created_at;
    `
  ).get(name);
  return mapTrait(row);
};
var updateTrait = (id, name) => {
  const db2 = getDatabase();
  db2.prepare("UPDATE traits SET name = ? WHERE id = ?;").run(name, id);
  const row = db2.prepare(
    `
      SELECT id, name, created_at
      FROM traits
      WHERE id = ?;
    `
  ).get(id);
  if (!row) {
    throw new Error(`Trait ${id} not found`);
  }
  return mapTrait(row);
};
var deleteTrait = (id) => {
  const db2 = getDatabase();
  db2.prepare("DELETE FROM traits WHERE id = ?;").run(id);
};

// electron/services/statsService.ts
var buildInsightsSummary = () => {
  const snapshot = getStatsSnapshot();
  const mostFrequentCategory = snapshot.categoryCounts[0]?.category ?? null;
  const mostActiveProject = snapshot.projectCounts[0]?.projectTag ?? null;
  const mostActiveTrait = snapshot.traitCounts[0]?.traitTag ?? null;
  return {
    totalThisWeek: snapshot.totalThisWeek,
    entriesByCategory: snapshot.categoryCounts.map((row) => ({
      category: row.category,
      count: row.count
    })),
    topProjects: snapshot.projectCounts,
    topTraits: snapshot.traitCounts,
    mostFrequentCategory,
    mostActiveProject,
    mostActiveTrait
  };
};

// electron/ipc/registerHandlers.ts
var registerIpcHandlers = (ctx) => {
  import_electron4.ipcMain.handle(
    "entries:create",
    async (_event, payload) => createEntry(payload)
  );
  import_electron4.ipcMain.handle(
    "entries:get",
    async (_event, filters) => getEntries(filters)
  );
  import_electron4.ipcMain.handle(
    "entries:update",
    async (_event, id, patch) => updateEntry(id, patch)
  );
  import_electron4.ipcMain.handle("entries:delete", async (_event, id) => {
    deleteEntry(id);
    return true;
  });
  import_electron4.ipcMain.handle(
    "prompts:get",
    async (_event, context) => selectPrompt(context ?? void 0)
  );
  import_electron4.ipcMain.handle(
    "prompts:handled",
    async (_event, promptId, action) => {
      markPromptHandled();
      return { promptId, action };
    }
  );
  import_electron4.ipcMain.handle("prompts:quick-entry", async () => {
    ctx.openPromptWindow({ quickEntry: true });
  });
  import_electron4.ipcMain.handle("prompts:snooze", async (_event, minutes) => {
    ctx.snoozePrompt(minutes);
    return true;
  });
  import_electron4.ipcMain.handle("settings:get", async () => getSettings());
  import_electron4.ipcMain.handle(
    "settings:update",
    async (_event, patch) => {
      const updated = updateSettings(patch);
      ctx.refreshScheduler();
      return updated;
    }
  );
  import_electron4.ipcMain.handle("settings:pause", async () => {
    const updated = pausePrompts();
    ctx.refreshScheduler();
    return updated;
  });
  import_electron4.ipcMain.handle("settings:resume", async () => {
    const updated = resumePrompts();
    ctx.refreshScheduler();
    return updated;
  });
  import_electron4.ipcMain.handle("projects:list", async () => listProjects());
  import_electron4.ipcMain.handle(
    "projects:create",
    async (_event, name) => createProject(name)
  );
  import_electron4.ipcMain.handle(
    "projects:update",
    async (_event, id, name) => updateProject(id, name)
  );
  import_electron4.ipcMain.handle("projects:delete", async (_event, id) => {
    deleteProject(id);
    return true;
  });
  import_electron4.ipcMain.handle("traits:list", async () => listTraits());
  import_electron4.ipcMain.handle(
    "traits:create",
    async (_event, name) => createTrait(name)
  );
  import_electron4.ipcMain.handle(
    "traits:update",
    async (_event, id, name) => updateTrait(id, name)
  );
  import_electron4.ipcMain.handle("traits:delete", async (_event, id) => {
    deleteTrait(id);
    return true;
  });
  import_electron4.ipcMain.handle("stats:get", async () => buildInsightsSummary());
};

// electron/tray.ts
var import_electron5 = require("electron");
var buildIcon = () => {
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
  return import_electron5.nativeImage.createFromDataURL(svgUrl).resize({ width: 22, height: 22 });
};
var createQuietQuestionsTray = async (options) => {
  const frequencyOptions = [30, 60, 90, 120];
  const icon = buildIcon();
  const tray2 = new import_electron5.Tray(icon);
  tray2.setToolTip("Quiet Questions");
  if (process.platform === "darwin") {
    tray2.setTitle("QQ");
  }
  if (true) {
    console.log("[QuietQuestions] Tray ready");
  }
  const refreshMenu = async () => {
    const settings = await options.getSettings();
    tray2.setContextMenu(
      import_electron5.Menu.buildFromTemplate([
        {
          label: "Open Quiet Questions",
          click: () => options.openMainWindow()
        },
        {
          label: "New quick entry\u2026",
          click: () => options.openPromptWindow({ quickEntry: true })
        },
        {
          type: "separator"
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
            }
          }))
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
          }
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          role: "quit",
          click: () => options.quit()
        }
      ])
    );
  };
  tray2.on("click", () => {
    tray2.popUpContextMenu();
  });
  await refreshMenu();
  return tray2;
};

// electron/promptScheduler.ts
var minutesToMilliseconds = (minutes) => Math.max(minutes, 1) * 60 * 1e3;
var parseTimeToMinutes = (value) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};
var isWithinQuietHours = (settings, now = /* @__PURE__ */ new Date()) => {
  const start = parseTimeToMinutes(settings.quietHoursStart);
  const end = parseTimeToMinutes(settings.quietHoursEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) {
    return false;
  }
  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
};
var getMillisecondsUntilQuietEnds = (settings, now = /* @__PURE__ */ new Date()) => {
  const quietEnd = parseTimeToMinutes(settings.quietHoursEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  let minutesUntilEnd = quietEnd - current;
  if (minutesUntilEnd <= 0) {
    minutesUntilEnd += 24 * 60;
  }
  return minutesUntilEnd * 60 * 1e3;
};
var PromptScheduler = class {
  constructor(options) {
    this.options = options;
    this.timer = null;
  }
  start() {
    this.clearTimer();
    this.scheduleNext(0);
  }
  refresh() {
    this.start();
  }
  snooze(minutes) {
    this.clearTimer();
    this.scheduleNext(minutesToMilliseconds(minutes));
  }
  stop() {
    this.clearTimer();
  }
  scheduleNext(delay) {
    this.clearTimer();
    this.timer = setTimeout(() => this.tick(), Math.max(delay, 1e3));
  }
  tick() {
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
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
};

// electron/main.ts
var mainWindow = null;
var promptWindow = null;
var tray = null;
var scheduler = null;
var getRendererUrl = () => {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    return devServerUrl;
  }
  return `file://${import_node_path2.default.join(__dirname, "../renderer/index.html")}`;
};
var getPreloadPath = () => import_node_path2.default.join(__dirname, "preload.js");
var isPromptWindowOpen = () => !!promptWindow && !promptWindow.isDestroyed();
var focusOrRestore = (window) => {
  if (window.isMinimized()) {
    window.restore();
  }
  if (!window.isVisible()) {
    window.show();
  }
  window.focus();
};
var openMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow({
      preloadPath: getPreloadPath(),
      rendererUrl: getRendererUrl()
    });
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } else {
    focusOrRestore(mainWindow);
  }
};
var openPromptWindow = (options) => {
  if (promptWindow && !promptWindow.isDestroyed()) {
    focusOrRestore(promptWindow);
    return;
  }
  promptWindow = createPromptWindow({
    preloadPath: getPreloadPath(),
    rendererUrl: getRendererUrl(),
    quickEntry: options?.quickEntry
  });
  promptWindow.on("closed", () => {
    promptWindow = null;
  });
};
var setupScheduler = () => {
  scheduler = new PromptScheduler({
    getSettings,
    isPromptWindowOpen,
    openPromptWindow: () => openPromptWindow()
  });
  scheduler.start();
};
var setupTray = async () => {
  tray = await createQuietQuestionsTray({
    getMainWindow: () => mainWindow,
    openMainWindow,
    openPromptWindow,
    pausePrompts: async () => {
      const settings = pausePrompts();
      scheduler?.refresh();
      return settings;
    },
    resumePrompts: async () => {
      const settings = resumePrompts();
      scheduler?.refresh();
      return settings;
    },
    getSettings: async () => getSettings(),
    updateSettings: async (patch) => {
      const updated = updateSettings(patch);
      scheduler?.refresh();
      return updated;
    },
    refreshScheduler: () => scheduler?.refresh(),
    quit: () => {
      scheduler?.stop();
      import_electron6.app.quit();
    }
  });
};
var bootstrap = async () => {
  import_electron6.app.setAppUserModelId("com.quietquestions.app");
  import_electron6.nativeTheme.themeSource = "light";
  getDatabase();
  openMainWindow();
  registerIpcHandlers({
    openPromptWindow: (options) => {
      openPromptWindow(options);
    },
    refreshScheduler: () => scheduler?.refresh(),
    snoozePrompt: (minutes) => scheduler?.snooze(minutes ?? 15)
  });
  setupScheduler();
  await setupTray();
};
import_electron6.app.on("ready", bootstrap);
import_electron6.app.on("activate", () => {
  if (import_electron6.BrowserWindow.getAllWindows().length === 0) {
    openMainWindow();
  }
});
import_electron6.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron6.app.quit();
  }
});
import_electron6.app.on("before-quit", () => {
  scheduler?.stop();
});
//# sourceMappingURL=main.js.map