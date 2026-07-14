import { useCoursesQuery } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { CardFooter, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCourse, useToggleLectureImportant } from "@/generated/api";
import { StudentLevel } from "@/generated/model";
import { ArrowRight, Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const ImportantLecturesPage = () => {
  const [level, setLevel] = useState<StudentLevel | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();

  const { data: coursesData, isLoading: coursesLoading } = useCoursesQuery();

  if (coursesLoading || !coursesData?.data) {
    return <Loading />;
  }

  const courses = coursesData.data.items.filter((item) => item.level === level);
  const course = courses.find((item) => item.id === courseId);

  return (
    <DashboardPageShell
      title="Important Lectures"
      description="Highlight and manage your most important lectures."
      icon={Star}
    >
      <DashboardCard>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Select
            value={level}
            onValueChange={(value) => setLevel(value as StudentLevel)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Levels</SelectLabel>
                <SelectItem value="Level0">3rd Prep</SelectItem>
                <SelectItem value="Level1">1st Secondary</SelectItem>
                <SelectItem value="Level2">2nd Secondary</SelectItem>
                <SelectItem value="Level3">3rd Secondary</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {level && (
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Courses</SelectLabel>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </DashboardCard>

      {course && <CourseLectures courseId={course.id} />}
    </DashboardPageShell>
  );
};

function CourseLectures({ courseId }: { courseId: string }) {
  const { data: courseData, isLoading, refetch } = useGetCourse(courseId);
  const { mutate: toggleLectureImportant } = useToggleLectureImportant({
    mutation: { onSuccess: () => refetch() },
  });

  if (isLoading || !courseData?.data) {
    return <Loading />;
  }

  const lectures = courseData.data.items.filter(
    (item) => item.type === "Lecture"
  );

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {lectures.map((lecture) => (
        <DashboardCard key={lecture.id} padding="sm" className="group">
          <div className="relative mb-4 h-48 overflow-hidden rounded-xl">
            <img
              src={lecture.imageUrl!}
              alt={lecture.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-color1/60 via-transparent to-transparent opacity-60" />
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                toggleLectureImportant({ lectureId: lecture.id, courseId })
              }
              className="absolute right-2 top-2 border-white/30 bg-black/20 backdrop-blur-sm hover:bg-black/40"
            >
              <Heart
                className={
                  lecture.isImportant ? "fill-pink-500 text-pink-500" : "text-white"
                }
              />
            </Button>
          </div>

          <CardHeader className="mb-3 p-0">
            <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
              {lecture.title}
            </h3>
          </CardHeader>

          <CardFooter className="p-0">
            <Link
              to={`/dashboard/courses/${courseId}/lectures/${lecture.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-color2/30 bg-color2/5 px-4 py-2.5 text-sm font-semibold text-color2 transition-all hover:bg-gradient-to-r hover:from-color1 hover:to-color2 hover:text-white"
            >
              View Lecture
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </CardFooter>
        </DashboardCard>
      ))}
    </div>
  );
}

export default ImportantLecturesPage;
