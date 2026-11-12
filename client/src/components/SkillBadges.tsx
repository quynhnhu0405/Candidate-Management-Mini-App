import { Badge } from "@/components/ui/badge";

// Shows skills as chips. `max` collapses the rest into "+N" (used in table rows).
export function SkillBadges({ skills, max }: { skills: string[]; max?: number }) {
  if (skills.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  const visible = max ? skills.slice(0, max) : skills;
  const hidden = skills.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((skill) => (
        <Badge key={skill} variant="secondary" className="font-normal">
          {skill}
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge variant="outline" className="font-normal text-muted-foreground" title={skills.slice(max).join(", ")}>
          +{hidden}
        </Badge>
      )}
    </div>
  );
}
