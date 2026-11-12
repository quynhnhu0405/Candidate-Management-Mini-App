import { useTranslation } from "react-i18next";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/types/candidate";

export function StatusBadge({ status, className }: { status: CandidateStatus; className?: string }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(`status.${status}`)}
    </span>
  );
}
