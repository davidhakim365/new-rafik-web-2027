import { DashboardCard } from "@/components/dashboard/dashboard-card";
import Loading from "@/components/loading/loading";
import { cn } from "@/lib/utils";
import {
  GetLectureStatisticsResponse,
  StudentLevel,
} from "@/generated/model";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Globe,
  GraduationCap,
  Users,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const levelMap: Record<StudentLevel, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
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
        {subtitle && (
          <p className="text-xs opacity-70">{subtitle}</p>
        )}
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

function ProgressStat({
  label,
  value,
  total,
  barClass,
  labelClass,
}: {
  label: string;
  value: number;
  total: number;
  barClass: string;
  labelClass: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", labelClass)}>{label}</span>
        <span className="font-semibold">
          {value} / {total} ({percent}%)
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type LectureStudentStatsProps = {
  stats?: GetLectureStatisticsResponse;
  isLoading: boolean;
  totalInGrade: number;
  gradeLevel?: StudentLevel;
  filteredCount?: number;
  isSearching?: boolean;
  selectedCenterName?: string;
};

export function LectureStudentStats({
  stats,
  isLoading,
  totalInGrade,
  gradeLevel,
  filteredCount,
  isSearching,
  selectedCenterName,
}: LectureStudentStatsProps) {
  if (isLoading) {
    return (
      <DashboardCard padding="sm">
        <Loading />
      </DashboardCard>
    );
  }

  const attended = stats?.attendedStudents ?? 0;
  const enrolled = stats?.enrolledStudents ?? 0;
  const notAttended = Math.max(totalInGrade - attended, 0);
  const notEnrolled = Math.max(totalInGrade - enrolled, 0);
  const avgHomework = stats?.averageHomeworksScore ?? 0;
  const avgQuiz = stats?.averageQuizzesScore ?? 0;

  return (
    <DashboardCard padding="sm" spotlight={false}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lecture Overview</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCenterName
              ? `Attendance stats for ${selectedCenterName}`
              : gradeLevel
                ? `All ${levelMap[gradeLevel]} students for this lecture`
                : "Students matching this lecture grade"}
          </p>
        </div>
        {isSearching && filteredCount !== undefined && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Showing {filteredCount} search results
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatBox
          title="Total in Grade"
          value={totalInGrade}
          subtitle={
            gradeLevel ? levelMap[gradeLevel] : "Students at this level"
          }
          icon={Users}
          className="border-slate-500/25 bg-slate-500/10 text-slate-800 dark:text-slate-100"
          iconClassName="bg-slate-500/20 text-slate-600 dark:text-slate-300"
        />
        <StatBox
          title="Center Attended"
          value={attended}
          subtitle={`${notAttended} not yet attended`}
          icon={CheckCircle}
          className="border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
          iconClassName="bg-green-500/20 text-green-600"
        />
        <StatBox
          title="Not Attended"
          value={notAttended}
          subtitle="Still need center check-in"
          icon={Circle}
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          iconClassName="bg-amber-500/20 text-amber-600"
        />
        <StatBox
          title="Online Enrolled"
          value={enrolled}
          subtitle={`${notEnrolled} without access`}
          icon={Globe}
          className="border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200"
          iconClassName="bg-blue-500/20 text-blue-600"
        />
        <StatBox
          title="Not Enrolled"
          value={notEnrolled}
          subtitle="No active online access"
          icon={Circle}
          className="border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          iconClassName="bg-rose-500/20 text-rose-600"
        />
        <StatBox
          title="Avg Homework"
          value={avgHomework.toFixed(1)}
          subtitle="Class average score"
          icon={BookOpen}
          className="border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-200"
          iconClassName="bg-purple-500/20 text-purple-600"
        />
        <StatBox
          title="Avg Quiz"
          value={avgQuiz.toFixed(1)}
          subtitle="Class average score"
          icon={GraduationCap}
          className="border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
          iconClassName="bg-indigo-500/20 text-indigo-600"
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-xl border border-color2/10 bg-muted/30 p-4 sm:grid-cols-2">
        <ProgressStat
          label="Center attendance rate"
          value={attended}
          total={totalInGrade}
          barClass="bg-gradient-to-r from-green-500 to-emerald-400"
          labelClass="text-green-700 dark:text-green-300"
        />
        <ProgressStat
          label="Online enrollment rate"
          value={enrolled}
          total={totalInGrade}
          barClass="bg-gradient-to-r from-blue-500 to-cyan-400"
          labelClass="text-blue-700 dark:text-blue-300"
        />
      </div>
    </DashboardCard>
  );
}
