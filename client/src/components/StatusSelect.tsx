import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateStatus } from "@/hooks/useCandidates";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CANDIDATE_STATUSES, type Candidate, type CandidateStatus } from "@/types/candidate";

// Dropdown that looks like the status badge; changing it saves immediately (FR-04).
export function StatusSelect({ candidate }: { candidate: Candidate }) {
  const { t } = useTranslation();
  const { mutate, isPending } = useUpdateStatus();
  const meta = STATUS_META[candidate.status];

  const handleChange = (value: string) => {
    const status = value as CandidateStatus;
    if (status === candidate.status) return;
    mutate(
      { id: candidate.id, status },
      {
        onSuccess: () =>
          toast.success(t("status.changed", { name: candidate.fullName, status: t(`status.${status}`) })),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <Select value={candidate.status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        aria-label={t("status.statusOf", { name: candidate.fullName })}
        className={cn(
          "h-7 w-auto gap-1.5 rounded-full border px-2.5 text-xs font-medium shadow-none",
          "[&_svg]:size-3.5 [&_svg:not([class*='text-'])]:text-current",
          meta.pill,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {CANDIDATE_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <span className={cn("size-2 rounded-full", STATUS_META[status].dot)} />
            {t(`status.${status}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
