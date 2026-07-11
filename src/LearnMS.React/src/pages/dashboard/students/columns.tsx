import { useDeleteStudentMutation } from "@/api/students-api";
import { useAddStudentCredit } from "@/generated/api"; // already imported
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getGetAllStudentsQueryKey,
  useUnlinkStudentDevice,
} from "@/generated/api";
import {
  SingleStudent,
  SingleStudentEvent,
  SingleStudentExam,
  SingleStudentLecture,
} from "@/generated/model";
import { useModalStore } from "@/store/use-modal-store";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Circle,
  CreditCard,
  MoreHorizontal,
  MoreVertical,
  Network,
  Trash,
} from "lucide-react";
import { FaChrome } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getFirstCharacters } from "../../../lib/utils";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
const levelMap = {
  Level0: "3rd Prep School",
  Level1: "1st Secondary ",
  Level2: "2nd Secondary ",
  Level3: "3rd Secondary ",
};

export const studentsColumns: ColumnDef<SingleStudent>[] = [
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    size: 120,
    cell: ({ row }) => {
      const student = row.original;
      const { openModal } = useModalStore();
      const qc = useQueryClient();
      const deleteStudentMutation = useDeleteStudentMutation();
      
      const unlinkDeviceMutation = useUnlinkStudentDevice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAllStudentsQueryKey() });
      },
    },
  });

       const onUnlink = () => {
    unlinkDeviceMutation.mutate({ studentId: student.id });
  };

      const onDeleting = () => {
        deleteStudentMutation.mutate({ id: student.id });
      };

const addStudentCredit = useAddStudentCredit({
  mutation: {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetAllStudentsQueryKey() });
      toast({
        title: "Credit Added",
        description: `Added 90 credits to ${student.fullName}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add credit.",
        variant: "destructive",
      });
    },
  },
});
  
const onQuickAddCredit = () => {
  addStudentCredit.mutate({
    studentId: student.id,
    data: { amount: 90 }, // your constant value here
  });
};
    
      return (
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center">
          {/* Mobile Layout - Stacked Buttons */}
          <div className="flex flex-col gap-1 w-full sm:hidden">
            <Button
              onClick={onUnlink}
              className="w-full gap-1 text-red-500 border-none hover:bg-red-500 hover:text-white text-xs"
              variant="outline"
              size="sm"
            >
              <Network className="w-3 h-3" />
              Unlink
            </Button>
            <Button
              onClick={onQuickAddCredit}
              className="w-full gap-1 text-green-600 hover:bg-green-100 hover:text-green-800 text-xs"
              size="sm"
            >
              <CreditCard className="w-3 h-3" />
              +90
            </Button>
          </div>

          {/* Desktop Layout - Horizontal Buttons */}
          <div className="hidden sm:flex gap-2 items-center">
            <Button
              onClick={onUnlink}
              className="gap-2 text-red-500 border-none hover:bg-red-500 hover:text-white"
              variant="outline"
              size="sm"
            >
              <Network className="w-4 h-4" />
              <span className="hidden lg:inline">Unlink</span>
            </Button>
            <Button
              onClick={onQuickAddCredit}
              className="gap-2 text-green-600 hover:bg-green-100 hover:text-green-800"
              size="sm"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden lg:inline">+90</span>
              <span className="lg:hidden">+90</span>
            </Button>
          </div>

          {/* Dropdown Menu - Available on all screen sizes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="text-center shadow-md shadow-primary min-w-[200px]"
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => openModal("add-credit-modal", { student })}
                className="flex items-center gap-2 hover:cursor-pointer hover:bg-primary hover:text-white"
              >
                <CreditCard />
                Add Credit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link to={`/dashboard/students/${student.id}`}>
                <DropdownMenuItem className="flex items-center gap-2 hover:cursor-pointer hover:bg-primary hover:text-white">
                  <MoreVertical /> View
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <div className="grid items-center w-full grid-cols-1 gap-2 hover:cursor-pointer hover:text-red-500">
                <Confirmation
                  button={
                    <Button
                      className="items-center flex w-full gap-2 text-red-500 border-none hover:bg-red-500 hover:text-white"
                      variant="outline"
                      size="sm"
                    >
                      <Trash className="w-4 h-4" />
                      Delete
                    </Button>
                  }
                  title="Are you sure you want to delete this student?"
                  description="This action cannot be undone."
                  onConfirm={onDeleting}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
  {
    accessorKey: "studentCode",
    header: "ID",
    size: 80,
    cell: ({ row }) => (
      <div className="text-xs sm:text-sm font-mono">
        {row.getValue("studentCode")}
      </div>
    ),
  },
  {
    accessorKey: "credit",
    header: "Credit",
    size: 80,
    cell: ({ row }) => (
      <div className="text-xs sm:text-sm font-medium">
        {row.getValue("credit")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 200,
    cell: ({ row }) => (
      <div className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]" title={row.getValue("email")}>
        {row.getValue("email")}
      </div>
    ),
  },

  {
    accessorKey: "fullName",
    header: "Full Name",
    size: 150,
    cell: ({ row }) => (
      <div className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]" title={row.getValue("fullName")}>
        {row.getValue("fullName")}
      </div>
    ),
  },

  {
    accessorKey: "level",
    header: "Level",
    size: 120,
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="text-xs sm:text-sm">
          {levelMap[student.level]}
        </div>
      );
    },
  },
  {
    accessorKey: "deviceLinked",
    header: "Device",
    size: 80,
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex items-center justify-center">
          {student.deviceLinked ? (
            <FaChrome className="w-4 h-4 sm:w-6 sm:h-6 text-primary" title="Device Linked" />
          ) : (
            <FaChrome className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-400" title="Device Not Linked" />
          )}
        </div>
      );
    },
  },
];

export const studentLecturesColumns: ColumnDef<SingleStudentLecture>[] = [
  {
    accessorKey: "title",
    header: "Lecture",
    cell({ row }) {
      const lecture = row.original;
      return (
        <div>
          <Link
            className="underline hover:cursor-pointer hover:text-blue-500"
            to={`/dashboard/courses/${lecture.courseId}/lectures/${lecture.id}`}
          >
            {lecture.title}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "courseTitle",
    header: "Course",
  },

  {
    header: "Center Attendance",
    cell: ({ row }) => {
      const attended = row.original.attended;
      return (
        <div className="flex items-center justify-center">
          {attended ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "enrollmentStatus",
    header: "Online Enrollment",
    cell({ row }) {
      const status = row.original.enrollmentStatus;
      // Map string value to enum if necessary
      return status ? status : "Not Enrolled"; // Assuming status is already in enum format
    },
  },
  {
    accessorKey: "homeworkScore",
    header: "Homework",
    cell({ row }) {
      const score = row.original.homeworkScore;
      return score === 1 || score == null ? "-" : score;
    },
  },
  {
    accessorKey: "quizScore",
    header: "Quiz Score",
    cell({ row }) {
      const score = row.original.quizScore;
      return score != null ? score : "-";
    },
  },

  {
    accessorKey: "studentQuizzesScore",
    header: "Online Quizzes Score",
    cell({ row }) {
      const studentScore = row.original.studentQuizzesScore;
      const totalScore = row.original.totalQuizzesScore;
      return studentScore != null && totalScore != null
        ? `${studentScore} / ${totalScore}`
        : "-";
    },
  },
];

export const studentEventsColumns: ColumnDef<SingleStudentEvent>[] = [
  {
    accessorKey: "message",
    header: "Message",
    size: 300,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    size: 10,
    cell({ row }) {
      const event = row.original;
      return <div>{new Date(event.createdAt).toLocaleString()}</div>;
    },
  },
];

export const studentExamsColumns: ColumnDef<SingleStudentExam>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell({ row }) {
      const exam = row.original;
      return (
        <div>
          <Link
            className="underline hover:cursor-pointer hover:text-blue-500"
            to={`/dashboard/courses/${exam.courseId}/exams/${exam.id}`}
          >
            {exam.title}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "studentScore",
    header: "Score",
    cell({ row }) {
      const exam = row.original;

      if (!exam.studentScore || !exam.totalScore) return;

      return (
        <div>
          {exam.studentScore} / {exam.totalScore}
        </div>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted At",
    cell({ row }) {
      const exam = row.original;
      if (!exam.submittedAt) return;
      return <div>{new Date(exam.submittedAt).toLocaleDateString()}</div>;
    },
  },
];
