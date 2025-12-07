export interface Intention {
  id: number;
  text: string;
  month: string; // Format: "YYYY-MM"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntentionInput {
  text: string;
  month: string;
}

export interface IntentionCheckIn {
  id: number;
  intentionId: number;
  week: string; // Format: "YYYY-Www" (ISO week)
  reflection: string;
  progress: "on_track" | "struggling" | "pivoting" | "achieved";
  createdAt: string;
}

export interface IntentionCheckInInput {
  intentionId: number;
  week: string;
  reflection: string;
  progress: "on_track" | "struggling" | "pivoting" | "achieved";
}

export type IntentionPromptType = "new_intention" | "check_in";

export interface IntentionPromptContext {
  type: IntentionPromptType;
  currentIntention: Intention | null;
  currentIntentions: Intention[];
  lastCheckIn: IntentionCheckIn | null;
  intentionsNeedingCheckIn?: Intention[];
}

