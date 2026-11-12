import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Type a skill and press Enter or comma to add it; Backspace on an empty field removes the last one.
export function TagInput({
  value,
  onChange,
  placeholder,
  id,
  invalid,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  // Adds one or more skills. Pasting "React, Node.js, SQL" adds three tags.
  const addTags = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const next = [...value];
    for (const tag of incoming) {
      // ignore duplicates, case-insensitive
      if (!next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        invalid && "border-destructive ring-destructive/20",
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((existing) => existing !== tag))}
            className="rounded-sm text-muted-foreground hover:text-foreground"
            aria-label={t("form.removeSkill", { skill: tag })}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => {
          const text = event.target.value;
          // a comma (typed or pasted) finishes the tag(s) before it
          if (text.includes(",")) {
            const lastComma = text.lastIndexOf(",");
            addTags(text.slice(0, lastComma));
            setDraft(text.slice(lastComma + 1));
          } else setDraft(text);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => addTags(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
