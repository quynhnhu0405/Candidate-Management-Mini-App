import i18n from "@/i18n";

// Dates follow the selected language (en / vi / ko). These run during render, and the components that call
// them use useTranslation(), so they re-render when the language changes.
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(iso));
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

// "1 year" / "5 years" (en), "5 năm" (vi), "5년" (ko): plural rules live in the translation files.
export const formatYears = (years: number) => i18n.t("years", { count: years });

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Split an AI summary into bullet lines, removing leading "-", "*" or "•".
export function summaryToLines(summary: string): string[] {
  return summary
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}
