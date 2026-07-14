import {
  ChangeHomeworkScoreRequest,
  ChangeQuizScoreRequest,
} from "@/api/lectures-api";
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
  useChangeLectureHomeworkScore,
  useChangeLectureQuizScore,
  useEnrollStudentInLecture,
  useToggleLectureAttendance,
} from "@/generated/api";
import { SingleLectureStudent } from "@/generated/model";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Circle, Gift, MoreHorizontal, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

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

export const lectureStudentsColumns: ColumnDef<SingleLectureStudent>[] = [
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
        useToggleLectureAttendance({
          mutation: {
            onSuccess() {
              qc.invalidateQueries({
                queryKey: getGetLectureStudentsQueryKey(courseId!, lectureId!),
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
            onPressedChange={() =>
              toggleAttendance({
                lectureId: lectureId!,
                courseId: courseId!,
                studentId: student.id,
              })
            }
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
    header: "Homework Score",
    cell: ({ row }) => {
      const { courseId, lectureId } = useParams();
      const student = row.original;

      const form = useForm<ChangeHomeworkScoreRequest>({
        resolver: zodResolver(ChangeHomeworkScoreRequest),
        defaultValues: {
          score: student.homeworkScore ?? ("" as any),
        },
        values: {
          score: student.homeworkScore ?? ("" as any),
        },
      });
      const qc = useQueryClient();
      const { mutate: changeHomework, isPending } =
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
          },
        });

      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              changeHomework({
                courseId: courseId!,
                data,
                lectureId: lectureId!,
                studentId: student.id,
              });
            })}
            className="w-full"
          >
            <fieldset
              disabled={isPending}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input type="number" className="w-full" {...field} />
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
    },
  },
  {
    accessorKey: "quizScore",
    header: "Quiz Score",
    cell: ({ row }) => {
      const { courseId, lectureId } = useParams();
      const student = row.original;

      const form = useForm<ChangeQuizScoreRequest>({
        resolver: zodResolver(ChangeQuizScoreRequest),
        defaultValues: {
          score: student.quizScore ?? ("" as any),
        },
        values: {
          score: student.quizScore ?? ("" as any),
        },
      });
      const qc = useQueryClient();
      const { mutate: changeQuiz, isPending } = useChangeLectureQuizScore({
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
        },
      });

      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              changeQuiz({
                courseId: courseId!,
                data,
                lectureId: lectureId!,
                studentId: student.id,
              });
            })}
            className="w-full"
          >
            <fieldset
              disabled={isPending}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input type="number" className="w-full" {...field} />
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
    },
  },
  {
    accessorKey: "studentQuizzesScore",
    header: "Online Quizzes Score",
    cell: ({ row }) => (
      <div>{row.original.totalQuizzesScore ?? "—"}</div>
    ),
  },
];

export default lectureStudentsColumns;
