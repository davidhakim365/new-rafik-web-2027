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
  getGetExamStudentsQueryKey,
  useEnrollStudentInExam,
} from "@/generated/api";
import { SingleExamStudent } from "@/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

export const examStudentsColumns: ColumnDef<SingleExamStudent>[] = [
  {
    accessorKey: "studentCode",
    header: "Student ID",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "state",
    header: "State",
  },
  {
    accessorKey: "studentExamScore",
    header: "Exam Score",
    size: 4,
    cell: ({ row }) => {
      const student = row.original;

      if (!student.studentExamScore || !student.totalExamScore) return;

      return (
        <span>
          {student.studentExamScore} / {student.totalExamScore}
        </span>
      );
    },
  },
  {
    id: "actions",
    size: 6,
    header: "Actions",
    cell: ({ row }) => {
      const student = row.original;
      const { courseId, examId } = useParams();
      const [search] = useSearchParams();
      const qc = useQueryClient();

      console.log({ search: search.get("state") });

      console.log({ examId, courseId });
      const { mutate: enrollStudent, isPending } = useEnrollStudentInExam({
        mutation: {
          onSuccess() {
            qc.invalidateQueries({
              queryKey: getGetExamStudentsQueryKey(courseId!, examId!),
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
            side='left'
            className='shadow-md shadow-primary w-[200px]'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Confirmation
              title='Enroll Student'
              description='Are you sure you want to enroll this student?'
              onConfirm={() => {
                enrollStudent({
                  courseId: courseId!,
                  examId: examId!,
                  studentId: student.id,
                });
              }}
              button={
                <Button
                  disabled={isPending}
                  className='w-full hover:bg-primary hover:text-primary-foreground'
                  variant='ghost'>
                  Enroll For Free
                </Button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
