import {
  useChristmasDecorations,
  useUpdateChristmasDecorations,
} from "@/api/christmas-api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";

export function ChristmasToggle({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading } = useChristmasDecorations();
  const update = useUpdateChristmasDecorations();
  const enabled = data?.enabled ?? false;
  const busy = isLoading || update.isPending;

  if (collapsed) {
    return (
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={cn(
          "h-9 w-9 shrink-0",
          enabled && "border-sky-400/60 bg-sky-500/10 text-sky-600 dark:text-sky-300"
        )}
        disabled={busy}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn Christmas decorations off" : "Turn Christmas decorations on"}
        title={enabled ? "Christmas decorations on" : "Christmas decorations off"}
        onClick={() => update.mutate(!enabled)}
      >
        <Snowflake className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-color2/15 bg-background/70 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Snowflake className={cn("h-4 w-4 shrink-0", enabled ? "text-sky-500" : "text-muted-foreground")} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">Christmas</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {enabled ? "Decorations on" : "Decorations off"}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        disabled={busy}
        onCheckedChange={(value) => update.mutate(value)}
        aria-label="Christmas decorations"
      />
    </div>
  );
}
