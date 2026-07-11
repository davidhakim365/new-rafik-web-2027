import { useCoursesQuery } from "@/api/courses-api";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { coursesColumns } from "./columns";

const CoursesPage = () => {
  const { data: courses, isLoading } = useCoursesQuery();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <DashboardPageShell
      title="Courses"
      description="Manage your courses, lectures, and exams from one place."
      icon={BookOpen}
      actions={
        <Link to="/dashboard/courses/add">
          <Button className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </Link>
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
