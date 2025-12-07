import { useMemo } from "react";
import dayjs from "dayjs";
import { useJournalEntries } from "./useJournalEntries";
import type { EntryCategory } from "@/types";

// Get date from N days ago
const getDaysAgoDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

// Extract mood score from entry text
const extractMoodScore = (text: string): number | null => {
  const match = text.match(/Mood check-in:\s*(\d+)\/10/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

// Extract vibe theme from entry text (e.g., "light", "pushed", "people", etc.)
const vibeThemes = [
  { value: "light", label: "Moments of light", emoji: "✨" },
  { value: "pushed", label: "Pushed through", emoji: "🔥" },
  { value: "people", label: "People connections", emoji: "💛" },
  { value: "steady", label: "Slow & steady", emoji: "🌿" },
  { value: "energy", label: "Found energy", emoji: "⚡" },
  { value: "weird", label: "Weird or interesting", emoji: "🌀" },
  { value: "step", label: "Steps forward", emoji: "🎯" },
  { value: "mind", label: "Lots on mind", emoji: "💭" },
];

export interface WeeklyPulse {
  // Streak
  currentStreak: number;
  longestStreak: number;
  
  // Mood trend
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
  moodTrend: "up" | "down" | "steady" | "unknown";
  moodTrendDelta: number;
  
  // Themes
  topTheme: { value: string; label: string; emoji: string; count: number } | null;
  totalCheckIns: number;
  
  // Activity
  activeDays: number;
  totalEntries: number;
}

export const useWeeklyPulse = (): WeeklyPulse => {
  // Get this week's entries
  const { entries: thisWeekEntries } = useJournalEntries({
    fromDate: getDaysAgoDate(7),
    limit: 200,
  });

  // Get last week's entries for comparison
  const { entries: lastWeekEntries } = useJournalEntries({
    fromDate: getDaysAgoDate(14),
    toDate: getDaysAgoDate(7),
    limit: 200,
  });

  // Get all entries for streak calculation (last 30 days)
  const { entries: allRecentEntries } = useJournalEntries({
    fromDate: getDaysAgoDate(30),
    limit: 500,
  });

  const pulse = useMemo(() => {
    // Calculate streak
    const today = dayjs().startOf("day");
    const daysWithEntries = new Set<string>();
    
    allRecentEntries.forEach((entry) => {
      const dateKey = dayjs(entry.createdAt).format("YYYY-MM-DD");
      daysWithEntries.add(dateKey);
    });

    // Current streak - count consecutive days back from today (or yesterday if no entry today yet)
    let currentStreak = 0;
    let checkDate = today;
    
    // Check if there's an entry today, if not start from yesterday
    if (!daysWithEntries.has(checkDate.format("YYYY-MM-DD"))) {
      checkDate = checkDate.subtract(1, "day");
    }
    
    while (daysWithEntries.has(checkDate.format("YYYY-MM-DD"))) {
      currentStreak++;
      checkDate = checkDate.subtract(1, "day");
    }

    // Calculate mood averages
    const thisWeekMoods = thisWeekEntries
      .map((e) => extractMoodScore(e.text))
      .filter((s): s is number => s !== null);
    
    const lastWeekMoods = lastWeekEntries
      .map((e) => extractMoodScore(e.text))
      .filter((s): s is number => s !== null);

    const thisWeekAvg = thisWeekMoods.length > 0
      ? thisWeekMoods.reduce((a, b) => a + b, 0) / thisWeekMoods.length
      : null;
    
    const lastWeekAvg = lastWeekMoods.length > 0
      ? lastWeekMoods.reduce((a, b) => a + b, 0) / lastWeekMoods.length
      : null;

    // Determine trend
    let moodTrend: "up" | "down" | "steady" | "unknown" = "unknown";
    let moodTrendDelta = 0;
    
    if (thisWeekAvg !== null && lastWeekAvg !== null) {
      moodTrendDelta = thisWeekAvg - lastWeekAvg;
      if (moodTrendDelta > 0.5) moodTrend = "up";
      else if (moodTrendDelta < -0.5) moodTrend = "down";
      else moodTrend = "steady";
    } else if (thisWeekAvg !== null) {
      moodTrend = "steady"; // First week, no comparison
    }

    // Count vibe themes this week
    const themeCounts: Record<string, number> = {};
    thisWeekEntries.forEach((entry) => {
      vibeThemes.forEach((theme) => {
        // Check if the theme value appears in the entry text or projectTag
        if (
          entry.projectTag === theme.value ||
          entry.text.toLowerCase().includes(theme.value)
        ) {
          themeCounts[theme.value] = (themeCounts[theme.value] || 0) + 1;
        }
      });
    });

    // Find top theme
    let topTheme: WeeklyPulse["topTheme"] = null;
    let maxCount = 0;
    Object.entries(themeCounts).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        const themeData = vibeThemes.find((t) => t.value === value);
        if (themeData) {
          topTheme = { ...themeData, count };
        }
      }
    });

    // Count active days this week
    const thisWeekDays = new Set<string>();
    thisWeekEntries.forEach((entry) => {
      thisWeekDays.add(dayjs(entry.createdAt).format("YYYY-MM-DD"));
    });

    return {
      currentStreak,
      longestStreak: currentStreak, // Could calculate this properly with more history
      thisWeekAvg: thisWeekAvg !== null ? Math.round(thisWeekAvg * 10) / 10 : null,
      lastWeekAvg: lastWeekAvg !== null ? Math.round(lastWeekAvg * 10) / 10 : null,
      moodTrend,
      moodTrendDelta: Math.round(moodTrendDelta * 10) / 10,
      topTheme,
      totalCheckIns: thisWeekMoods.length,
      activeDays: thisWeekDays.size,
      totalEntries: thisWeekEntries.length,
    };
  }, [thisWeekEntries, lastWeekEntries, allRecentEntries]);

  return pulse;
};



