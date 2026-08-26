import { useGetCenters } from "@/api/centers-api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export type AttendanceFilter = "all" | "attended" | "absent";
export type TriFilter = "all" | "yes" | "no";
export type ScoreFilter = "all" | "scored" | "missing";
export type SourceHwFilter = "all" | "done" | "missing";
export type StudyModeFilter = "all" | "online" | "offline";

export type LectureStudentFilters = {
  attendance: AttendanceFilter;
  centerId: string | null;
  enrolled: TriFilter;
  essay: ScoreFilter;
  chooseHw: ScoreFilter;
  quiz: ScoreFilter;
  sourceHw: SourceHwFilter;
  studyMode: StudyModeFilter;
};

export const DEFAULT_LECTURE_STUDENT_FILTERS: LectureStudentFilters = {
  attendance: "all",
  centerId: null,
  enrolled: "all",
  essay: "all",
  chooseHw: "all",
  quiz: "all",
  sourceHw: "all",
  studyMode: "all",
};

export function lectureStudentFiltersAreActive(filters: LectureStudentFilters) {
  return (
    filters.attendance !== "all" ||
    !!filters.centerId ||
    filters.enrolled !== "all" ||
    filters.essay !== "all" ||
    filters.chooseHw !== "all" ||
    filters.quiz !== "all" ||
    filters.sourceHw !== "all" ||
    filters.studyMode !== "all"
  );
}

function triToBool(value: TriFilter): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function scoreToBool(value: ScoreFilter): boolean | undefined {
  if (value === "scored") return true;
  if (value === "missing") return false;
  return undefined;
}

export function lectureStudentFiltersToQuery(filters: LectureStudentFilters) {
  return {
    ...(filters.centerId
      ? { centerId: filters.centerId }
      : filters.attendance === "attended"
        ? { attended: true }
        : filters.attendance === "absent"
          ? { attended: false }
          : {}),
    ...(triToBool(filters.enrolled) != null
      ? { enrolled: triToBool(filters.enrolled) }
      : {}),
    ...(scoreToBool(filters.essay) != null
      ? { hasEssayScore: scoreToBool(filters.essay) }
      : {}),
    ...(scoreToBool(filters.chooseHw) != null
      ? { hasChooseHomeworkScore: scoreToBool(filters.chooseHw) }
      : {}),
    ...(scoreToBool(filters.quiz) != null
      ? { hasQuizScore: scoreToBool(filters.quiz) }
      : {}),
    ...(filters.sourceHw === "done"
      ? { hasSourceChooseHomework: true }
      : filters.sourceHw === "missing"
        ? { hasSourceChooseHomework: false }
        : {}),
    ...(filters.studyMode !== "all" ? { studyMode: filters.studyMode } : {}),
  };
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs",
        active && "bg-gradient-to-r from-color1 to-color2 text-white"
      )}
    >
      {children}
    </Button>
  );
}

type LectureStudentsFiltersProps = {
  value: LectureStudentFilters;
  onChange: (next: LectureStudentFilters) => void;
  showSourceChooseHomework?: boolean;
};

export function LectureStudentsFilters({
  value,
  onChange,
  showSourceChooseHomework,
}: LectureStudentsFiltersProps) {
  const { data } = useGetCenters();
  const centers = data?.data ?? [];
  const active = lectureStudentFiltersAreActive(value);

  const patch = (partial: Partial<LectureStudentFilters>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="space-y-3 rounded-xl border border-color2/15 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filters
        </p>
        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onChange(DEFAULT_LECTURE_STUDENT_FILTERS)}
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip
          active={value.attendance === "all" && !value.centerId}
          onClick={() => patch({ attendance: "all", centerId: null })}
        >
          All
        </Chip>
        <Chip
          active={value.attendance === "attended" && !value.centerId}
          onClick={() => patch({ attendance: "attended", centerId: null })}
        >
          Attended
        </Chip>
        <Chip
          active={value.attendance === "absent"}
          onClick={() => patch({ attendance: "absent", centerId: null })}
        >
          Absent
        </Chip>
        {centers.map((center) => (
          <Chip
            key={center.id}
            active={value.centerId === center.id}
            onClick={() =>
              patch({ attendance: "attended", centerId: center.id })
            }
          >
            Attended at {center.name}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Select
          value={value.enrolled}
          onValueChange={(enrolled) => patch({ enrolled: enrolled as TriFilter })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Enrollment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All enrollment</SelectItem>
            <SelectItem value="yes">Enrolled</SelectItem>
            <SelectItem value="no">Not enrolled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.studyMode}
          onValueChange={(studyMode) =>
            patch({ studyMode: studyMode as StudyModeFilter })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Study mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            <SelectItem value="online">Online (ONL-)</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.essay}
          onValueChange={(essay) => patch({ essay: essay as ScoreFilter })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Essay HW" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All essay HW</SelectItem>
            <SelectItem value="scored">Essay scored</SelectItem>
            <SelectItem value="missing">Essay missing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.chooseHw}
          onValueChange={(chooseHw) =>
            patch({ chooseHw: chooseHw as ScoreFilter })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choose HW" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All choose HW</SelectItem>
            <SelectItem value="scored">Choose HW scored</SelectItem>
            <SelectItem value="missing">Choose HW missing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.quiz}
          onValueChange={(quiz) => patch({ quiz: quiz as ScoreFilter })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Quiz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All quizzes</SelectItem>
            <SelectItem value="scored">Quiz scored</SelectItem>
            <SelectItem value="missing">Quiz missing</SelectItem>
          </SelectContent>
        </Select>

        {showSourceChooseHomework && (
          <Select
            value={value.sourceHw}
            onValueChange={(sourceHw) =>
              patch({ sourceHw: sourceHw as SourceHwFilter })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Source Choose HW" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All source Choose HW</SelectItem>
              <SelectItem value="done">Source Choose HW done</SelectItem>
              <SelectItem value="missing">Source Choose HW missing</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
