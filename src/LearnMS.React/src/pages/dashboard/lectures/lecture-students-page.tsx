import {
  useSyncChooseHomeworkScoresMutation,
} from "@/api/lectures-api";
import {
  AttendLectureResult,
  getLectureStatisticsParams,
  readSelectedCenterId,
  useAttendLectureAtCenter,
  writeCompareChooseHomeworkLectureId,
} from "@/api/centers-api";
import { CenterSelector } from "@/components/dashboard/center-selector";
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
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Settings2 } from "lucide-react";
import Papa from "papaparse";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { DataTable } from "@/components/data-table";
import {
  getGetLectureQueryKey,
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
  useGetCourse,
  useGetLecture,
  useGetLectureStatistics,
  useGetLectureStudents,
  useUpdateLecture,
  useUpdateLectureGrades,
} from "@/generated/api";
import { GetLectureDashboardResult, Permission, StudentGradeItem } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import useDownloadFile from "@/hooks/useDownloadFile";
import { createLectureStudentsColumns } from "@/pages/dashboard/lectures/lecture-students-columns";
import { LectureStudentStats } from "@/pages/dashboard/lectures/lecture-student-stats";
import { useQueryClient } from "@tanstack/react-query";
import { PaginationState } from "@tanstack/react-table";
import { FaBarcode, FaCheck, FaFileExport, FaFileImport } from "react-icons/fa";

const LectureStudentsPage = () => {
  const { courseId, lectureId } = useParams();
  const { hasPermission } = useDashboardPermissions();
  const canOpenDetails = hasPermission(Permission.ManageLecture);

  const { data, isError } = useGetLecture(courseId!, lectureId!);

  if (isError) {
    return;
  }

  const lecture = data?.data!;

  if (lecture?.$type !== "GetLectureDashboardResult") return;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`/dashboard/courses/${courseId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Course
          </Link>
          <span className="truncate text-sm font-semibold">{lecture.title}</span>
        </div>
        {canOpenDetails && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/dashboard/courses/${courseId}/lectures/${lectureId}`}>
              <Settings2 className="h-4 w-4" />
              Details
            </Link>
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <LectureStudentTab lecture={lecture} courseId={courseId!} />
      </div>
    </div>
  );
};

export default LectureStudentsPage;

type TabProps = {
  lecture: GetLectureDashboardResult;
  courseId: string;
};

const LectureStudentTab: React.FC<TabProps> = ({ lecture, courseId }) => {
  const { download, isDownloading } = useDownloadFile();
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(
    () => readSelectedCenterId()
  );
  const [selectedCenterName, setSelectedCenterName] = useState<string>();
  const [compareChooseHomeworkLectureId, setCompareChooseHomeworkLectureId] =
    useState<string | null>(null);
  const [compareLectureInitialized, setCompareLectureInitialized] =
    useState(false);

  const handleCenterChange = useCallback(
    (centerId: string | null, center?: { name: string }) => {
      setSelectedCenterId(centerId);
      setSelectedCenterName(center?.name);
    },
    []
  );

  const qc = useQueryClient();
  const updateLecture = useUpdateLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lecture.id),
        });
        toast({
          title: "Full marks saved",
          description: "You can now enter student scores.",
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const updateLectureGrades = useUpdateLectureGrades({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId, lecture.id),
        });
        qc.invalidateQueries({
          queryKey: getGetLectureStatisticsQueryKey({ lectureId: lecture.id }),
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
        });
      },
    },
  });

  const { data: lectureStatistics, isLoading: lectureStatisticsLoading } =
    useGetLectureStatistics(
      getLectureStatisticsParams(lecture.id, selectedCenterId) as any
    );

  const { data: courseData } = useGetCourse(courseId);
  const gradeLevel =
    courseData?.data?.$type === "GetDashboardCourseResult"
      ? courseData.data.level
      : undefined;

  const courseLectures = useMemo(() => {
    const items =
      courseData?.data?.$type === "GetDashboardCourseResult"
        ? courseData.data.items ?? []
        : [];
    return items
      .filter((item) => item.type === "Lecture")
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [courseData]);

  useEffect(() => {
    if (compareLectureInitialized || courseLectures.length === 0) return;

    const currentOrder =
      courseLectures.find((item) => item.id === lecture.id)?.order ?? null;
    const previous =
      currentOrder == null
        ? undefined
        : [...courseLectures]
            .filter((item) => (item.order ?? 0) < currentOrder)
            .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))[0];

    setCompareChooseHomeworkLectureId(previous?.id ?? lecture.id);
    setCompareLectureInitialized(true);
  }, [compareLectureInitialized, courseLectures, lecture.id]);

  useEffect(() => {
    writeCompareChooseHomeworkLectureId(
      lecture.id,
      compareChooseHomeworkLectureId
    );
  }, [compareChooseHomeworkLectureId, lecture.id]);

  const compareLectureTitle = useMemo(() => {
    if (!compareChooseHomeworkLectureId) return null;
    return (
      courseLectures.find((item) => item.id === compareChooseHomeworkLectureId)
        ?.title ?? null
    );
  }, [compareChooseHomeworkLectureId, courseLectures]);

  const showCompareChooseHomework = !!compareChooseHomeworkLectureId;

  const studentColumns = useMemo(
    () =>
      createLectureStudentsColumns(selectedCenterId, {
        homeworkFullMark: lecture.homeworkFullMark,
        chooseHomeworkFullMark: lecture.chooseHomeworkFullMark,
        quizFullMark: lecture.quizFullMark,
        showCompareChooseHomework,
        compareChooseHomeworkLectureTitle: compareLectureTitle,
      }),
    [
      selectedCenterId,
      lecture.homeworkFullMark,
      lecture.chooseHomeworkFullMark,
      lecture.quizFullMark,
      showCompareChooseHomework,
      compareLectureTitle,
    ]
  );

  const { data: gradeTotalData } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    { page: 1, pageSize: 1 }
  );

  const totalInGrade = gradeTotalData?.data?.totalCount ?? 0;

  const [searchParams, setSearchParams] = useSearchParams();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
    });
  }, [pageIndex, search, pageSize]);
  const { data, isLoading } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      search,
      ...(compareChooseHomeworkLectureId
        ? { compareChooseHomeworkLectureId }
        : {}),
    }
  );

  const onExport = async () => {
    await download(
      `/api/courses/${lecture.courseId}/lectures/${lecture.id}/students/export`,
      "students.csv"
    );
  };

  const onImport = async () => {
    try {
      const [file] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "CSV",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });

      const f = await file.getFile();
      Papa.parse(f, {
        complete(results: any) {
          const codes = results.data
            .filter((x: any) => x[0]) // Ensure the code column exists and is not empty
            .map(([code]: any) => ({ code })); // Create StudentGradeItem objects

          if (codes.length === 0) {
            toast({
              title: "Import Error",
              description: "No valid student codes found in the CSV file.",
            });
            return;
          }

          updateLectureGrades.mutate({
            courseId,
            lectureId: lecture.id,
            data: {
              grades: codes as StudentGradeItem[], // Ensure correct type
            },
          });
        },
        error(err: any) {
          toast({
            title: "Import Error",
            description: `Failed to parse CSV file: ${err.message}`,
          });
        },
      });
    } catch (error: any) {
      toast({
        title: "File Error",
        description: `Failed to open file: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 p-3 sm:p-4">
      <LectureStudentStats
        stats={lectureStatistics?.data}
        isLoading={lectureStatisticsLoading}
        totalInGrade={totalInGrade}
        gradeLevel={gradeLevel}
        filteredCount={data?.data?.totalCount}
        isSearching={!!search.trim()}
        selectedCenterName={selectedCenterName}
      />

      <CenterSelector
        value={selectedCenterId}
        onChange={handleCenterChange}
        className="rounded-xl border border-color2/15 bg-muted/20 p-3"
      />

      <LectureFullMarksForm
        lecture={lecture}
        isSaving={updateLecture.isPending}
        onSave={(data) =>
          updateLecture.mutate({
            courseId,
            lectureId: lecture.id,
            data,
          })
        }
      />

      <ChooseHomeworkSyncButton lecture={lecture} />

      <ChooseHomeworkComparePanel
        lecture={lecture}
        courseLectures={courseLectures}
        selectedSourceLectureId={compareChooseHomeworkLectureId}
        onSourceLectureChange={setCompareChooseHomeworkLectureId}
      />

      {!selectedCenterId && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Select an attendance center before scanning barcodes or marking students
          as attended.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Input
          className="w-full"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AttendInput
            lectureId={lecture.id}
            courseId={lecture.courseId}
            centerId={selectedCenterId}
            compareChooseHomeworkLectureId={compareChooseHomeworkLectureId}
          />
          <Button
            disabled={updateLectureGrades.isPending}
            variant="outline"
            className="w-full border-red-200 text-red-500 sm:w-auto"
            onClick={onImport}
          >
            {updateLectureGrades.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileImport className="h-4 w-4" />
            )}
            <span className="ml-2">Import CSV</span>
          </Button>
          <Button
            disabled={isDownloading}
            variant="outline"
            className="w-full text-primary sm:w-auto"
            onClick={onExport}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileExport className="h-4 w-4" />
            )}
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loading />
        </div>
      ) : (
        <DataTable
          data={data?.data!.items!}
          pagination={{
            hasNextPage: data!.data!.hasNextPage,
            hasPreviousPage: data!.data!.hasPreviousPage,
            pageIndex,
            pageSize,
            pageCount: data!.data!.totalCount,
          }}
          rowCount={data?.data!.totalCount!}
          columns={studentColumns}
          setPagination={setPagination}
        />
      )}
    </div>
  );
};

function LectureFullMarksForm({
  lecture,
  isSaving,
  onSave,
}: {
  lecture: GetLectureDashboardResult;
  isSaving: boolean;
  onSave: (data: {
    homeworkFullMark?: number;
    quizFullMark?: number;
  }) => void;
}) {
  const [homeworkFullMark, setHomeworkFullMark] = useState(
    lecture.homeworkFullMark?.toString() ?? ""
  );
  const [quizFullMark, setQuizFullMark] = useState(
    lecture.quizFullMark?.toString() ?? ""
  );

  useEffect(() => {
    setHomeworkFullMark(lecture.homeworkFullMark?.toString() ?? "");
    setQuizFullMark(lecture.quizFullMark?.toString() ?? "");
  }, [lecture.homeworkFullMark, lecture.quizFullMark]);

  const hw = Number(homeworkFullMark);
  const qz = Number(quizFullMark);
  const hwValid = Number.isFinite(hw) && hw > 0;
  const qzValid = Number.isFinite(qz) && qz > 0;
  const canSave = hwValid || qzValid;

  return (
    <div className="rounded-xl border border-color2/20 bg-color2/5 p-3 sm:p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          Offline score full marks
        </h3>
        <p className="text-xs text-muted-foreground">
          Set Essay and Quiz full marks here. Choose Homework full mark is taken
          automatically from the Google Form quiz points
          {lecture.chooseHomeworkFullMark
            ? ` (currently ${lecture.chooseHomeworkFullMark})`
            : ""}
          .
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Essay Homework full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 20"
            value={homeworkFullMark}
            onChange={(e) => setHomeworkFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Quiz full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 10"
            value={quizFullMark}
            onChange={(e) => setQuizFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <Button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => {
            const data: {
              homeworkFullMark?: number;
              quizFullMark?: number;
            } = {};
            if (hwValid) data.homeworkFullMark = hw;
            if (qzValid) data.quizFullMark = qz;
            onSave(data);
          }}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save full marks"
          )}
        </Button>
      </div>
      {(!lecture.homeworkFullMark || !lecture.quizFullMark) && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Essay and quiz score fields unlock after their full mark is saved.
        </p>
      )}
    </div>
  );
}

function ChooseHomeworkComparePanel({
  lecture,
  courseLectures,
  selectedSourceLectureId,
  onSourceLectureChange,
}: {
  lecture: GetLectureDashboardResult;
  courseLectures: { id: string; title: string; order?: number }[];
  selectedSourceLectureId: string | null;
  onSourceLectureChange: (lectureId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-teal-500/25 bg-teal-500/5 p-3 sm:p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Source Choose Homework
        </h3>
        <p className="text-xs text-muted-foreground">
          Pick a lecture to see who already has Choose Homework scores in the
          Source Choose HW column (Done or Missing).
        </p>
      </div>

      <Select
        value={selectedSourceLectureId ?? undefined}
        onValueChange={onSourceLectureChange}
      >
        <SelectTrigger className="w-full sm:max-w-md">
          <SelectValue placeholder="Select a lecture" />
        </SelectTrigger>
        <SelectContent>
          {courseLectures.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.title}
              {item.id === lecture.id ? " (this lecture)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ChooseHomeworkSyncButton({
  lecture,
}: {
  lecture: GetLectureDashboardResult;
}) {
  const syncMutation = useSyncChooseHomeworkScoresMutation();

  if (!lecture.chooseHomeworkFormId) {
    return (
      <p className="rounded-lg border border-color2/20 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Set a Choose Homework Google Form in lecture details to sync scores.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-color2/20 bg-color2/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Choose Homework sync
        </h3>
        <p className="text-xs text-muted-foreground">
          Pull quiz scores from Google Forms matched by Student ID. Full mark is
          taken automatically from the form quiz points
          {lecture.chooseHomeworkFullMark != null
            ? ` (${lecture.chooseHomeworkFullMark})`
            : ""}
          . Also runs automatically every 15 minutes.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={syncMutation.isPending}
        onClick={() =>
          syncMutation.mutate(
            { courseId: lecture.courseId, lectureId: lecture.id },
            {
              onSuccess: async (res) => {
                const data = res.data;
                toast({
                  title: "Choose Homework synced",
                  description: data
                    ? `Matched ${data.matched}, updated ${data.updated}${
                        data.unmatchedCodes?.length
                          ? `, unmatched: ${data.unmatchedCodes.slice(0, 5).join(", ")}`
                          : ""
                      }`
                    : res.message,
                });
              },
              onError: (error) => {
                toast({
                  title: "Sync failed",
                  description: error.message,
                  variant: "destructive",
                });
              },
            }
          )
        }
      >
        {syncMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Sync Choose Homework
      </Button>
    </div>
  );
}

function AttendInput({
  lectureId,
  courseId,
  centerId,
  compareChooseHomeworkLectureId,
}: {
  lectureId: string;
  courseId: string;
  centerId: string | null;
  compareChooseHomeworkLectureId: string | null;
}) {
  const navigate = useNavigate();
  const [showManual, setShowManual] = useState(false);
  const [code, setCode] = useState("");
  const [lastAttend, setLastAttend] = useState<AttendLectureResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutate: attendLecture, isPending } = useAttendLectureAtCenter({
    mutation: {
      throwOnError: false,
    },
  });

  useEffect(() => {
    if (!showManual) return;
    const timer = setTimeout(() => {
      if (code.length > 0) handleSubmit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, showManual]);

  const handleSubmit = async () => {
    if (!code || !centerId) {
      if (!centerId) {
        toast({
          title: "Select a center",
          description: "Choose an attendance center before marking attendance.",
          variant: "destructive",
        });
      }
      return;
    }

    attendLecture(
      {
        courseId,
        lectureId,
        code,
        centerId,
        compareChooseHomeworkLectureId,
      },
      {
        onSuccess: (data) => {
          const result = data.data ?? null;
          setLastAttend(result);
          const chooseHwDone =
            result?.isChooseHomeworkDone ??
            result?.compareChooseHomeworkScore != null;
          const sourceTitle =
            result?.compareChooseHomeworkLectureTitle ?? "Source Choose HW";
          toast({
            title: data.message ?? "Student attended successfully",
            description: chooseHwDone
              ? `${sourceTitle}: Done`
              : `${sourceTitle}: Missing`,
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStatisticsQueryKey(
              getLectureStatisticsParams(lectureId, centerId) as any
            ),
          });
          setCode("");
          inputRef.current?.focus();
        },
        onError: (_) => {
          setCode("");
          inputRef.current?.focus();
        },
      }
    );
  };

  const chooseHwDone =
    lastAttend?.isChooseHomeworkDone ??
    lastAttend?.compareChooseHomeworkScore != null;
  const sourceTitle =
    lastAttend?.compareChooseHomeworkLectureTitle ?? "Source Choose HW";

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <Button
          className="w-full gap-2 bg-gradient-to-r from-color1 to-color2 sm:w-auto"
          disabled={!centerId}
          onClick={() =>
            navigate(
              `/dashboard/courses/${courseId}/lectures/${lectureId}/scan`
            )
          }
        >
          <FaBarcode className="h-4 w-4" />
          Scan Barcode
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setShowManual((state) => !state)}
        >
          {showManual ? "Hide Manual" : "Manual Entry"}
        </Button>
        {showManual && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              ref={inputRef}
              type="text"
              className="w-full text-primary sm:w-[200px]"
              placeholder="Student code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={isPending}
              className="shrink-0"
            >
              <FaCheck className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {lastAttend && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium text-foreground">
            {lastAttend.fullName} attended
          </span>
          <Badge
            className={
              chooseHwDone
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-red-600 hover:bg-red-600"
            }
          >
            {sourceTitle}: {chooseHwDone ? "Done" : "Missing"}
            {chooseHwDone && lastAttend.compareChooseHomeworkScore != null
              ? ` (${lastAttend.compareChooseHomeworkScore})`
              : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}

