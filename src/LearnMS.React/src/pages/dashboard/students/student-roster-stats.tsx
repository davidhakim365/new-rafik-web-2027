import { StudentRosterStatistics } from "@/api/students-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import Loading from "@/components/loading/loading";
import { cn } from "@/lib/utils";
import {
  Apple,
  Ban,
  Building2,
  Globe,
  GraduationCap,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
  Level4: "3rd Secondary Adby",
};

type StatBoxProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className: string;
  iconClassName: string;
};

function StatBox({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  iconClassName,
}: StatBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
      </div>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function percent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

type StudentRosterStatsProps = {
  stats?: StudentRosterStatistics;
  isLoading: boolean;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
};

export function StudentRosterStats({
  stats,
  isLoading,
  selectedLevel,
  onSelectLevel,
}: StudentRosterStatsProps) {
  if (isLoading) {
    return (
      <DashboardCard padding="sm">
        <Loading />
      </DashboardCard>
    );
  }

  const total = stats?.total ?? 0;
  const online = stats?.online ?? 0;
  const offline = stats?.offline ?? 0;
  const deviceLinked = stats?.deviceLinked ?? 0;
  const blocked = stats?.blocked ?? 0;
  const withCredit = stats?.withCredit ?? 0;
  const withApples = stats?.withApples ?? 0;
  const byLevel = stats?.byLevel ?? [];
  const levelLabel =
    selectedLevel !== "all" ? LEVEL_LABELS[selectedLevel] : undefined;

  return (
    <DashboardCard padding="sm" spotlight={false}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Student overview</h3>
          <p className="text-sm text-muted-foreground">
            {levelLabel
              ? `Web and center students in ${levelLabel}`
              : "All registered students on the website"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox
          title="Total students"
          value={total}
          subtitle={levelLabel ?? "All levels"}
          icon={Users}
          className="border-slate-500/25 bg-slate-500/10 text-slate-800 dark:text-slate-100"
          iconClassName="bg-slate-500/20 text-slate-600 dark:text-slate-300"
        />
        <StatBox
          title="Online (web)"
          value={online}
          subtitle={`${percent(online, total)} · IDs start with ONL-`}
          icon={Globe}
          className="border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200"
          iconClassName="bg-blue-500/20 text-blue-600"
        />
        <StatBox
          title="Center"
          value={offline}
          subtitle={`${percent(offline, total)} · Center / offline IDs`}
          icon={Building2}
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          iconClassName="bg-amber-500/20 text-amber-600"
        />
        <StatBox
          title="Device linked"
          value={deviceLinked}
          subtitle={`${percent(deviceLinked, total)} of roster`}
          icon={Smartphone}
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          iconClassName="bg-emerald-500/20 text-emerald-600"
        />
        <StatBox
          title="Blocked"
          value={blocked}
          subtitle="Cannot sign in"
          icon={Ban}
          className="border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          iconClassName="bg-rose-500/20 text-rose-600"
        />
        <StatBox
          title="With credit"
          value={withCredit}
          subtitle="Balance greater than 0"
          icon={Wallet}
          className="border-color2/30 bg-color2/10 text-foreground"
          iconClassName="bg-color2/20 text-color2"
        />
        <StatBox
          title="With apples"
          value={withApples}
          subtitle="Current apple balance > 0"
          icon={Apple}
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          iconClassName="bg-emerald-500/20 text-emerald-600"
        />
        <StatBox
          title="Web share"
          value={percent(online, total)}
          subtitle={`${online} of ${total} students`}
          icon={GraduationCap}
          className="border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
          iconClassName="bg-indigo-500/20 text-indigo-600"
        />
      </div>

      {byLevel.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {byLevel.map((bucket) => {
            const isActive = selectedLevel === bucket.level;
            return (
              <button
                key={bucket.level}
                type="button"
                onClick={() =>
                  onSelectLevel(isActive ? "all" : bucket.level)
                }
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-color2/40 bg-color2/10"
                    : "border-color2/10 bg-muted/30 hover:border-color2/25 hover:bg-muted/50"
                )}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {LEVEL_LABELS[bucket.level] ?? bucket.level}
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight">
                  {bucket.total}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bucket.online} web · {bucket.offline} center
                </p>
              </button>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
