import {
  CallCenterStudent,
  buildCallCenterWhatsAppMessage,
  openWhatsApp,
  resolveCallCenterStudyMode,
  useCallCenterHistoryQuery,
  useCallCenterStudentsQuery,
  useRecordCallCenterNotifyMutation,
  useSetCallCenterStudentBlockedMutation,
  useUpsertCallCenterStudentMutation,
} from "@/api/call-center-api";
import { useCoursesQuery } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetCourse } from "@/generated/api";
import { Permission, StudentLevel } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import useDownloadFile from "@/hooks/useDownloadFile";
import { toast } from "@/lib/utils";
import {
  Ban,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  History,
  Loader2,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const LEVEL_LABELS: Record<string, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
  Level4: "3rd Secondary Adby",
};

function formatScore(value?: number | null) {
  return value == null ? "—" : String(value);
}

const CallCenterPage = () => {
  const [level, setLevel] = useState<StudentLevel | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [lectureId, setLectureId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attendance, setAttendance] = useState<"all" | "present" | "absent">(
    "all"
  );
  const [calledFilter, setCalledFilter] = useState<
    "all" | "called" | "not-called"
  >("all");
  const [studyModeFilter, setStudyModeFilter] = useState<
    "all" | "online" | "offline"
  >("all");
  const [page, setPage] = useState(1);
  const { download, isDownloading } = useDownloadFile();

  const { data: coursesData, isLoading: coursesLoading } = useCoursesQuery();
  const { data: courseData, isLoading: courseLoading } = useGetCourse(
    courseId as string,
    { query: { enabled: !!courseId } }
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setCourseId(undefined);
    setLectureId(undefined);
    setPage(1);
  }, [level]);

  useEffect(() => {
    setLectureId(undefined);
    setPage(1);
  }, [courseId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, attendance, calledFilter, studyModeFilter, lectureId]);

  const courses = useMemo(() => {
    const items = coursesData?.data?.items ?? [];
    return items.filter((item) => !level || item.level === level);
  }, [coursesData, level]);

  const lectures = useMemo(() => {
    const items = courseData?.data?.items ?? [];
    return items
      .filter((item) => item.type === "Lecture")
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [courseData]);

  const selectedLectureTitle =
    lectures.find((item) => item.id === lectureId)?.title ?? "Lecture";

  const onExport = async () => {
    if (!courseId || !lectureId) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (attendance !== "all") params.set("attendance", attendance);
    if (calledFilter !== "all") params.set("called", calledFilter);
    if (studyModeFilter !== "all") params.set("studyMode", studyModeFilter);
    const qs = params.toString();
    const safeTitle = selectedLectureTitle
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40);
    await download(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students/export${
        qs ? `?${qs}` : ""
      }`,
      `call-center-${safeTitle || "students"}.csv`
    );
  };

  const studentsQuery = useCallCenterStudentsQuery(
    courseId && lectureId
      ? {
          courseId,
          lectureId,
          search: debouncedSearch || undefined,
          attendance,
          called: calledFilter,
          studyMode: studyModeFilter,
          page,
          pageSize: 50,
        }
      : null
  );

  const uniqueLevels = useMemo(() => {
    const levels = (coursesData?.data?.items ?? []).map((item) => item.level);
    return Array.from(new Set(levels));
  }, [coursesData]);

  if (coursesLoading) return <Loading />;

  const pageData = studentsQuery.data?.data;
  const students = pageData?.items ?? [];

  return (
    <DashboardPageShell
      title="Call Center"
      description="Pick level, course, and lecture — then call parents with attendance and scores ready."
      icon={Phone}
    >
      <DashboardCard>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Level</p>
            <Select
              value={level}
              onValueChange={(value) => setLevel(value as StudentLevel)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Levels</SelectLabel>
                  {uniqueLevels.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {LEVEL_LABELS[lvl] ?? lvl}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Course</p>
            <Select
              value={courseId}
              onValueChange={setCourseId}
              disabled={!level}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Lecture</p>
            <Select
              value={lectureId}
              onValueChange={setLectureId}
              disabled={!courseId || courseLoading}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select lecture" />
              </SelectTrigger>
              <SelectContent>
                {lectures.map((lecture) => (
                  <SelectItem key={lecture.id} value={lecture.id}>
                    {lecture.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardCard>

      {courseId && lectureId && (
        <DashboardCard className="mt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              className="w-full sm:max-w-xs"
              placeholder="Search name, code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={attendance}
              onValueChange={(value) =>
                setAttendance(value as "all" | "present" | "absent")
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All attendance</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={calledFilter}
              onValueChange={(value) =>
                setCalledFilter(value as "all" | "called" | "not-called")
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Called" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All calls</SelectItem>
                <SelectItem value="called">Called</SelectItem>
                <SelectItem value="not-called">Not called</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={studyModeFilter}
              onValueChange={(value) =>
                setStudyModeFilter(value as "all" | "online" | "offline")
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Study mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="online">Online (ONL-)</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isDownloading || studentsQuery.isLoading}
              onClick={onExport}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Export Excel
            </Button>
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {pageData?.totalCount ?? 0} students
            </p>
          </div>

          {studentsQuery.isLoading || courseLoading ? (
            <Loading />
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students found for this filter.
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <CallCenterStudentCard
                  key={student.id}
                  student={student}
                  courseId={courseId}
                  lectureId={lectureId}
                  lectureTitle={selectedLectureTitle}
                />
              ))}
            </div>
          )}

          {pageData && pageData.totalCount > pageData.pageSize && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={!pageData.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pageData.page}
              </span>
              <Button
                variant="outline"
                disabled={!pageData.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </DashboardCard>
      )}
    </DashboardPageShell>
  );
};

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function CallCenterStudentCard({
  student,
  courseId,
  lectureId,
  lectureTitle,
}: {
  student: CallCenterStudent;
  courseId: string;
  lectureId: string;
  lectureTitle: string;
}) {
  const { hasPermission } = useDashboardPermissions();
  const canViewHistory = hasPermission(Permission.ViewCallCenterHistory);
  const upsert = useUpsertCallCenterStudentMutation();
  const recordNotify = useRecordCallCenterNotifyMutation();
  const setBlocked = useSetCallCenterStudentBlockedMutation();
  const [comment, setComment] = useState(student.comment ?? "");
  const [called, setCalled] = useState(student.called);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  const historyQuery = useCallCenterHistoryQuery(
    { courseId, lectureId, studentId: student.id },
    historyOpen && canViewHistory
  );

  useEffect(() => {
    setComment(student.comment ?? "");
    setCalled(student.called);
  }, [student.comment, student.called, student.id]);

  const saveComment = () => {
    upsert.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        comment,
        called,
      },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: `Updated ${student.fullName}` });
        },
        onError: () => {
          toast({
            title: "Save failed",
            description: "Could not update call log.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const toggleCalled = (next: boolean) => {
    setCalled(next);
    upsert.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        comment,
        called: next,
      },
      {
        onError: () => {
          setCalled(!next);
          toast({
            title: "Update failed",
            description: "Could not update called flag.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const notify = (language: "ar" | "en") => {
    const message = buildCallCenterWhatsAppMessage(
      { ...student, comment, called },
      lectureTitle,
      language
    );
    const opened = openWhatsApp(student.parentPhoneNumber, message);
    if (!opened) {
      toast({
        title: "Invalid parent phone",
        description: "Cannot open WhatsApp for this number.",
        variant: "destructive",
      });
      return;
    }

    recordNotify.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        comment,
      },
      {
        onSuccess: () => {
          toast({
            title: "Notify recorded",
            description: `Logged WhatsApp notify for ${student.fullName}`,
          });
        },
      }
    );
    setNotifyOpen(false);
  };

  const confirmBlockToggle = () => {
    const nextBlocked = !student.isBlocked;
    setBlocked.mutate(
      { studentId: student.id, isBlocked: nextBlocked },
      {
        onSuccess: () => {
          setBlockConfirmOpen(false);
          toast({
            title: nextBlocked ? "Student blocked" : "Student unblocked",
            description: nextBlocked
              ? `${student.fullName} can no longer sign in.`
              : `${student.fullName} can use their account again.`,
          });
        },
        onError: () => {
          toast({
            title: nextBlocked ? "Block failed" : "Unblock failed",
            description: "Could not update student block status.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const historyItems = historyQuery.data?.data ?? [];
  const studyMode = resolveCallCenterStudyMode(student);
  const isOnline = studyMode === "online";
  const isBlocked = student.isBlocked === true;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{student.fullName}</h3>
            <Badge variant="outline">{student.studentCode}</Badge>
            <Badge
              variant="outline"
              className={
                isOnline
                  ? "border-sky-500/50 text-sky-700 dark:text-sky-300"
                  : "border-amber-500/50 text-amber-700 dark:text-amber-300"
              }
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Badge
              className={
                student.attended
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-red-600 hover:bg-red-600"
              }
            >
              {student.attended ? "Present" : "Absent"}
            </Badge>
            {isBlocked && (
              <Badge className="bg-zinc-800 hover:bg-zinc-800 text-white">
                Blocked
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Parent:{" "}
            <span className="font-medium text-foreground">
              {student.parentPhoneNumber || "—"}
            </span>
            {" · "}
            Student: {student.phoneNumber || "—"}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span>
              Essay:{" "}
              <strong>{formatScore(student.homeworkScore)}</strong>
            </span>
            <span>
              Choose:{" "}
              <strong>{formatScore(student.chooseHomeworkScore)}</strong>
            </span>
            <span>
              Quiz: <strong>{formatScore(student.quizScore)}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <Checkbox
              checked={called}
              onCheckedChange={(value) => toggleCalled(value === true)}
              disabled={upsert.isPending}
            />
            Called
          </label>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setNotifyOpen(true)}
            disabled={!student.parentPhoneNumber || recordNotify.isPending}
          >
            <MessageCircle className="h-4 w-4" />
            Notify
          </Button>
          <Button
            type="button"
            variant={isBlocked ? "outline" : "destructive"}
            className="gap-2"
            onClick={() => setBlockConfirmOpen(true)}
            disabled={setBlocked.isPending}
          >
            {setBlocked.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBlocked ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            {isBlocked ? "Unblock" : "Block"}
          </Button>
          {canViewHistory && (
            <Button
              type="button"
              variant="ghost"
              className="gap-2"
              onClick={() => setHistoryOpen((open) => !open)}
            >
              <History className="h-4 w-4" />
              History
              {historyOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Call / notify comment..."
          className="min-h-[72px]"
        />
        <Button
          type="button"
          className="shrink-0 gap-2"
          onClick={saveComment}
          disabled={upsert.isPending}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      {canViewHistory && historyOpen && (
        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-sm font-medium">Call & notify history</p>
          {historyQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : historyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No call or notify history yet.
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {historyItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-border/50 bg-background/80 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        item.actionType === "Notify"
                          ? "border-sky-500/40 text-sky-700 dark:text-sky-300"
                          : "border-amber-500/40 text-amber-700 dark:text-amber-300"
                      }
                    >
                      {item.actionType}
                    </Badge>
                    <span className="font-medium">{item.actorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatHistoryDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {item.comment?.trim() || "No comment"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp notify</DialogTitle>
            <DialogDescription>
              {student.fullName} · {student.studentCode} ·{" "}
              {isOnline ? "Online" : "Offline"}. Opens WhatsApp to the parent
              phone and records who notified with the current comment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => notify("en")}>
              English
            </Button>
            <Button type="button" onClick={() => notify("ar")}>
              العربية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBlocked ? "Unblock student?" : "Block student?"}
            </DialogTitle>
            <DialogDescription>
              {isBlocked
                ? `${student.fullName} (${student.studentCode}) will be able to sign in and use their account again.`
                : `${student.fullName} (${student.studentCode}) will not be able to sign in. They will see: "your account is block and please contact web support".`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockConfirmOpen(false)}
              disabled={setBlocked.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isBlocked ? "default" : "destructive"}
              onClick={confirmBlockToggle}
              disabled={setBlocked.isPending}
            >
              {setBlocked.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBlocked ? (
                "Unblock"
              ) : (
                "Block"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CallCenterPage;
