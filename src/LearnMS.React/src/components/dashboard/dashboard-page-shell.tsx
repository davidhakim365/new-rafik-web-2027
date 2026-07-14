import { GlowOrb, PhysicsGrid, FloatingFormulas } from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type DashboardPageShellProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  fullWidth?: boolean;
  decorative?: boolean;
};

export function DashboardPageShell({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
  fullWidth = false,
  decorative = false,
}: DashboardPageShellProps) {
  return (
    <div className={cn("relative min-h-full w-full", className)}>
      <PhysicsGrid className="opacity-60" />
      {decorative && <FloatingFormulas className="opacity-40" />}
      <GlowOrb
        className="absolute -right-24 top-0 h-72 w-72 opacity-40 blur-3xl"
        color="from-color2/25 to-color1/15"
      />
      <GlowOrb
        className="absolute -left-16 bottom-0 h-56 w-56 opacity-30 blur-3xl"
        color="from-color1/20 to-color2/10"
      />

      <div
        className={cn(
          "relative z-10 mx-auto flex w-full flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6",
          !fullWidth && "max-w-7xl"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-lg shadow-color2/20">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>

        <div className={cn("space-y-4", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
