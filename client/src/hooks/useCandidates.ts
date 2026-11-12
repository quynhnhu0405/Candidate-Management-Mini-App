import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/api/client";
import type { CandidateFormValues } from "@/schemas/candidate.schema";
import type { Candidate, CandidateListResponse, CandidateStatus, ListParams, SortKey } from "@/types/candidate";

// UI sort option -> API sort/order params
const SORT_MAP: Record<SortKey, { sort: "createdAt" | "fullName"; order: "asc" | "desc" }> = {
  newest: { sort: "createdAt", order: "desc" },
  oldest: { sort: "createdAt", order: "asc" },
  name_asc: { sort: "fullName", order: "asc" },
  name_desc: { sort: "fullName", order: "desc" },
};

export const candidateKeys = {
  all: ["candidates"] as const,
  list: (params: ListParams) => ["candidates", "list", params] as const,
  detail: (id: string) => ["candidates", "detail", id] as const,
};

// ---------- Queries (reading data) ----------

export function useCandidateList(params: ListParams) {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: async () => {
      const { data } = await http.get<CandidateListResponse>("/candidates", {
        params: {
          q: params.q || undefined,
          status: params.status || undefined,
          page: params.page,
          pageSize: params.pageSize,
          ...SORT_MAP[params.sort],
        },
      });
      return data;
    },
    placeholderData: keepPreviousData, // keep showing the old page while the next one loads
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: candidateKeys.detail(id ?? ""),
    queryFn: async () => (await http.get<Candidate>(`/candidates/${id}`)).data,
    enabled: !!id,
    retry: false,
  });
}

// ---------- Mutations (changing data) ----------

// Every mutation refreshes all candidate queries (list, counts and detail).
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: candidateKeys.all });
}

export function useCreateCandidate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (values: CandidateFormValues) => (await http.post<Candidate>("/candidates", values)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateCandidate(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (values: CandidateFormValues) => (await http.put<Candidate>(`/candidates/${id}`, values)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CandidateStatus }) =>
      (await http.patch<Candidate>(`/candidates/${id}/status`, { status })).data,
    onSuccess: invalidate,
  });
}

// Ask the backend (which calls Gemini) to create or re-create the AI summary. Takes a few seconds.
export function useSummarizeCandidate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await http.post<Candidate>(`/candidates/${id}/summarize`)).data,
    onSuccess: invalidate,
  });
}

export function useDeleteCandidate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/candidates/${id}`);
    },
    onSuccess: invalidate,
  });
}
