import { useCallback, useEffect, useState } from "react";
import type { InsightsSummary } from "@/types";
import { api } from "@/lib/api";

interface InsightsState {
  insights: InsightsSummary | null;
  loading: boolean;
  error: string | null;
}

export const useInsights = () => {
  const [state, setState] = useState<InsightsState>({
    insights: null,
    loading: false,
    error: null,
  });

  const loadInsights = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await api.getStats();
      setState({ insights: result, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load insights",
      }));
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    ...state,
    refresh: loadInsights,
  };
};

