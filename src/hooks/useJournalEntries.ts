import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  JournalEntry,
  JournalEntryFilters,
  JournalEntryInput,
  JournalEntryPatch,
} from "@/types";
import { api } from "@/lib/api";

export interface JournalEntriesState {
  entries: JournalEntry[];
  total: number;
  loading: boolean;
  error: string | null;
}

const defaultFilters: Required<Pick<JournalEntryFilters, "limit" | "offset">> = {
  limit: 50,
  offset: 0,
};

export const useJournalEntries = (filters: JournalEntryFilters = {}) => {
  const [state, setState] = useState<JournalEntriesState>({
    entries: [],
    total: 0,
    loading: false,
    error: null,
  });

  const mergedFilters = useMemo(
    () => ({
      ...defaultFilters,
      ...filters,
    }),
    [filters],
  );

  const fetchEntries = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.getEntries(mergedFilters);
      setState({
        entries: response.entries,
        total: response.total,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load entries",
      }));
    }
  }, [mergedFilters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = useCallback(
    async (payload: JournalEntryInput) => {
      const entry = await api.createEntry(payload);
      await fetchEntries();
      return entry;
    },
    [fetchEntries],
  );

  const updateEntry = useCallback(
    async (id: number, patch: JournalEntryPatch) => {
      const entry = await api.updateEntry(id, patch);
      await fetchEntries();
      return entry;
    },
    [fetchEntries],
  );

  const deleteEntry = useCallback(
    async (id: number) => {
      await api.deleteEntry(id);
      await fetchEntries();
    },
    [fetchEntries],
  );

  return {
    ...state,
    filters: mergedFilters,
    refresh: fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};

