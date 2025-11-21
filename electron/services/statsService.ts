import type { InsightsSummary } from "../../src/types/stats";
import {
  getStatsSnapshot,
} from "./journalService";

export const buildInsightsSummary = (): InsightsSummary => {
  const snapshot = getStatsSnapshot();

  const mostFrequentCategory = snapshot.categoryCounts[0]?.category ?? null;
  const mostActiveProject = snapshot.projectCounts[0]?.projectTag ?? null;
  const mostActiveTrait = snapshot.traitCounts[0]?.traitTag ?? null;

  return {
    totalThisWeek: snapshot.totalThisWeek,
    entriesByCategory: snapshot.categoryCounts.map((row) => ({
      category: row.category,
      count: row.count,
    })),
    topProjects: snapshot.projectCounts,
    topTraits: snapshot.traitCounts,
    mostFrequentCategory,
    mostActiveProject,
    mostActiveTrait,
  };
};

