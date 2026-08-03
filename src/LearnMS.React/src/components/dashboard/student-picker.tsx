import Loading from "@/components/loading/loading";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetAllStudents } from "@/generated/api";
import { SingleStudent, StudentLevel } from "@/generated/model";
import { cn } from "@/lib/utils";
import { Search, User, X } from "lucide-react";
import { useState } from "react";

export const levelMap: Record<StudentLevel, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
  Level4: "3rd Secondary Adby",
};

type StudentPickerProps = {
  selectedStudent: SingleStudent | null;
  onSelectStudent: (student: SingleStudent) => void;
  onClearStudent: () => void;
};

export function StudentPicker({
  selectedStudent,
  onSelectStudent,
  onClearStudent,
}: StudentPickerProps) {
  const [studentSearch, setStudentSearch] = useState("");

  const { data: studentsData, isLoading: studentsLoading } = useGetAllStudents(
    { page: 1, pageSize: 50, search: studentSearch },
    { query: { enabled: !selectedStudent } }
  );

  const students = studentsData?.data?.items ?? [];

  const handleSelectStudent = (student: SingleStudent) => {
    onSelectStudent(student);
    setStudentSearch("");
  };

  return (
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
            onClick={onClearStudent}
            className="gap-2 border-color2/20"
          >
            <X className="h-4 w-4" />
            Change Student
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or student ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              autoFocus
            />
          </div>

          {studentsLoading ? (
            <Loading />
          ) : students.length > 0 ? (
            <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-xl border border-color2/10">
              {students.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-color2/10 focus-visible:bg-color2/10 focus-visible:outline-none"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {student.fullName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        ID: {student.studentCode}
                        {student.email ? ` · ${student.email}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-color2/20"
                    >
                      {levelMap[student.level]}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              {studentSearch.trim()
                ? "No students found"
                : "Type a name, email, or student ID to search"}
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
