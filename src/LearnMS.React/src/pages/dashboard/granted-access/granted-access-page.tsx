import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import {
  levelMap,
  StudentPicker,
} from "@/components/dashboard/student-picker";
import Loading from "@/components/loading/loading";
import { Input } from "@/components/ui/input";
import { useGetStudentLectures } from "@/generated/api";
import { SingleStudent } from "@/generated/model";
import { createGrantedAccessColumns } from "@/pages/dashboard/granted-access/columns";
import { PaginationState } from "@tanstack/react-table";
import { Gift } from "lucide-react";
import { useMemo, useState } from "react";

const GrantedAccessPage = () => {
  const [selectedStudent, setSelectedStudent] = useState<SingleStudent | null>(
    null
  );
  const [lectureSearch, setLectureSearch] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: lecturesData, isLoading: lecturesLoading } =
    useGetStudentLectures(
      selectedStudent?.id ?? "",
      { page: pageIndex + 1, pageSize, search: lectureSearch },
      { query: { enabled: !!selectedStudent } }
    );

  const columns = useMemo(
    () =>
      selectedStudent
        ? createGrantedAccessColumns(
            selectedStudent.id,
            lectureSearch,
            pageIndex,
            pageSize
          )
        : [],
    [selectedStudent, lectureSearch, pageIndex, pageSize]
  );

  const handleSelectStudent = (student: SingleStudent) => {
    setSelectedStudent(student);
    setLectureSearch("");
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setLectureSearch("");
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  return (
    <DashboardPageShell
      title="Granted Access"
      description="Select a student and grant free lecture access matching their grade level."
      icon={Gift}
      fullWidth
    >
      <StudentPicker
        selectedStudent={selectedStudent}
        onSelectStudent={handleSelectStudent}
        onClearStudent={handleClearStudent}
      />

      {selectedStudent && (
        <DashboardCard>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">
              Lectures for {levelMap[selectedStudent.level]}
            </h3>
            <Input
              className="w-full max-w-xs"
              placeholder="Search lectures..."
              value={lectureSearch}
              onChange={(e) => {
                setLectureSearch(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          </div>
          {lecturesLoading ? (
            <Loading />
          ) : (
            <DataTable
              data={lecturesData?.data?.items ?? []}
              columns={columns}
              setPagination={setPagination}
              pagination={{
                pageCount: lecturesData?.data?.totalCount ?? 0,
                pageSize,
                pageIndex,
                hasPreviousPage: lecturesData?.data?.hasPreviousPage ?? false,
                hasNextPage: lecturesData?.data?.hasNextPage ?? false,
              }}
            />
          )}
        </DashboardCard>
      )}
    </DashboardPageShell>
  );
};

export default GrantedAccessPage;
