import { useCoursesQuery } from "@/api/courses-api";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
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
import { Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const ImportantLecturesPage = () => {
  const [level, setLevel] = useState<StudentLevel | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);

  const { data: coursesData, isLoading: coursesLoading } = useCoursesQuery();

  if (coursesLoading || !coursesData?.data) {
    return <Loading />;
  }

  const courses = coursesData.data.items.filter((item) => item.level === level);

  const course = courses.find((item) => item.id === courseId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Select
          value={level}
          onValueChange={(value) => setLevel(value as StudentLevel)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a level" />
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
          <Select
            value={courseId}
            onValueChange={(value) => setCourseId(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Courses</SelectLabel>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      {course && <CourseLectures courseId={course.id} />}
    </div>
  );
};

function CourseLectures({ courseId: courseId }: { courseId: string }) {
  const { data: courseData, isLoading, refetch } = useGetCourse(courseId);
  const { mutate: toggleLectureImportant } = useToggleLectureImportant({
    mutation: {
      onSuccess() {
        refetch();
      },
    },
  });

  if (isLoading || !courseData?.data) {
    return <Loading />;
  }

  const lectures = courseData.data.items.filter(
    (item) => item.type === "Lecture"
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {lectures.map((lecture) => (
        <Card
          key={lecture.id}
          className="p-4 overflow-hidden transition-all duration-500 group hover:shadow-lg hover:shadow-ebluemerald-100"
        >
          {/* Image Container with Gradient Overlay */}
          <div className="relative mb-4 overflow-hidden rounded-lg h-52">
            <img
              src={lecture.imageUrl!}
              alt={lecture.title}
              className="object-cover w-full h-full transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:opacity-100" />
            <Button
              size="icon"
              variant={"outline"}
              onClick={() =>
                toggleLectureImportant({ lectureId: lecture.id, courseId })
              }
              className="absolute top-2 right-2"
            >
              {lecture.isImportant ? (
                <Heart className="text-pink-500" />
              ) : (
                <Heart className="text-zinc-500" />
              )}
            </Button>
          </div>

          <CardHeader className="p-0 mb-4">
            <h3 className="text-xl font-semibold transition-colors duration-300 text-foreground line-clamp-2">
              {lecture.title}
            </h3>
          </CardHeader>

          <CardFooter className="p-0">
            <Link
              to={`/dashboard/courses/${courseId}/lectures/${lecture.id}`}
              className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold transition-all duration-300 bg-transparent border-2 rounded-full text-emerald-500 border-emerald-200 hover:bg-emerald-500 hover:text-white focus:ring-4 focus:ring-emerald-200"
            >
              View Lecture
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default ImportantLecturesPage;
