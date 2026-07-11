import { DataTable } from "@/components/data-table";
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
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa";
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
    <div className="relative flex flex-col w-full h-full p-2 sm:p-4 text-foreground">
      {/* Header Section - Responsive Layout */}
      <div className="flex flex-col gap-4 w-full mb-4">
        {/* Top Row - Add Student Button and Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between w-full">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => openModal("add-student-modal")}
              className="transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Plus className="mr-2 w-4 h-4" /> 
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Input
              className="w-full sm:w-64"
              placeholder="Search for a student"
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>

          {/* Controls Row - Export and Level Filter */}
          <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Button
              disabled={isDownloading}
              variant="outline"
              className="h-8 text-primary w-full sm:w-auto"
              onClick={onExport}
            >
              {(!isDownloading && <FaFileExport className="w-4 h-4" />) || (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className="ml-2 hidden sm:inline">Export</span>
            </Button>
            <Select onValueChange={setLevel} value={level}>
              <SelectTrigger className="h-8 w-full sm:w-40">
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>All</SelectItem>
                <SelectItem value={StudentLevel.Level0}>3rd Prep</SelectItem>
                <SelectItem value={StudentLevel.Level1}>1st Secondary</SelectItem>
                <SelectItem value={StudentLevel.Level2}>2nd Secondary</SelectItem>
                <SelectItem value={StudentLevel.Level3}>3rd Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto w-full">
          <div className="min-w-[1200px]">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
