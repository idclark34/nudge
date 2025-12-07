import { useMemo } from "react";
import { useJournalEntries } from "./useJournalEntries";

// Get date from 7 days ago
const getWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
};

// Extract mood score from entry text (format: "Mood check-in: X/10 — ...")
const extractMoodScore = (text: string): number | null => {
  const match = text.match(/Mood check-in:\s*(\d+)\/10/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export type VibeLevel = "low" | "foggy" | "balanced" | "motivated" | "electric";

export interface WeeklyVibe {
  averageMood: number;
  vibeLevel: VibeLevel;
  moodCount: number;
  emoji: string;
  label: string;
  gradient: string;
  bgGradient: string;
  headerGradient: string;
}

const vibeConfig: Record<VibeLevel, { emoji: string; label: string; gradient: string; bgGradient: string; headerGradient: string }> = {
  low: {
    emoji: "🥀",
    label: "Taking it slow",
    gradient: "from-slate-500 via-slate-400 to-indigo-600",
    bgGradient: "from-slate-100 via-slate-50 to-indigo-50",
    headerGradient: "from-slate-100 via-white to-indigo-50",
  },
  foggy: {
    emoji: "🌫️",
    label: "Cloudy days",
    gradient: "from-slate-400 via-blue-300 to-indigo-400",
    bgGradient: "from-slate-50 via-blue-50 to-indigo-50",
    headerGradient: "from-blue-50 via-white to-indigo-50",
  },
  balanced: {
    emoji: "🌤️",
    label: "Steady & grounded",
    gradient: "from-sky-400 via-teal-400 to-emerald-400",
    bgGradient: "from-sky-50 via-teal-50 to-emerald-50",
    headerGradient: "from-[#E6FFF9] via-white to-[#E6F7FF]",
  },
  motivated: {
    emoji: "🔥",
    label: "Fired up",
    gradient: "from-amber-400 via-orange-400 to-rose-400",
    bgGradient: "from-amber-50 via-orange-50 to-rose-50",
    headerGradient: "from-[#FFF9E6] via-white to-[#FFE6E6]",
  },
  electric: {
    emoji: "🌈",
    label: "Unstoppable energy",
    gradient: "from-rose-400 via-fuchsia-400 to-violet-400",
    bgGradient: "from-rose-50 via-fuchsia-50 to-violet-50",
    headerGradient: "from-[#FFE6F0] via-white to-[#F0E6FF]",
  },
};

const getVibeLevel = (avgMood: number): VibeLevel => {
  if (avgMood <= 2) return "low";
  if (avgMood <= 4) return "foggy";
  if (avgMood <= 6) return "balanced";
  if (avgMood <= 8) return "motivated";
  return "electric";
};

export const useWeeklyVibe = (): WeeklyVibe => {
  const { entries } = useJournalEntries({
    fromDate: getWeekAgoDate(),
    limit: 100,
  });

  const vibe = useMemo(() => {
    // Extract all mood scores from entries
    const moodScores = entries
      .map((entry) => extractMoodScore(entry.text))
      .filter((score): score is number => score !== null);

    // Calculate average, default to 5 (balanced) if no moods recorded
    const averageMood = moodScores.length > 0
      ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
      : 5;

    const vibeLevel = getVibeLevel(averageMood);
    const config = vibeConfig[vibeLevel];

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      vibeLevel,
      moodCount: moodScores.length,
      ...config,
    };
  }, [entries]);

  return vibe;
};



