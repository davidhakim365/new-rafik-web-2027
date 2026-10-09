import {
  DiscountLectureOption,
  DiscountTarget,
  LectureDiscountCandidate,
  LectureStudentDiscountItem,
  useAssignLectureStudentDiscountsMutation,
  useDeleteLectureStudentDiscountMutation,
  useDiscountLecturesQuery,
  useLectureDiscountCandidatesQuery,
  useLectureStudentDiscountsQuery,
  useUpdateLectureStudentDiscountMutation,
} from "@/api/discounts-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { levelMap } from "@/components/dashboard/student-picker";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const APPLIES_OPTIONS: { value: DiscountTarget; label: string }[] = [
  { value: "Lecture", label: "Lecture price" },
  { value: "Renewal", label: "Renewal price" },
  { value: "Both", label: "Lecture and renewal" },
];

function appliesLabel(value: DiscountTarget) {
  return APPLIES_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function chargedPrice(price: number, percentage: number) {
  return Math.round(price * (100 - percentage) * 100) / 10000;
}

export function LectureDiscountsPanel() {
  const { data: lecturesData, isLoading: lecturesLoading } = useDiscountLecturesQuery();
  const lectures = lecturesData?.data ?? [];
  const [lectureId, setLectureId] = useState<string>("");
  const [minAttendance, setMinAttendance] = useState("1");
  const [studyMode, setStudyMode] = useState<"all" | "online" | "offline">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, LectureDiscountCandidate>>({});
  const [percentage, setPercentage] = useState("20");
  const [appliesTo, setAppliesTo] = useState<DiscountTarget>("Lecture");
  const [savedPage, setSavedPage] = useState(1);

  const lecture = lectures.find((item) => item.id === lectureId) ?? null;
  const minimum = Number(minAttendance);
  const minValid = Number.isInteger(minimum) && minimum >= 0;
  const parsedPercentage = Number(percentage);
  const percentageValid =
    Number.isFinite(parsedPercentage) && parsedPercentage > 0 && parsedPercentage <= 100;

  const { data: candidatesData, isLoading: candidatesLoading } =
    useLectureDiscountCandidatesQuery(lectureId || null, {
      page,
      pageSize: 20,
      search,
      minAttendance: minValid ? minimum : 0,
      studyMode,
    });
  const candidates = candidatesData?.data;

  const { data: savedData, isLoading: savedLoading } = useLectureStudentDiscountsQuery(
    lectureId || null,
    { page: savedPage, pageSize: 10 }
  );
  const saved = savedData?.data;

  const assignMutation = useAssignLectureStudentDiscountsMutation();

  const chooseLecture = (id: string) => {
    setLectureId(id);
    setPage(1);
    setSavedPage(1);
    setSelected({});
    setSearch("");
  };

  const toggleStudent = (student: LectureDiscountCandidate) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[student.studentId]) delete next[student.studentId];
      else next[student.studentId] = student;
      return next;
    });
  };

  const pageStudents = candidates?.items ?? [];
  const allOnPageSelected =
    pageStudents.length > 0 && pageStudents.every((student) => selected[student.studentId]);

  const save = () => {
    const studentIds = Object.keys(selected);
    if (!lectureId || studentIds.length === 0 || !percentageValid) return;

    assignMutation.mutate(
      {
        lectureId,
        studentIds,
        percentage: parsedPercentage,
        appliesTo,
      },
      {
        onSuccess: (result) => {
          toast({ title: "Lecture discount saved", description: result.message });
          setSelected({});
        },
      }
    );
  };

  const exampleBase =
    appliesTo === "Renewal" ? lecture?.renewalPrice : lecture?.price;

  return (
    <>
      <DashboardCard>
        <h3 className="mb-1 text-lg font-semibold">Discount one lecture</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Pick a lecture, then choose students who attended other lectures in
          that course. This discount replaces their general discount for this
          lecture only.
        </p>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_160px_180px_220px]">
          <div className="space-y-2">
            <Label>Lecture</Label>
            {lecturesLoading ? (
              <Loading />
            ) : (
              <Select value={lectureId} onValueChange={chooseLecture}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lecture" />
                </SelectTrigger>
                <SelectContent>
                  {lectures.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {lectureLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-attendance">Attended at least</Label>
            <Input
              id="min-attendance"
              type="number"
              min={0}
              step={1}
              value={minAttendance}
              onChange={(event) => {
                setMinAttendance(event.target.value);
                setPage(1);
              }}
            />
            <p className="text-xs text-muted-foreground">Other lectures in this course.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lecture-discount-percentage">Percentage</Label>
            <Input
              id="lecture-discount-percentage"
              type="number"
              min={0.01}
              max={100}
              step={0.5}
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {percentageValid && exampleBase != null
                ? `${exampleBase} LE becomes ${chargedPrice(exampleBase, parsedPercentage)} LE.`
                : "Percentage from 1 to 100."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Applies to</Label>
            <Select
              value={appliesTo}
              onValueChange={(value) => setAppliesTo(value as DiscountTarget)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLIES_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={
                !lectureId ||
                Object.keys(selected).length === 0 ||
                !percentageValid ||
                assignMutation.isPending
              }
              onClick={save}
            >
              {assignMutation.isPending
                ? "Saving..."
                : `Save for ${Object.keys(selected).length || ""}`.trim()}
            </Button>
          </div>
        </div>
      </DashboardCard>

      {lectureId && (
        <DashboardCard>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Students by attendance</h3>
              <p className="text-sm text-muted-foreground">
                {candidates?.totalCount ?? 0} students
                {Object.keys(selected).length > 0
                  ? ` · ${Object.keys(selected).length} selected`
                  : ""}
              </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
              <Select
                value={studyMode}
                onValueChange={(value) => {
                  setStudyMode(value as "all" | "online" | "offline");
                  setPage(1);
                }}
              >
                <SelectTrigger className="sm:w-36" aria-label="Online or offline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search name, ID, or phone..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (allOnPageSelected) {
                    setSelected((current) => {
                      const next = { ...current };
                      pageStudents.forEach((student) => delete next[student.studentId]);
                      return next;
                    });
                    return;
                  }
                  setSelected((current) => {
                    const next = { ...current };
                    pageStudents.forEach((student) => {
                      next[student.studentId] = student;
                    });
                    return next;
                  });
                }}
                disabled={pageStudents.length === 0}
              >
                {allOnPageSelected ? "Clear page" : "Select page"}
              </Button>
            </div>
          </div>

          {candidatesLoading ? (
            <Loading />
          ) : pageStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students attended at least {minValid ? minimum : 0} other lectures
              in this course.
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-color2/10">
                {pageStudents.map((student) => {
                  const isSelected = !!selected[student.studentId];
                  return (
                    <li key={student.studentId}>
                      <button
                        type="button"
                        onClick={() => toggleStudent(student)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                          isSelected ? "bg-color2/10" : "hover:bg-color2/5"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.fullName}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {student.studentCode} · {student.phoneNumber} ·{" "}
                            {levelMap[student.level]} ·{" "}
                            {student.studentCode.toUpperCase().startsWith("ONL-")
                              ? "Online"
                              : "Offline"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {student.percentage != null && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                              {student.percentage}% off
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-color2/20">
                            {student.attendedCount} / {student.courseLectureCount} attended
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!candidates?.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!candidates?.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DashboardCard>
      )}

      {lecture && (
        <DashboardCard>
          <h3 className="mb-4 text-lg font-semibold">
            Discounts on {lecture.title}
          </h3>
          {savedLoading ? (
            <Loading />
          ) : (saved?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students have a discount on this lecture yet.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Student</th>
                      <th className="px-2 py-2 font-medium">Attendance</th>
                      <th className="px-2 py-2 font-medium">Percentage</th>
                      <th className="px-2 py-2 font-medium">Applies to</th>
                      <th className="px-2 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saved?.items.map((item) => (
                      <SavedLectureDiscountRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!saved?.hasPreviousPage}
                  onClick={() => setSavedPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!saved?.hasNextPage}
                  onClick={() => setSavedPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DashboardCard>
      )}
    </>
  );
}

function lectureLabel(lecture: DiscountLectureOption) {
  const level = lecture.level ? levelMap[lecture.level] : "";
  return `${lecture.courseTitle} — ${lecture.title}${level ? ` (${level})` : ""}`;
}

function SavedLectureDiscountRow({ item }: { item: LectureStudentDiscountItem }) {
  const [percentage, setPercentage] = useState(String(item.percentage));
  const [appliesTo, setAppliesTo] = useState<DiscountTarget>(item.appliesTo);
  const updateMutation = useUpdateLectureStudentDiscountMutation();
  const deleteMutation = useDeleteLectureStudentDiscountMutation();

  useEffect(() => {
    setPercentage(String(item.percentage));
    setAppliesTo(item.appliesTo);
  }, [item.percentage, item.appliesTo, item.id]);

  const parsed = Number(percentage);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= 100;

  return (
    <tr className="border-b align-top last:border-0">
      <td className="px-2 py-3">
        <p className="font-medium">{item.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {item.studentCode} · {levelMap[item.level]} · {item.phoneNumber}
        </p>
      </td>
      <td className="px-2 py-3">{item.attendedCount} other lectures</td>
      <td className="px-2 py-3">
        <Input
          className="w-24"
          type="number"
          min={0.01}
          max={100}
          step={0.5}
          value={percentage}
          onChange={(event) => setPercentage(event.target.value)}
          aria-label={`Percentage for ${item.fullName}`}
        />
      </td>
      <td className="px-2 py-3">
        <Select
          value={appliesTo}
          onValueChange={(value) => setAppliesTo(value as DiscountTarget)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLIES_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!valid || updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate(
                { id: item.id, percentage: parsed, appliesTo },
                {
                  onSuccess: () =>
                    toast({
                      title: "Lecture discount updated",
                      description: `${item.fullName} now has ${parsed}% off ${appliesLabel(appliesTo).toLowerCase()}.`,
                    }),
                }
              )
            }
          >
            Save
          </Button>
          <Confirmation
            title="Remove lecture discount"
            description={`${item.fullName} will use their general discount, or the full price, for ${item.lectureTitle}.`}
            onConfirm={() =>
              deleteMutation.mutate(item.id, {
                onSuccess: () =>
                  toast({ title: "Lecture discount removed", description: item.fullName }),
              })
            }
            button={
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            }
          />
        </div>
      </td>
    </tr>
  );
}
