import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllStudents, useGetStudentLectures } from "@/generated/api";
import { SingleStudent, StudentLevel } from "@/generated/model";
import { createGrantedAccessColumns } from "@/pages/dashboard/granted-access/columns";
import { PaginationState } from "@tanstack/react-table";
import { Gift, Search, User, X } from "lucide-react";
import { useMemo, useState } from "react";

const levelMap: Record<StudentLevel, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
};

const GrantedAccessPage = () => {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<SingleStudent | null>(
    null
  );
  const [lectureSearch, setLectureSearch] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: studentsData, isLoading: studentsLoading } = useGetAllStudents(
    { page: 1, pageSize: 50, search: studentSearch },
    { query: { enabled: !selectedStudent } }
  );

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

  const handleSelectStudent = (studentId: string) => {
    const student = studentsData?.data?.items?.find((s) => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setStudentSearch("");
      setLectureSearch("");
      setPagination({ pageIndex: 0, pageSize: 10 });
    }
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
      <DashboardCard>
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-color2" />
          Select Student
        </div>

        {selectedStudent ? (
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-color2/10 bg-color2/5 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="font-medium">{selectedStudent.fullName}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>ID: {selectedStudent.studentCode}</span>
                <Badge variant="outline" className="border-color2/20">
                  {levelMap[selectedStudent.level]}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearStudent}
              className="gap-2 border-color2/20"
            >
              <X className="h-4 w-4" />
              Change Student
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, or student ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            {studentsLoading ? (
              <Loading />
            ) : (
              <Select onValueChange={handleSelectStudent}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Choose a student from results" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData?.data?.items?.length ? (
                    studentsData.data.items.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.fullName} — {student.studentCode} (
                        {levelMap[student.level]})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {studentSearch
                        ? "No students found"
                        : "Type to search for students"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </DashboardCard>

      {selectedStudent && (
        <DashboardCard>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">
              Lectures for {levelMap[selectedStudent.level]}
            </h3>
            <Input
              className="max-w-xs"
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
