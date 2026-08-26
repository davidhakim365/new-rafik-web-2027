import { useCoursesQuery } from "@/api/courses-api";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { Permission } from "@/generated/model";
import { BookOpen, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { coursesColumns } from "./columns";

const CoursesPage = () => {
  const { data: courses, isLoading } = useCoursesQuery();
  const { hasPermission } = useDashboardPermissions();
  const canManageCourses = hasPermission(Permission.ManageCourses);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <DashboardPageShell
      title="Courses"
      description={
        canManageCourses
          ? "Manage your courses, lectures, and exams from one place."
          : "Open a course to reach lecture details or lecture students."
      }
      icon={BookOpen}
      actions={
        canManageCourses ? (
          <Link to="/dashboard/courses/add">
            <Button className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </Link>
        ) : undefined
      }
      fullWidth
    >
      <DashboardCard padding="sm">
        <DataTable columns={coursesColumns} data={courses?.data!.items!} />
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default CoursesPage;
