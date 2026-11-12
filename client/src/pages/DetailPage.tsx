import { Calendar, Clock, Mail, Pencil, Phone, Trash2, UserX, Briefcase } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { CandidateAvatar } from "@/components/CandidateAvatar";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SkillBadges } from "@/components/SkillBadges";
import { StatusSelect } from "@/components/StatusSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCandidate, useDeleteCandidate } from "@/hooks/useCandidates";
import { formatDateTime, formatYears } from "@/lib/format";

export default function DetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const deleteMutation = useDeleteCandidate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !candidate) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title={t("detail.notFoundTitle")}
          description={t("detail.notFoundDescription")}
          action={
            <Button asChild variant="outline">
              <Link to="/">{t("common.backToCandidates")}</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(candidate.id, {
      onSuccess: () => {
        toast.success(t("list.deleted", { name: candidate.fullName }));
        navigate("/", { replace: true });
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <>
      <PageHeader
        title={t("detail.title")}
        breadcrumbs={[{ label: t("nav.candidates"), to: "/" }, { label: candidate.fullName }]}
      />

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CandidateAvatar name={candidate.fullName} className="size-14 text-base" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{candidate.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {t("detail.subtitle", {
                  position: candidate.position,
                  years: formatYears(candidate.yearsOfExperience),
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusSelect candidate={candidate} />
            <Button variant="outline" asChild>
              <Link to={`/candidates/${candidate.id}/edit`}>
                <Pencil /> {t("common.edit")}
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 /> {t("common.delete")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <AiSummaryCard candidate={candidate} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4 text-primary" /> {t("detail.experience")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.experience.trim() ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{candidate.experience}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("detail.noExperience")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Mail className="size-4" />}>
                <a href={`mailto:${candidate.email}`} className="break-all hover:text-primary hover:underline">
                  {candidate.email}
                </a>
              </InfoRow>
              <InfoRow icon={<Phone className="size-4" />}>
                {candidate.phone ? (
                  <a href={`tel:${candidate.phone}`} className="hover:text-primary hover:underline">
                    {candidate.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{t("common.notProvided")}</span>
                )}
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.skills")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillBadges skills={candidate.skills} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.activity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Calendar className="size-4" />}>
                {t("detail.added", { date: formatDateTime(candidate.createdAt) })}
              </InfoRow>
              <InfoRow icon={<Clock className="size-4" />}>
                {t("detail.updated", { date: formatDateTime(candidate.updatedAt) })}
              </InfoRow>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteDialog
        candidate={confirmOpen ? candidate : null}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-64" />
      <Skeleton className="mb-6 h-24 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
