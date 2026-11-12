import {
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
  UserPlus,
  Users,
  X,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client";
import { CandidateAvatar } from "@/components/CandidateAvatar";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SkillBadges } from "@/components/SkillBadges";
import { StatusSelect } from "@/components/StatusSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCandidateList, useDeleteCandidate } from "@/hooks/useCandidates";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, formatYears } from "@/lib/format";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  CANDIDATE_STATUSES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type Candidate,
  type ListParams,
  type SortKey,
} from "@/types/candidate";

// Labels come from translations: t(`sort.${key}`)
const SORT_KEYS: SortKey[] = ["newest", "oldest", "name_asc", "name_desc"];

const DEFAULT_SORT: SortKey = "newest";

export default function ListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters live in the URL so the page can be refreshed, bookmarked and shared.
  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");
  const params: ListParams = {
    q: searchParams.get("q") ?? "",
    status: CANDIDATE_STATUSES.find((s) => s === statusParam) ?? "",
    page: Math.max(1, Number(searchParams.get("page")) || 1),
    pageSize: PAGE_SIZE_OPTIONS.find((n) => n === Number(searchParams.get("pageSize"))) ?? DEFAULT_PAGE_SIZE,
    sort: SORT_KEYS.find((key) => key === sortParam) ?? DEFAULT_SORT,
  };

  const updateParams = (changes: Partial<ListParams>) => {
    const next = { ...params, ...changes };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.status) search.set("status", next.status);
    if (next.page > 1) search.set("page", String(next.page));
    if (next.pageSize !== DEFAULT_PAGE_SIZE) search.set("pageSize", String(next.pageSize));
    if (next.sort !== DEFAULT_SORT) search.set("sort", next.sort);
    setSearchParams(search);
  };

  // Search box: update the input immediately, but only query the API 300ms after typing stops.
  const [searchText, setSearchText] = useState(params.q);
  const debouncedSearch = useDebouncedValue(searchText, 300);
  useEffect(() => {
    if (debouncedSearch.trim() !== params.q) updateParams({ q: debouncedSearch.trim(), page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useCandidateList(params);
  const deleteMutation = useDeleteCandidate();
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const hasFilters = !!params.q || !!params.status;
  const clearFilters = () => {
    setSearchText("");
    setSearchParams(new URLSearchParams());
  };

  const confirmDelete = () => {
    if (!candidateToDelete) return;
    const deleted = candidateToDelete;
    deleteMutation.mutate(deleted.id, {
      onSuccess: () => {
        toast.success(t("list.deleted", { name: deleted.fullName }));
        setCandidateToDelete(null);
        // Deleted the last row of a page > 1: go back one page instead of showing an empty page.
        if (data && data.data.length === 1 && params.page > 1) updateParams({ page: params.page - 1 });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const totalAll = data ? Object.values(data.statusCounts).reduce((sum, n) => sum + n, 0) : null;
  const candidates = data?.data ?? [];

  return (
    <>
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <Button asChild>
            <Link to="/candidates/new">
              <Plus /> {t("list.add")}
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: search + sort */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-60 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="pr-9 pl-9"
              aria-label={t("list.searchAria")}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={t("list.clearSearch")}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{t("sort.label")}</span>
            <Select value={params.sort} onValueChange={(value) => updateParams({ sort: value as SortKey, page: 1 })}>
              <SelectTrigger className="w-40" aria-label={t("sort.aria")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`sort.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status filter tabs with counts */}
        <div className="flex flex-wrap gap-1.5 border-b px-4 pb-3" role="tablist" aria-label={t("list.filterAria")}>
          <FilterTab
            label={t("list.all")}
            count={totalAll}
            active={params.status === ""}
            onClick={() => updateParams({ status: "", page: 1 })}
          />
          {CANDIDATE_STATUSES.map((status) => (
            <FilterTab
              key={status}
              label={t(`status.${status}`)}
              dotClass={STATUS_META[status].dot}
              count={data ? data.statusCounts[status] : null}
              active={params.status === status}
              onClick={() => updateParams({ status, page: 1 })}
            />
          ))}
        </div>

        {isError && !data ? (
          <EmptyState
            icon={AlertCircle}
            title={t("list.errorTitle")}
            description={getErrorMessage(error)}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                {t("common.tryAgain")}
              </Button>
            }
          />
        ) : !isLoading && candidates.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title={t("list.noMatchTitle")}
              description={t("list.noMatchDescription")}
              action={
                <Button variant="outline" onClick={clearFilters}>
                  {t("list.clearFilters")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title={t("list.emptyTitle")}
              description={t("list.emptyDescription")}
              action={
                <Button asChild>
                  <Link to="/candidates/new">
                    <UserPlus /> {t("list.add")}
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">{t("list.col.candidate")}</TableHead>
                  <TableHead>{t("list.col.position")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("list.col.experience")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("list.col.skills")}</TableHead>
                  <TableHead>{t("list.col.status")}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t("list.col.added")}</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                  : candidates.map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <CandidateAvatar name={candidate.fullName} />
                            <div className="min-w-0">
                              <Link
                                to={`/candidates/${candidate.id}`}
                                onClick={(event) => event.stopPropagation()}
                                className="block truncate font-medium hover:text-primary hover:underline"
                              >
                                {candidate.fullName}
                              </Link>
                              <p className="truncate text-sm text-muted-foreground">{candidate.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{candidate.position}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatYears(candidate.yearsOfExperience)}
                        </TableCell>
                        <TableCell className="hidden max-w-60 lg:table-cell">
                          <SkillBadges skills={candidate.skills} max={3} />
                        </TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <StatusSelect candidate={candidate} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {formatDate(candidate.createdAt)}
                        </TableCell>
                        <TableCell className="pr-4" onClick={(event) => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("list.actionsFor", { name: candidate.fullName })}
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => navigate(`/candidates/${candidate.id}`)}>
                                <Eye /> {t("list.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => navigate(`/candidates/${candidate.id}/edit`)}>
                                <Pencil /> {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setCandidateToDelete(candidate)}>
                                <Trash2 /> {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
            {data && (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={(page) => updateParams({ page })}
                onPageSizeChange={(pageSize) => updateParams({ pageSize, page: 1 })}
              />
            )}
          </>
        )}
      </Card>

      <ConfirmDeleteDialog
        candidate={candidateToDelete}
        isDeleting={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setCandidateToDelete(null)}
      />
    </>
  );
}

function FilterTab({
  label,
  count,
  active,
  dotClass,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  dotClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {dotClass && <span className={cn("size-2 rounded-full", dotClass)} />}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
        )}
      >
        {count ?? "–"}
      </span>
    </button>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-5 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="pr-4">
        <Skeleton className="size-8" />
      </TableCell>
    </TableRow>
  );
}
