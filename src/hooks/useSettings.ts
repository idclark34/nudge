import { useCallback, useEffect, useState } from "react";
import type { AppSettings } from "@/types";
import { api } from "@/lib/api";

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
}

export const useSettings = () => {
  const [state, setState] = useState<SettingsState>({
    settings: null,
    loading: false,
    error: null,
  });

  const fetchSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await api.getSettings();
      setState({ settings: result, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load settings",
      }));
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = await api.updateSettings(patch);
      setState({ settings: updated, loading: false, error: null });
      return updated;
    },
    [],
  );

  const togglePrompts = useCallback(async () => {
    if (!state.settings) {
      return null;
    }

    const updated = state.settings.isPaused
      ? await api.resumePrompts()
      : await api.pausePrompts();

    setState({ settings: updated, loading: false, error: null });
    return updated;
  }, [state.settings]);

  return {
    ...state,
    refresh: fetchSettings,
    saveSettings,
    togglePrompts,
  };
};

