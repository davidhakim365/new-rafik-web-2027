import { useCoursesQuery } from "@/api/courses-api";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetCourse,
  useGetCourseStatistics,
  useGetIncomesStatistics,
  useGetLectureStatistics,
  useGetProfile,
} from "@/generated/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const StatisticsPage = () => {
  const { data: profile, isLoading } = useGetProfile();

  if (isLoading) {
    return <Loading />;
  }

  if (
    profile?.data?.$type === "GetTeacherProfileResult" ||
    (profile?.data?.$type === "GetAssistantProfileResult" &&
      profile.data.permissions.includes("ViewStatistics"))
  ) {
    return <StatisticsPageInner />;
  }

  return null;
};

const StatisticsPageInner = () => {
  const [scale, setScale] = useState(1);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center self-end gap-2 text-foreground">
        Scale
        <Input
          type="number"
          max={100}
          min={1}
          value={scale}
          onChange={(e) => setScale(parseInt(e.target.value))}
        />
      </div>

      <IncomesStatistics scale={scale} />
      <CoursesStatistics scale={scale} />
      <LecturesStatistics scale={scale} />
    </div>
  );
};

function LecturesStatistics({ scale }: { scale: number }) {
  const [level, setLevel] = React.useState<string | undefined>();
  const [courseId, setCourseId] = React.useState<string | undefined>(undefined);
  const [lectureId, setLectureId] = React.useState<string | undefined>(
    undefined
  );

  const { data: courses, isLoading: coursesLoading } = useCoursesQuery();
  const { data: course, isLoading: lecturesLoading } = useGetCourse(
    courseId as string
  );
  const { data: lectureStatistics, isLoading } = useGetLectureStatistics(
    { lectureId },
    { query: { enabled: !!lectureId } }
  );

  const lectures = course?.data?.items.filter(
    (item) => item.type === "Lecture"
  );

  const offlineIncome =
    (lectureStatistics?.data?.offlineIncome ?? 0) * (scale / 100);

  const items = [
    {
      title: "Enrolled Students",
      value: lectureStatistics?.data?.enrolledStudents,
    },
    {
      title: "Attended Students",
      value: lectureStatistics?.data?.attendedStudents,
    },
    {
      title: "Average Homeworks Score",
      value: lectureStatistics?.data?.averageHomeworksScore?.toFixed(2),
    },
    {
      title: "Average Quizzes Score",
      value: lectureStatistics?.data?.averageQuizzesScore?.toFixed(2),
    },
    {
      title: "Offline Income",
      value: offlineIncome,
    },
    {
      title: "Online Income",
      value: lectureStatistics?.data?.onlineIncome,
    },
    {
      title: "Total Income",
      value: offlineIncome + (lectureStatistics?.data?.onlineIncome ?? 0),
    },
  ];

  if (coursesLoading || lecturesLoading || isLoading) {
    return <Loading />;
  }

  const levels = courses?.data.items.map((item) => item.level);
  const uniqueLevels = Array.from(new Set(levels));

  return (
    <Card className="p-4">
      <CardTitle className="mb-4">Lecture Statistics</CardTitle>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {uniqueLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={courseId}
            onValueChange={setCourseId}
            disabled={!level}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.data?.items
                .filter((item) => !level || item.level === level)
                .map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={lectureId}
            onValueChange={setLectureId}
            disabled={!courseId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Lecture" />
            </SelectTrigger>
            <SelectContent>
              {lectures?.map((lecture) => (
                <SelectItem key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {lectureId && (
          <div className="grid items-center justify-center grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item.title} className="p-4">
                <CardTitle className="text-sm">{item.title}</CardTitle>
                <CardContent className="p-0 pt-2">
                  <span className="text-2xl font-bold">{item.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function CoursesStatistics({ scale }: { scale: number }) {
  const { data: courses, isLoading: coursesLoading } = useCoursesQuery();
  const [courseId, setCourseId] = React.useState<string | undefined>(undefined);

  const { data: coursesStatistics, isLoading } = useGetCourseStatistics(
    { courseId },
    { query: { enabled: !!courseId } }
  );

  if (coursesLoading || isLoading) {
    return <Loading />;
  }

  const studentsData = coursesStatistics?.data?.totalStudents?.map(
    (item, index) => ({
      name: item.lectureName,
      total: item.studentCount,
      online:
        coursesStatistics?.data?.onlineStudents?.[index]?.studentCount || 0,
      attended:
        coursesStatistics?.data?.attendedStudents?.[index]?.studentCount || 0,
    })
  );

  const homeworkScoresData =
    coursesStatistics?.data?.averageHomeworksScores?.map((item) => ({
      name: item.lectureName,
      score: Number(item.averageScore),
    }));

  const quizScoresData = coursesStatistics?.data?.averageQuizzesScores?.map(
    (item) => ({
      name: item.lectureName,
      score: Number(item.averageScore),
    })
  );

  return (
    <Card className="p-4">
      <CardTitle className="mb-4">Course Statistics</CardTitle>
      <div className="flex flex-col gap-4">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            {courses?.data?.items.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {courseId && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <CardTitle className="text-sm">Students Statistics</CardTitle>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(221, 83%, 53%)" />{" "}
                    {/* blue-600 */}
                    <Bar dataKey="online" fill="hsl(142, 71%, 45%)" />{" "}
                    {/* green-500 */}
                    <Bar dataKey="attended" fill="hsl(48, 96%, 53%)" />{" "}
                    {/* yellow-400 */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardTitle className="text-sm">Homework Scores</CardTitle>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={homeworkScoresData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Score",
                      ]}
                    />
                    <Bar
                      dataKey="score"
                      fill="hsl(221, 83%, 53%)" // blue-600
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardTitle className="text-sm">Quiz Scores</CardTitle>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizScoresData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor" }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Score",
                      ]}
                    />
                    <Bar
                      dataKey="score"
                      fill="hsl(142, 71%, 45%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}
function IncomesStatistics({ scale }: { scale: number }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date("2020-01-01"),
    to: new Date(),
  });

  const { data, isLoading } = useGetIncomesStatistics({
    startDate: date?.from?.toUTCString(),
    endDate: date?.to?.toUTCString(),
  });

  const offlineIncomes = (data?.data?.offlineIncomes ?? 0) * (scale / 100);

  const items = [
    {
      title: "Total Students",
      value: data?.data?.totalStudents,
    },
    {
      title: "Total Incomes",
      value: offlineIncomes + (data?.data?.onlineIncomes ?? 0),
    },
    {
      title: "Online Incomes",
      value: data?.data?.onlineIncomes,
    },
    {
      title: "Offline Incomes",
      value: offlineIncomes,
    },
  ];

  return (
    <Card className="p-4">
      <CardTitle className="mb-4">Income Statistics</CardTitle>
      <div className="flex flex-col gap-4">
        <Popover>
          <PopoverTrigger asChild className="self-end">
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item.title} className="p-4">
                <CardTitle className="text-sm">{item.title}</CardTitle>
                <CardContent className="p-0 pt-2">
                  <span className="text-2xl font-bold">{item.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatisticsPage;
