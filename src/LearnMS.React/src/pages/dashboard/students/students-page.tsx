import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllStudents } from "@/generated/api";
import { StudentLevel } from "@/generated/model";
import useDownloadFile from "@/hooks/useDownloadFile";
import { studentsColumns } from "@/pages/dashboard/students/columns";
import { useModalStore } from "@/store/use-modal-store";
import { PaginationState } from "@tanstack/react-table";
import { Download, Loader2, Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const StudentsPage = () => {
  const { openModal } = useModalStore();
  const { download, isDownloading } = useDownloadFile();
  const [searchParams, setSearchParams] = useSearchParams({});

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

  const onExport = async () => {
    await download(`/api/students/export?level=${level}`, "students.csv");
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
      description="Search, manage, and export your student roster."
      icon={Users}
      actions={
        <Button
          onClick={() => openModal("add-student-modal")}
          className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      }
      fullWidth
    >
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
