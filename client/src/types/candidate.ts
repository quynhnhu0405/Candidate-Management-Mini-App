export const CANDIDATE_STATUSES = ["NEW", "CONTACTED", "SHORTLISTED", "REJECTED"] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  yearsOfExperience: number;
  skills: string[];
  experience: string;
  status: CandidateStatus;
  aiSummary: string | null;
  summarizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateListResponse {
  data: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<CandidateStatus, number>;
}

export type SortKey = "newest" | "oldest" | "name_asc" | "name_desc";

export interface ListParams {
  q: string;
  status: CandidateStatus | "";
  page: number;
  pageSize: number;
  sort: SortKey;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

// Minimum length of the experience text before AI summary is allowed (matches the backend).
export const MIN_EXPERIENCE_FOR_AI = 30;
