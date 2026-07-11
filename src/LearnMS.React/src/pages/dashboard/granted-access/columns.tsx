import Confirmation from "@/components/confirmation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getGetStudentLecturesQueryKey,
  useEnrollStudentInLecture,
} from "@/generated/api";
import { SingleStudentLecture } from "@/generated/model";
import { toast } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Gift, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

function EnrollmentBadge({ status }: { status?: string | null }) {
  if (status === "Active") {
    return <Badge variant="default">Active</Badge>;
  }
  if (status === "Expired") {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="secondary">Not Enrolled</Badge>;
}

export function createGrantedAccessColumns(
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
      header: "Access Status",
      cell({ row }) {
        return <EnrollmentBadge status={row.original.enrollmentStatus} />;
      },
    },
    {
      id: "actions",
      header: "Grant Access",
      cell({ row }) {
        const lecture = row.original;
        const qc = useQueryClient();

        const { mutate: grantAccess, isPending } = useEnrollStudentInLecture({
          mutation: {
            onSuccess() {
              toast({
                title: "Access Granted",
                description: `Free access granted for "${lecture.title}".`,
              });
              qc.invalidateQueries({
                queryKey: getGetStudentLecturesQueryKey(studentId, {
                  page: pageIndex + 1,
                  pageSize,
                  search,
                }),
              });
            },
            onError() {
              toast({
                title: "Error",
                description: "Failed to grant access.",
                variant: "destructive",
              });
            },
          },
        });

        const isActive = lecture.enrollmentStatus === "Active";

        if (isActive) {
          return (
            <span className="text-sm text-muted-foreground">
              Already has access
            </span>
          );
        }

        const actionLabel =
          lecture.enrollmentStatus === "Expired" ? "Renew Access" : "Grant Access";

        return (
          <Confirmation
            title={actionLabel}
            description={`Give ${actionLabel.toLowerCase()} to this student for "${lecture.title}" at no cost?`}
            onConfirm={() =>
              grantAccess({
                courseId: lecture.courseId,
                lectureId: lecture.id,
                studentId,
              })
            }
            button={
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                {actionLabel}
              </Button>
            }
          />
        );
      },
    },
  ];
}
