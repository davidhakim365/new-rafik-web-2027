import {
  ChangeHomeworkScoreRequest,
  ChangeQuizScoreRequest,
} from "@/api/lectures-api";
import {
  SingleLectureStudentWithCenter,
  useToggleLectureAttendanceAtCenter,
} from "@/api/centers-api";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import {
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
  useChangeLectureHomeworkScore,
  useChangeLectureQuizScore,
  useEnrollStudentInLecture,
} from "@/generated/api";
import { SingleLectureStudent } from "@/generated/model";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Circle, Gift, MoreHorizontal, Save } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";

function EnrollAction({ student }: { student: SingleLectureStudent }) {
  const { lectureId, courseId } = useParams();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const { mutate: enroll, isPending } = useEnrollStudentInLecture({
    mutation: {
      onSuccess() {
        toast({
          title: "Enrolled",
          description: "Successfully enrolled the student",
        });
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId!, lectureId!, {
            page: Number(searchParams.get("page")),
            pageSize: Number(searchParams.get("pageSize")),
            search: searchParams.get("search") ?? "",
          }),
        });
      },
    },
  });

  return (
    <Confirmation
      title="Enroll Student"
      description="Are you sure you want to enroll this student for free?"
      onConfirm={() =>
        enroll({
          courseId: courseId!,
          lectureId: lectureId!,
          studentId: student.id,
        })
      }
      button={
        <Button
          disabled={isPending}
          variant="outline"
          size="sm"
          className="w-full gap-2 lg:w-auto"
        >
          <Gift className="h-4 w-4" />
          Enroll For Free
        </Button>
      }
    />
  );
}

function ScoreCell({
  kind,
  score,
  fullMark,
  studentId,
}: {
  kind: "homework" | "quiz";
  score?: number | null;
  fullMark?: number | null;
  studentId: string;
}) {
  const { courseId, lectureId } = useParams();
  const qc = useQueryClient();
  const canScore = fullMark != null && fullMark > 0;

  const schema = useMemo(
    () =>
      z.object({
        score: z.coerce
          .number()
          .min(0, { message: "Min 0" })
          .max(fullMark ?? 0, {
            message: `Max ${fullMark ?? 0}`,
          }),
      }),
    [fullMark]
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      score: score ?? ("" as any),
    },
    values: {
      score: score ?? ("" as any),
    },
  });

  const { mutate: changeHomework, isPending: hwPending } =
    useChangeLectureHomeworkScore({
      mutation: {
        onSuccess: (data) => {
          qc.invalidateQueries({
            queryKey: getGetLectureStudentsQueryKey(courseId!, lectureId!),
          });
          toast({
            title: "Score updated",
            description: data.message,
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    });

  const { mutate: changeQuiz, isPending: quizPending } =
    useChangeLectureQuizScore({
      mutation: {
        onSuccess: (data) => {
          qc.invalidateQueries({
            queryKey: getGetLectureStudentsQueryKey(courseId!, lectureId!),
          });
          toast({
            title: "Score updated",
            description: data.message,
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    });

  const isPending = hwPending || quizPending;

  if (!canScore) {
    return (
      <div className="text-xs text-muted-foreground">
        Set full mark first
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          const payload = { score: data.score };
          if (kind === "homework") {
            changeHomework({
              courseId: courseId!,
              data: payload as ChangeHomeworkScoreRequest,
              lectureId: lectureId!,
              studentId,
            });
          } else {
            changeQuiz({
              courseId: courseId!,
              data: payload as ChangeQuizScoreRequest,
              lectureId: lectureId!,
              studentId,
            });
          }
        })}
        className="w-full"
      >
        <fieldset
          disabled={isPending}
          className="flex flex-col gap-1 sm:flex-row sm:items-center"
        >
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={fullMark!}
                      step="any"
                      className="w-full min-w-[4.5rem]"
                      {...field}
                    />
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      / {fullMark}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.isDirty && (
            <Button type="submit" size="sm" className="w-full sm:w-auto">
              <Save className="h-4 w-4" />
            </Button>
          )}
        </fieldset>
      </form>
    </Form>
  );
}

export function createLectureStudentsColumns(
  centerId?: string | null,
  options?: {
    homeworkFullMark?: number | null;
    quizFullMark?: number | null;
  }
): ColumnDef<SingleLectureStudent & SingleLectureStudentWithCenter>[] {
  const homeworkFullMark = options?.homeworkFullMark;
  const quizFullMark = options?.quizFullMark;

  return [
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => {
        const nameParts = row.original.fullName.split(" ");
        const shortenedName = nameParts.slice(0, 2).join(" ");
        return <div className="font-medium">{shortenedName}</div>;
      },
    },
    {
      accessorKey: "studentCode",
      header: "Student ID",
      cell: ({ row }) => {
        const studentCode = row.original.studentCode;
        const displayCode =
          studentCode.length > 12 ? studentCode.split("@")[0] : studentCode;
        return <div className="font-mono text-sm">{displayCode}</div>;
      },
    },
    {
      accessorKey: "attended",
      header: "Attended",
      cell: ({ row }) => {
        const student = row.original;
        const { lectureId, courseId } = useParams();
        const qc = useQueryClient();
        const { mutate: toggleAttendance, isPending } =
          useToggleLectureAttendanceAtCenter({
            mutation: {
              onSuccess() {
                qc.invalidateQueries({
                  queryKey: getGetLectureStudentsQueryKey(courseId!, lectureId!),
                });
                qc.invalidateQueries({
                  queryKey: getGetLectureStatisticsQueryKey({
                    lectureId: lectureId!,
                    ...(centerId ? { centerId } : {}),
                  }),
                });
              },
            },
          });

        return (
          <div className="flex items-center justify-center">
            <Toggle
              disabled={isPending}
              pressed={student.attended}
              className="h-10 w-10 data-[state=on]:text-primary data-[state=off]:text-zinc-400"
              onPressedChange={() => {
                if (!student.attended && !centerId) {
                  toast({
                    title: "Select a center",
                    description:
                      "Choose an attendance center before marking students as attended.",
                    variant: "destructive",
                  });
                  return;
                }

                toggleAttendance({
                  lectureId: lectureId!,
                  courseId: courseId!,
                  studentId: student.id,
                  centerId: !student.attended
                    ? centerId ?? undefined
                    : undefined,
                });
              }}
            >
              {student.attended ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </Toggle>
          </div>
        );
      },
    },
    {
      accessorKey: "centerName",
      header: "Center",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.centerName ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "enrolled",
      header: "Enrolled",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center justify-center">
            {student.enrolled ? (
              <CheckCircle className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-zinc-400" />
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;

        return (
          <div className="flex w-full flex-col gap-2 lg:items-center">
            <div className="lg:hidden">
              <EnrollAction student={student} />
            </div>
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="left"
                  className="w-[200px] shadow-md shadow-primary"
                >
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <EnrollAction student={student} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "homeworkScore",
      header: homeworkFullMark
        ? `Homework ( / ${homeworkFullMark})`
        : "Homework Score",
      cell: ({ row }) => (
        <ScoreCell
          kind="homework"
          score={row.original.homeworkScore}
          fullMark={homeworkFullMark}
          studentId={row.original.id}
        />
      ),
    },
    {
      accessorKey: "quizScore",
      header: quizFullMark ? `Quiz ( / ${quizFullMark})` : "Quiz Score",
      cell: ({ row }) => (
        <ScoreCell
          kind="quiz"
          score={row.original.quizScore}
          fullMark={quizFullMark}
          studentId={row.original.id}
        />
      ),
    },
    {
      accessorKey: "studentQuizzesScore",
      header: "Online Quizzes Score",
      cell: ({ row }) => (
        <div>{row.original.totalQuizzesScore ?? "—"}</div>
      ),
    },
  ];
}

export default createLectureStudentsColumns;
