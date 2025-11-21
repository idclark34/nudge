export type EntryCategory =
  | "project"
  | "emotion"
  | "trait"
  | "productivity"
  | "identity"
  | "small_win"
  | "behavior";

export interface JournalEntry {
  id: number;
  createdAt: string;
  promptId: number | null;
  promptText: string | null;
  category: EntryCategory;
  projectTag: string | null;
  traitTag: string | null;
  text: string;
  sentiment: string | null;
  meta: Record<string, unknown> | null;
}

export interface JournalEntryInput {
  promptId?: number | null;
  promptText?: string | null;
  category: EntryCategory;
  projectTag?: string | null;
  traitTag?: string | null;
  text: string;
  sentiment?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt?: string;
}

export type JournalEntryPatch = Partial<Omit<JournalEntry, "id">>;

export interface JournalEntryFilters {
  limit?: number;
  offset?: number;
  fromDate?: string;
  toDate?: string;
  category?: EntryCategory;
  projectTag?: string;
  traitTag?: string;
}

