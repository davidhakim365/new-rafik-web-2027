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
import { CheckCircle, Circle, MoreHorizontal, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

export const lectureStudentsColumns: ColumnDef<SingleLectureStudent>[] = [
  {
    id: "actions",
    size: 6,
    header: "Actions",
    cell: ({ row }) => {
      const student = row.original;
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
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            className="shadow-md shadow-primary w-[200px]"
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Confirmation
              title="Enroll Student"
              description="Are you sure you want to enroll this student?"
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
                  className="w-full hover:bg-primary hover:text-primary-foreground"
                  variant="ghost"
                >
                  Enroll For Free
                </Button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: "attended",
    header: "Attended",
    size: 6,
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
            className="data-[state=on]:text-primary data-[state=off]:text-zinc-400"
            onPressedChange={() =>
              toggleAttendance({
                lectureId: lectureId!,
                courseId: courseId!,
                studentId: student.id,
              })
            }
          >
            {student.attended ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </Toggle>
        </div>
      );
    },
  },
  {
    accessorKey: "enrolled",
    header: "Enrolled",
    size: 6,
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex items-center justify-center">
          {student.enrolled ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "studentCode",
    header: "Student ID",
    cell: ({ row }) => {
      const studentCode = row.original.studentCode;
      const displayCode =
        studentCode.length > 12
          ? studentCode.split("@")[0] // Take text until the '@' sign
          : studentCode; // Show full code if it's 12 characters or less
      return <div className="truncate">{displayCode}</div>;
    },
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
    cell: ({ row }) => {
      const nameParts = row.original.fullName.split(" ");
      const shortenedName = nameParts.slice(0, 2).join(" "); // Take first two words
      return <div className="truncate">{shortenedName}</div>;
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
            <fieldset disabled={isPending} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="number" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.isDirty && (
                <Button className="ml-2">
                  <Save className="w-6 h-6" />
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
      const { mutate: changeHomework, isPending } = useChangeLectureQuizScore({
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
            <fieldset disabled={isPending} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="number" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.isDirty && (
                <Button className="ml-2">
                  <Save className="w-6 h-6" />
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
      <div className="truncate">{row.original.totalQuizzesScore}</div>
    ),
  },
];

export default lectureStudentsColumns;
