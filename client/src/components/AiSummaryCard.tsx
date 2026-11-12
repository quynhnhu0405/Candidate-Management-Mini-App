import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSummarizeCandidate } from "@/hooks/useCandidates";
import { formatDateTime, summaryToLines } from "@/lib/format";
import { MIN_EXPERIENCE_FOR_AI, type Candidate } from "@/types/candidate";

// AI summary of the candidate's experience (FR-05): shows the saved summary and lets the user
// create it or re-create it. The browser only calls our backend; the backend calls Gemini.
export function AiSummaryCard({ candidate }: { candidate: Candidate }) {
  const { t } = useTranslation();
  const { mutate, isPending } = useSummarizeCandidate();

  const lines = candidate.aiSummary ? summaryToLines(candidate.aiSummary) : [];
  const hasSummary = lines.length > 0;
  // Same rule as the backend: very short descriptions are not summarized.
  const experienceTooShort = candidate.experience.trim().length < MIN_EXPERIENCE_FOR_AI;

  const handleClick = () =>
    mutate(candidate.id, {
      onSuccess: () => toast.success(t("detail.summaryDone")),
      onError: (error) => toast.error(getErrorMessage(error)),
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> {t("detail.aiSummary")}
        </CardTitle>
        <CardAction>
          <Button
            size="sm"
            variant={hasSummary ? "outline" : "default"}
            onClick={handleClick}
            disabled={isPending || experienceTooShort}
          >
            {isPending ? <Loader2 className="animate-spin" /> : hasSummary ? <RefreshCw /> : <Sparkles />}
            {isPending ? t("detail.generating") : t(hasSummary ? "detail.regenerate" : "detail.summarize")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent aria-busy={isPending}>
        {isPending ? (
          // Loading state while the AI is working (usually 2-5 seconds)
          <div className="space-y-2.5" role="status" aria-label={t("detail.generating")}>
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-9/12" />
          </div>
        ) : hasSummary ? (
          <>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-primary">
              {lines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              {candidate.summarizedAt && (
                <>{t("detail.generated", { date: formatDateTime(candidate.summarizedAt) })} · </>
              )}
              {t("detail.aiDisclaimer")}
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t("detail.noSummary")}</p>
            <p className="mt-1">
              {experienceTooShort
                ? t("detail.summaryTooShort", { min: MIN_EXPERIENCE_FOR_AI })
                : t("detail.summaryPlaceholder")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
