import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    {
      page: 1,
      pageSize: 50,
      search: studentSearch,
    },
    { query: { enabled: !selectedStudent } }
  );

  const { data: lecturesData, isLoading: lecturesLoading } =
    useGetStudentLectures(
      selectedStudent?.id ?? "",
      {
        page: pageIndex + 1,
        pageSize,
        search: lectureSearch,
      },
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
    <div className="flex flex-col w-full h-full p-2 sm:p-4 gap-4 text-foreground">
      <div className="flex items-center gap-2">
        <Gift className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Granted Access</h1>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Select a student, then grant free lecture access. Only lectures matching
        the student&apos;s grade level are shown.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Student
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedStudent ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="font-medium">{selectedStudent.fullName}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {selectedStudent.studentCode}</span>
                  <Badge variant="outline">
                    {levelMap[selectedStudent.level]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearStudent}
                className="gap-2 shrink-0"
              >
                <X className="w-4 h-4" />
                Change Student
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">
                Lectures for {levelMap[selectedStudent.level]}
              </CardTitle>
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
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GrantedAccessPage;
