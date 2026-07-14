import { useCoursesQuery } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Building2,
  CalendarIcon,
  Globe,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
import {
  calculateOfflineIncome,
  calculateOnlineIncome,
  calculateTotalIncome,
  formatCurrency,
  OFFLINE_CENTER_FEE_RATE,
  toApiDateString,
} from "./income-utils";

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

function DateRangePicker({
  date,
  onSelect,
  className,
}: {
  date: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const isMobile = useIsMobile();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} – {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onSelect}
          numberOfMonths={isMobile ? 1 : 2}
        />
      </PopoverContent>
    </Popover>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accentClass: string;
}) {
  return (
    <DashboardCard padding="sm" spotlight>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accentClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </DashboardCard>
  );
}

function PriceInput({
  price,
  onChange,
  label = "Lecture Price (LE)",
}: {
  price: number;
  onChange: (price: number) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="lecture-price">{label}</Label>
      <Input
        id="lecture-price"
        type="number"
        min={0}
        step={1}
        value={price || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full sm:w-[180px]"
        placeholder="Enter price"
      />
    </div>
  );
}

const StatisticsPageInner = () => {
  const [lecturePrice, setLecturePrice] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  return (
    <DashboardPageShell
      title="Statistics"
      description={`Track attendance and income. Offline center attendance deducts ${OFFLINE_CENTER_FEE_RATE * 100}% from the price.`}
      icon={LayoutDashboard}
      decorative
    >
      <DashboardCard className="border-dashed border-color2/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <PriceInput price={lecturePrice} onChange={setLecturePrice} />
          <DateRangePicker
            date={dateRange}
            onSelect={setDateRange}
            className="w-full border-color2/20 md:w-[320px]"
          />
        </div>
      </DashboardCard>

      <IncomesStatistics lecturePrice={lecturePrice} dateRange={dateRange} />
      <LecturesStatistics lecturePrice={lecturePrice} dateRange={dateRange} />
      <CoursesStatistics lecturePrice={lecturePrice} />
    </DashboardPageShell>
  );
};

function IncomesStatistics({
  lecturePrice,
  dateRange,
}: {
  lecturePrice: number;
  dateRange: DateRange | undefined;
}) {
  const { data, isLoading } = useGetIncomesStatistics({
    startDate: toApiDateString(dateRange?.from),
    endDate: toApiDateString(dateRange?.to),
  });

  const offlineStudents = data?.data?.offlineIncomes ?? 0;
  const onlineStudents = data?.data?.onlineIncomes ?? 0;
  const offlineIncome = calculateOfflineIncome(offlineStudents, lecturePrice);
  const onlineIncome = calculateOnlineIncome(onlineStudents, lecturePrice);
  const totalIncome = calculateTotalIncome(
    offlineStudents,
    onlineStudents,
    lecturePrice
  );

  const items = [
    {
      title: "Total Students",
      value: data?.data?.totalStudents ?? 0,
      subtitle: "All registered students",
      icon: Users,
      accentClass: "bg-color2/10 text-color2",
    },
    {
      title: "Offline Students",
      value: offlineStudents,
      subtitle: `Attended at center · ${formatCurrency(lecturePrice * (1 - OFFLINE_CENTER_FEE_RATE))} each`,
      icon: Building2,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Online Students",
      value: onlineStudents,
      subtitle: `Enrolled online · ${formatCurrency(lecturePrice)} each`,
      icon: Globe,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Offline Income",
      value: formatCurrency(offlineIncome),
      subtitle: `After ${OFFLINE_CENTER_FEE_RATE * 100}% center fee`,
      icon: Wallet,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Online Income",
      value: formatCurrency(onlineIncome),
      subtitle: "Full lecture price",
      icon: TrendingUp,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Total Income",
      value: formatCurrency(totalIncome),
      subtitle: "Offline + online combined",
      icon: Wallet,
      accentClass: "bg-primary/10 text-primary",
    },
  ];

  return (
    <DashboardCard>
      <div className="mb-4 flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Income Overview</h3>
          <p className="text-sm text-muted-foreground">
            Based on your lecture price and student counts in the selected date
            range
          </p>
        </div>
        <Badge variant="secondary" className="bg-color2/10 text-color2">
          {OFFLINE_CENTER_FEE_RATE * 100}% center fee on offline
        </Badge>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

function LecturesStatistics({
  lecturePrice,
  dateRange,
}: {
  lecturePrice: number;
  dateRange: DateRange | undefined;
}) {
  const [level, setLevel] = useState<string | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [lectureId, setLectureId] = useState<string | undefined>();

  const { data: courses, isLoading: coursesLoading } = useCoursesQuery();
  const { data: course, isLoading: lecturesLoading } = useGetCourse(
    courseId as string
  );
  const { data: lectureStatistics, isLoading } = useGetLectureStatistics(
    {
      lectureId,
      startDate: toApiDateString(dateRange?.from),
      endDate: toApiDateString(dateRange?.to),
    },
    { query: { enabled: !!lectureId } }
  );

  const lectures = course?.data?.items.filter((item) => item.type === "Lecture");
  const selectedLecture = lectures?.find((lecture) => lecture.id === lectureId);

  const offlineStudents = lectureStatistics?.data?.offlineIncome ?? 0;
  const onlineStudents = lectureStatistics?.data?.onlineIncome ?? 0;
  const effectivePrice = selectedLecture?.price || lecturePrice;
  const offlineIncome = calculateOfflineIncome(offlineStudents, effectivePrice);
  const onlineIncome = calculateOnlineIncome(onlineStudents, effectivePrice);
  const totalIncome = calculateTotalIncome(
    offlineStudents,
    onlineStudents,
    effectivePrice
  );

  const items = [
    {
      title: "Enrolled Students",
      value: lectureStatistics?.data?.enrolledStudents ?? 0,
      subtitle: "Total with course access",
      icon: Users,
      accentClass: "bg-color2/10 text-color2",
    },
    {
      title: "Offline Students",
      value: offlineStudents,
      subtitle: "Attended at center",
      icon: Building2,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Online Students",
      value: onlineStudents,
      subtitle: "Enrolled online",
      icon: Globe,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Avg. Homework Score",
      value: `${(lectureStatistics?.data?.averageHomeworksScore ?? 0).toFixed(1)}%`,
      subtitle: "Class average",
      icon: GraduationCap,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "Avg. Quiz Score",
      value: `${(lectureStatistics?.data?.averageQuizzesScore ?? 0).toFixed(1)}%`,
      subtitle: "Class average",
      icon: GraduationCap,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "Offline Income",
      value: formatCurrency(offlineIncome),
      subtitle: `After ${OFFLINE_CENTER_FEE_RATE * 100}% center fee`,
      icon: Wallet,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Online Income",
      value: formatCurrency(onlineIncome),
      subtitle: "Full lecture price",
      icon: TrendingUp,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Total Income",
      value: formatCurrency(totalIncome),
      subtitle: selectedLecture
        ? `Using ${formatCurrency(effectivePrice)} per student`
        : "Set lecture price above",
      icon: Wallet,
      accentClass: "bg-primary/10 text-primary",
    },
  ];

  if (coursesLoading || lecturesLoading) {
    return <Loading />;
  }

  const levels = courses?.data.items.map((item) => item.level);
  const uniqueLevels = Array.from(new Set(levels));

  return (
    <DashboardCard>
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">Lecture Statistics</h3>
        <p className="text-sm text-muted-foreground">
          Select a lecture for detailed stats. Uses the lecture&apos;s saved
          price when available, otherwise the global price above.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {uniqueLevels.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={courseId} onValueChange={setCourseId} disabled={!level}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.data?.items
                .filter((item) => !level || item.level === level)
                .map((courseItem) => (
                  <SelectItem key={courseItem.id} value={courseItem.id}>
                    {courseItem.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={lectureId}
            onValueChange={setLectureId}
            disabled={!courseId}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select Lecture" />
            </SelectTrigger>
            <SelectContent>
              {lectures?.map((lecture) => (
                <SelectItem key={lecture.id} value={lecture.id}>
                  {lecture.title}
                  {lecture.price ? ` (${lecture.price} LE)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {lectureId && (
          isLoading ? (
            <Loading />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <StatCard key={item.title} {...item} />
              ))}
            </div>
          )
        )}
      </div>
    </DashboardCard>
  );
}

function CoursesStatistics({ lecturePrice }: { lecturePrice: number }) {
  const { data: courses, isLoading: coursesLoading } = useCoursesQuery();
  const [courseId, setCourseId] = useState<string | undefined>();

  const { data: coursesStatistics, isLoading } = useGetCourseStatistics(
    { courseId },
    { query: { enabled: !!courseId } }
  );

  const studentsData = useMemo(
    () =>
      coursesStatistics?.data?.totalStudents?.map((item, index) => {
        const online =
          coursesStatistics?.data?.onlineStudents?.[index]?.studentCount || 0;
        const attended =
          coursesStatistics?.data?.attendedStudents?.[index]?.studentCount || 0;

        return {
          name: item.lectureName,
          total: item.studentCount,
          online,
          attended,
          offlineIncome: calculateOfflineIncome(attended, lecturePrice),
          onlineIncome: calculateOnlineIncome(online, lecturePrice),
          totalIncome: calculateTotalIncome(attended, online, lecturePrice),
        };
      }) ?? [],
    [coursesStatistics, lecturePrice]
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

  if (coursesLoading) {
    return <Loading />;
  }

  if (courseId && isLoading) {
    return <Loading />;
  }

  return (
    <DashboardCard>
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">Course Statistics</h3>
        <p className="text-sm text-muted-foreground">
          Compare student distribution and performance across lectures in a
          course
        </p>
      </div>
      <div className="space-y-4">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-full sm:w-[260px]">
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
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardCard padding="sm" spotlight={false}>
              <h4 className="mb-3 text-base font-semibold">Students by Lecture</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor", fontSize: 11 }}
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
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="online"
                      name="Online"
                      fill="hsl(142, 71%, 45%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="attended"
                      name="Offline"
                      fill="hsl(48, 96%, 53%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard padding="sm" spotlight={false}>
              <h4 className="mb-3 text-base font-semibold">
                  Estimated Income by Lecture
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor", fontSize: 11 }}
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
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="offlineIncome"
                      name="Offline Income"
                      fill="hsl(48, 96%, 53%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="onlineIncome"
                      name="Online Income"
                      fill="hsl(142, 71%, 45%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="totalIncome"
                      name="Total"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard padding="sm" spotlight={false}>
              <h4 className="mb-3 text-base font-semibold">Homework Scores</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={homeworkScoresData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor", fontSize: 11 }}
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
                        `${Number(value).toFixed(1)}%`,
                        "Score",
                      ]}
                    />
                    <Bar
                      dataKey="score"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard padding="sm" spotlight={false}>
              <h4 className="mb-3 text-base font-semibold">Quiz Scores</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizScoresData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground"
                      tick={{ fill: "currentColor", fontSize: 11 }}
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
                        `${Number(value).toFixed(1)}%`,
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
            </DashboardCard>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

export default StatisticsPage;
