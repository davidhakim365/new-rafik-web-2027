import {
  useStudentRegistrationSettingsQuery,
  useStudentRosterStatisticsQuery,
  useUpdateStudentRegistrationSettingsMutation,
} from "@/api/students-api";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useGetAllStudents } from "@/generated/api";
import { StudentLevel } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { Permission } from "@/generated/model";
import useDownloadFile from "@/hooks/useDownloadFile";
import { studentsColumns } from "@/pages/dashboard/students/columns";
import { StudentRosterStats } from "@/pages/dashboard/students/student-roster-stats";
import { PaginationState } from "@tanstack/react-table";
import { Apple, Download, Loader2, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const StudentsPage = () => {
  const { hasPermission } = useDashboardPermissions();
  const canScanApples = hasPermission(Permission.ManageStudentApples);
  const { download, isDownloading } = useDownloadFile();
  const [searchParams, setSearchParams] = useSearchParams({});
  const { data: registrationSettings, isLoading: settingsLoading } =
    useStudentRegistrationSettingsQuery();
  const updateRegistrationSettings =
    useUpdateStudentRegistrationSettingsMutation();

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: parseInt(searchParams.get("page") || "1") - 1,
    pageSize: parseInt(searchParams.get("pageSize") || "10"),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "all");
  const { data: students, isLoading } = useGetAllStudents({
    page: pageIndex + 1,
    pageSize,
    search,
    level: level as StudentLevel,
  });
  const { data: rosterStats, isLoading: statsLoading } =
    useStudentRosterStatisticsQuery(level);

  const isSignupEnabled =
    registrationSettings?.data?.isSignupEnabled ?? true;

  const onExport = async () => {
    await download(`/api/students/export?level=${level}`, "students.csv");
  };

  const onToggleSignup = (enabled: boolean) => {
    updateRegistrationSettings.mutate(
      { isSignupEnabled: enabled },
      {
        onSuccess: () => {
          toast({
            title: enabled ? "Student sign-up enabled" : "Student sign-up disabled",
            description: enabled
              ? "Students can create accounts from the website again."
              : "Students can no longer sign up. Only assistants can add accounts.",
          });
        },
      }
    );
  };

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
      ...(level ? { level } : {}),
    });
  }, [pageIndex, pageSize, search, level]);

  return (
    <DashboardPageShell
      title="Students"
      description="Search, manage, and export your student roster. Overview counts web (ONL-) and center students."
      icon={Users}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-color2/15 bg-background/80 px-3 py-2">
            <div className="min-w-0">
              <Label htmlFor="student-signup-toggle" className="text-sm font-medium">
                Student sign-up
              </Label>
              <p className="text-xs text-muted-foreground">
                {isSignupEnabled
                  ? "Students can create accounts online"
                  : "Only assistants can add students"}
              </p>
            </div>
            {settingsLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="student-signup-toggle"
                checked={isSignupEnabled}
                disabled={updateRegistrationSettings.isPending}
                onCheckedChange={onToggleSignup}
              />
            )}
          </div>
          {canScanApples && (
            <Button
              asChild
              variant="outline"
              className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              <Link to="/dashboard/student-apples-scanner">
                <Apple className="size-4" />
                Apple Scanner
              </Link>
            </Button>
          )}
        </div>
      }
      fullWidth
    >
      <StudentRosterStats
        stats={rosterStats?.data}
        isLoading={statsLoading}
        selectedLevel={level}
        onSelectLevel={(nextLevel) => {
          setLevel(nextLevel);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
      />

      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search students..."
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={isDownloading}
              variant="outline"
              className="border-color2/20"
              onClick={onExport}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2">Export</span>
            </Button>
            <Select onValueChange={setLevel} value={level}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value={StudentLevel.Level0}>3rd Prep</SelectItem>
                <SelectItem value={StudentLevel.Level1}>1st Secondary</SelectItem>
                <SelectItem value={StudentLevel.Level2}>2nd Secondary</SelectItem>
                <SelectItem value={StudentLevel.Level3}>3rd Secondary</SelectItem>
                <SelectItem value={StudentLevel.Level4}>3rd Secondary Adby</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <DataTable
              pagination={{
                hasNextPage: students?.data!.hasNextPage!,
                hasPreviousPage: students?.data!.hasPreviousPage!,
                pageCount: students?.data!.totalCount!,
                pageIndex,
                pageSize,
              }}
              rowCount={students?.data!.totalCount!}
              setPagination={setPagination}
              data={students?.data!.items!}
              columns={studentsColumns}
            />
        )}
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default StudentsPage;
