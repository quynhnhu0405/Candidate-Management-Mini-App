import type { CandidateStatus } from "@/types/candidate";

// Colors for each status (used by the badge, dropdown and filter tabs).
// The visible name comes from translations: t(`status.${status}`).
export const STATUS_META: Record<CandidateStatus, { pill: string; dot: string }> = {
  NEW: { pill: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  CONTACTED: { pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  SHORTLISTED: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  REJECTED: { pill: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};
