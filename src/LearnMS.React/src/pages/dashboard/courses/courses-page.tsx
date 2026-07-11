import { useCoursesQuery } from "@/api/courses-api";
import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { coursesColumns } from "./columns";

const CoursesPage = () => {
  const { data: courses, isLoading } = useCoursesQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />;
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full ">
      <Link
        className="pt-[3vh] items-center justify-center"
        to={"/dashboard/courses/add"}
      >
        <Button>
          <PlusCircle className="w-4 h-4 mr-2 align-center" />
          Add Course
        </Button>
      </Link>
      <div className="m-4 max-w-[120vh] align-left w-full overflow-y-auto">
        <DataTable columns={coursesColumns} data={courses?.data!.items!} />
      </div>
    </div>
  );
};

export default CoursesPage;
