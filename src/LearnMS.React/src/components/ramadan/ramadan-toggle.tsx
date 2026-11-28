import { useRamadanDecorations, useUpdateRamadanDecorations } from "@/api/ramadan-api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Moon } from "lucide-react";

export function RamadanToggle({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading } = useRamadanDecorations();
  const update = useUpdateRamadanDecorations();
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
          enabled && "border-amber-400/70 bg-amber-500/10 text-amber-600 dark:text-amber-300"
        )}
        disabled={busy}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn Ramadan decorations off" : "Turn Ramadan decorations on"}
        title={enabled ? "Ramadan decorations on" : "Ramadan decorations off"}
        onClick={() => update.mutate(!enabled)}
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-color2/15 bg-background/70 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Moon className={cn("h-4 w-4 shrink-0", enabled ? "text-amber-500" : "text-muted-foreground")} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">Ramadan</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {enabled ? "Decorations on" : "Decorations off"}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        disabled={busy}
        onCheckedChange={(value) => update.mutate(value)}
        aria-label="Ramadan decorations"
      />
    </div>
  );
}
