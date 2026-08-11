import { Badge } from "@/components/ui/badge";
import type { DeadlineTag } from "@/hooks/useDeadlineTags";

interface DeadlineTagBadgesProps {
  tags?: DeadlineTag[];
  max?: number;
  className?: string;
}

export function DeadlineTagBadges({ tags, max = 2, className }: DeadlineTagBadgesProps) {
  if (!tags || tags.length === 0) return null;
  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ""}`}>
      {visible.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 border-transparent"
          style={
            tag.color
              ? { backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}66` }
              : undefined
          }
        >
          {tag.name}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
          +{rest}
        </Badge>
      )}
    </div>
  );
}
