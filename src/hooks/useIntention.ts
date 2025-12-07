import { useCallback, useEffect, useState } from "react";
import type {
  Intention,
  IntentionCheckIn,
  IntentionPromptContext,
} from "@/types";
import { api } from "@/lib/api";

interface IntentionState {
  intentions: Intention[];
  currentIntention: Intention | null; // First active intention (legacy compat)
  checkIns: Map<number, IntentionCheckIn[]>; // Check-ins by intention ID
  promptContext: IntentionPromptContext | null;
  loading: boolean;
  error: string | null;
}

export const useIntention = () => {
  const [state, setState] = useState<IntentionState>({
    intentions: [],
    currentIntention: null,
    checkIns: new Map(),
    promptContext: null,
    loading: false,
    error: null,
  });

  const fetchCurrentIntentions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [intentions, promptContext] = await Promise.all([
        api.getCurrentIntentions(),
        api.getIntentionPromptContext(),
      ]);
      
      // Fetch check-ins for all intentions
      const checkInsMap = new Map<number, IntentionCheckIn[]>();
      await Promise.all(
        intentions.map(async (intention) => {
          const checkIns = await api.getCheckInsForIntention(intention.id);
          checkInsMap.set(intention.id, checkIns);
        })
      );
      
      setState({
        intentions,
        currentIntention: intentions.length > 0 ? intentions[0] : null,
        checkIns: checkInsMap,
        promptContext,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load intentions",
      }));
    }
  }, []);

  useEffect(() => {
    fetchCurrentIntentions();
  }, [fetchCurrentIntentions]);

  const addIntention = useCallback(
    async (text: string) => {
      const month = new Date().toISOString().slice(0, 7);
      const intention = await api.createIntention({ text, month });
      setState((prev) => ({
        ...prev,
        intentions: [...prev.intentions, intention],
        currentIntention: prev.currentIntention ?? intention,
      }));
      return intention;
    },
    [],
  );

  const updateIntention = useCallback(
    async (id: number, text: string) => {
      const updated = await api.updateIntention(id, text);
      setState((prev) => ({
        ...prev,
        intentions: prev.intentions.map((i) => (i.id === id ? updated : i)),
        currentIntention: prev.currentIntention?.id === id ? updated : prev.currentIntention,
      }));
      return updated;
    },
    [],
  );

  const deleteIntention = useCallback(
    async (id: number) => {
      await api.deleteIntention(id);
      setState((prev) => {
        const newIntentions = prev.intentions.filter((i) => i.id !== id);
        const newCheckIns = new Map(prev.checkIns);
        newCheckIns.delete(id);
        return {
          ...prev,
          intentions: newIntentions,
          currentIntention: prev.currentIntention?.id === id 
            ? (newIntentions.length > 0 ? newIntentions[0] : null)
            : prev.currentIntention,
          checkIns: newCheckIns,
        };
      });
    },
    [],
  );

  const toggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      const updated = await api.toggleIntentionActive(id, isActive);
      setState((prev) => ({
        ...prev,
        intentions: prev.intentions.map((i) => (i.id === id ? updated : i)),
      }));
      return updated;
    },
    [],
  );

  const checkIn = useCallback(
    async (intentionId: number, reflection: string, progress: IntentionCheckIn["progress"]) => {
      const now = new Date();
      const weekYear = now.getFullYear();
      const weekNum = getISOWeek(now);
      const week = `${weekYear}-W${String(weekNum).padStart(2, "0")}`;
      
      const checkInResult = await api.createCheckIn({
        intentionId,
        week,
        reflection,
        progress,
      });
      
      setState((prev) => {
        const newCheckIns = new Map(prev.checkIns);
        const existing = newCheckIns.get(intentionId) ?? [];
        newCheckIns.set(intentionId, [checkInResult, ...existing]);
        return {
          ...prev,
          checkIns: newCheckIns,
        };
      });
      
      return checkInResult;
    },
    [],
  );

  // Legacy: setIntention (for backward compatibility)
  const setIntention = useCallback(
    async (text: string) => addIntention(text),
    [addIntention],
  );

  return {
    ...state,
    // Legacy: checkIns as array (for first intention)
    checkInsArray: state.currentIntention 
      ? (state.checkIns.get(state.currentIntention.id) ?? [])
      : [],
    refresh: fetchCurrentIntentions,
    addIntention,
    updateIntention,
    deleteIntention,
    toggleActive,
    checkIn,
    setIntention, // Legacy
  };
};

// Helper to get ISO week number
const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

