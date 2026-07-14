import { useUpdateLectureEnrollmentExpiration } from "@/api/enrollment-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SingleStudentLecture } from "@/generated/model";
import { toast } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function formatExpiresAt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function EnrollmentBadge({ status }: { status?: string | null }) {
  if (status === "Active") {
    return <Badge variant="default">Active</Badge>;
  }
  if (status === "Expired") {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="secondary">Not Enrolled</Badge>;
}

function ExpirationEditor({
  lecture,
  studentId,
  search,
  pageIndex,
  pageSize,
}: {
  lecture: SingleStudentLecture;
  studentId: string;
  search: string;
  pageIndex: number;
  pageSize: number;
}) {
  const [value, setValue] = useState(toDatetimeLocalValue(lecture.expiresAt));
  const { mutate: updateExpiration, isPending } =
    useUpdateLectureEnrollmentExpiration();

  const handleSave = () => {
    if (!value) {
      toast({
        title: "Missing date",
        description: "Please choose an expiration date and time.",
        variant: "destructive",
      });
      return;
    }

    updateExpiration(
      {
        studentId,
        lectureId: lecture.id,
        data: { expiresAt: fromDatetimeLocalValue(value) },
        search,
        page: pageIndex + 1,
        pageSize,
      },
      {
        onSuccess: () => {
          toast({
            title: "Expiration Updated",
            description: `Expiration set for "${lecture.title}".`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update expiration.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full sm:w-[220px]"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || !value}
        onClick={handleSave}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save
      </Button>
    </div>
  );
}

export function createExpirationTimeColumns(
  studentId: string,
  search: string,
  pageIndex: number,
  pageSize: number
): ColumnDef<SingleStudentLecture>[] {
  return [
    {
      accessorKey: "title",
      header: "Lecture",
      cell({ row }) {
        const lecture = row.original;
        return (
          <Link
            className="underline hover:text-primary"
            to={`/dashboard/courses/${lecture.courseId}/lectures/${lecture.id}`}
          >
            {lecture.title}
          </Link>
        );
      },
    },
    {
      accessorKey: "courseTitle",
      header: "Course",
    },
    {
      accessorKey: "enrollmentStatus",
      header: "Status",
      cell({ row }) {
        return <EnrollmentBadge status={row.original.enrollmentStatus} />;
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Current Expiration",
      cell({ row }) {
        return (
          <span className="text-sm text-muted-foreground">
            {formatExpiresAt(row.original.expiresAt)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Set Expiration",
      cell({ row }) {
        return (
          <ExpirationEditor
            key={`${row.original.id}-${row.original.expiresAt ?? "none"}`}
            lecture={row.original}
            studentId={studentId}
            search={search}
            pageIndex={pageIndex}
            pageSize={pageSize}
          />
        );
      },
    },
  ];
}
