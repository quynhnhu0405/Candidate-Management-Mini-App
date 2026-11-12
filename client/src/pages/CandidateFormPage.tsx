import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, UserX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, getErrorMessage } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCandidate, useCreateCandidate, useUpdateCandidate } from "@/hooks/useCandidates";
import { cn } from "@/lib/utils";
import { candidateFormSchema, type CandidateFormValues } from "@/schemas/candidate.schema";
import { MIN_EXPERIENCE_FOR_AI, type Candidate } from "@/types/candidate";

const EMPTY_VALUES: CandidateFormValues = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  yearsOfExperience: 0,
  skills: [],
  experience: "",
};

const toFormValues = (candidate: Candidate): CandidateFormValues => ({
  fullName: candidate.fullName,
  email: candidate.email,
  phone: candidate.phone ?? "",
  position: candidate.position,
  yearsOfExperience: candidate.yearsOfExperience,
  skills: candidate.skills,
  experience: candidate.experience,
});

// One page for both "Add candidate" (/candidates/new) and "Edit candidate" (/candidates/:id/edit).
export default function CandidateFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const candidateQuery = useCandidate(id);
  const createMutation = useCreateCandidate();
  const updateMutation = useUpdateCandidate(id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: EMPTY_VALUES,
    // In edit mode the form is filled once the candidate has loaded.
    ...(candidateQuery.data ? { values: toFormValues(candidateQuery.data) } : {}),
  });

  // Warn before leaving with unsaved changes (not after a successful save).
  const [savedId, setSavedId] = useState<string | null>(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && !savedId && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm(t("form.unsavedConfirm"))) blocker.proceed();
    else blocker.reset();
  }, [blocker, t]);

  useEffect(() => {
    if (savedId) navigate(`/candidates/${savedId}`);
  }, [savedId, navigate]);

  const onSubmit = async (values: CandidateFormValues) => {
    try {
      const saved = isEdit ? await updateMutation.mutateAsync(values) : await createMutation.mutateAsync(values);
      toast.success(t(isEdit ? "form.updated" : "form.added"));
      setSavedId(saved.id); // navigation happens in the effect below, after the blocker is released
    } catch (error) {
      // Duplicate email is a field-level problem, show it under the field.
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setError("email", { message: "form.emailExists" });
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const experienceLength = useWatch({ control, name: "experience" }).trim().length;
  const cancelTo = isEdit ? `/candidates/${id}` : "/";

  if (isEdit && candidateQuery.isError) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title={t("form.notFoundTitle")}
          description={t("form.notFoundDescription")}
          action={
            <Button asChild variant="outline">
              <Link to="/">{t("common.backToCandidates")}</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const title = t(isEdit ? "form.editTitle" : "form.addTitle");
  const crumbs = [
    { label: t("nav.candidates"), to: "/" },
    ...(isEdit && candidateQuery.data
      ? [{ label: candidateQuery.data.fullName, to: `/candidates/${id}` }, { label: t("form.editCrumb") }]
      : [{ label: t("form.newCrumb") }]),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={title}
        description={t(isEdit ? "form.editDescription" : "form.addDescription")}
        breadcrumbs={crumbs}
      />

      {isEdit && candidateQuery.isLoading ? (
        <FormSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Card>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <SectionTitle title={t("form.basicTitle")} description={t("form.basicDescription")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("form.fullName")} htmlFor="fullName" required error={errors.fullName?.message}>
                    <Input
                      id="fullName"
                      placeholder={t("form.placeholders.fullName")}
                      aria-invalid={!!errors.fullName}
                      {...register("fullName")}
                    />
                  </Field>
                  <Field label={t("form.email")} htmlFor="email" required error={errors.email?.message}>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("form.placeholders.email")}
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </Field>
                  <Field label={t("form.phone")} htmlFor="phone" error={errors.phone?.message}>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("form.placeholders.phone")}
                      aria-invalid={!!errors.phone}
                      {...register("phone")}
                    />
                  </Field>
                  <Field label={t("form.position")} htmlFor="position" required error={errors.position?.message}>
                    <Input
                      id="position"
                      placeholder={t("form.placeholders.position")}
                      aria-invalid={!!errors.position}
                      {...register("position")}
                    />
                  </Field>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <SectionTitle title={t("form.experienceTitle")} description={t("form.experienceDescription")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t("form.yearsOfExperience")}
                    htmlFor="yearsOfExperience"
                    required
                    error={errors.yearsOfExperience?.message}
                    hint={t("form.hints.years")}
                  >
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min={0}
                      max={50}
                      inputMode="numeric"
                      aria-invalid={!!errors.yearsOfExperience}
                      {...register("yearsOfExperience", { valueAsNumber: true })}
                    />
                  </Field>
                </div>
                <Field
                  label={t("form.skills")}
                  htmlFor="skills"
                  error={errors.skills?.message}
                  hint={t("form.hints.skills")}
                >
                  <Controller
                    control={control}
                    name="skills"
                    render={({ field }) => (
                      <TagInput
                        id="skills"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("form.placeholders.skills")}
                      />
                    )}
                  />
                </Field>
                <Field label={t("form.experienceText")} htmlFor="experience" error={errors.experience?.message}>
                  <Textarea
                    id="experience"
                    rows={7}
                    placeholder={t("form.placeholders.experience")}
                    {...register("experience")}
                  />
                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-xs",
                      experienceLength >= MIN_EXPERIENCE_FOR_AI ? "text-emerald-600" : "text-muted-foreground",
                    )}
                  >
                    {experienceLength >= MIN_EXPERIENCE_FOR_AI ? (
                      <>
                        <CheckCircle2 className="size-3.5" /> {t("form.aiReady", { count: experienceLength })}
                      </>
                    ) : (
                      <>{t("form.aiNotReady", { count: experienceLength, min: MIN_EXPERIENCE_FOR_AI })}</>
                    )}
                  </p>
                </Field>
              </section>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isSaving}>
              <Link to={cancelTo}>{t("common.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              {t(isEdit ? "form.save" : "form.add")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {t(error)}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function FormSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}
