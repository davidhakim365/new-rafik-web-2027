import {
  useAssistantTraceOptionsQuery,
  useAssistantTracesQuery,
} from "@/api/assistant-traces-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { History, Search } from "lucide-react";
import { useMemo, useState } from "react";

const ALL = "all";

function assistantLabel(fullName: string, email: string) {
  return fullName.trim() || email;
}

const AssistantTracesPage = () => {
  const [who, setWho] = useState(ALL);
  const [courseId, setCourseId] = useState(ALL);
  const [lectureId, setLectureId] = useState(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: optionsData, isLoading: optionsLoading } = useAssistantTraceOptionsQuery();
  const options = optionsData?.data;

  const lectures = useMemo(() => {
    const items = options?.lectures ?? [];
    if (courseId === ALL) return items;
    return items.filter((lecture) => lecture.courseId === courseId);
  }, [options?.lectures, courseId]);

  const { data: tracesData, isLoading: tracesLoading } = useAssistantTracesQuery({
    page,
    pageSize: 20,
    search: search.trim() || undefined,
    courseId: courseId === ALL ? undefined : courseId,
    lectureId: lectureId === ALL ? undefined : lectureId,
    actor: who === ALL ? undefined : who,
  });
  const traces = tracesData?.data;

  return (
    <DashboardPageShell
      title="Assistant Trace"
      description="See what assistants change on the site. Filter by course, lecture, an assistant, or your own admin actions."
      icon={History}
    >
      <DashboardCard>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Who</Label>
            <Select
              value={who}
              onValueChange={(value) => {
                setWho(value);
                setPage(1);
              }}
              disabled={optionsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Everyone</SelectItem>
                <SelectItem value="me">Me (admin)</SelectItem>
                {(options?.assistants ?? []).map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistantLabel(assistant.fullName, assistant.email)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Course</Label>
            <Select
              value={courseId}
              onValueChange={(value) => {
                setCourseId(value);
                setLectureId(ALL);
                setPage(1);
              }}
              disabled={optionsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All courses</SelectItem>
                {(options?.courses ?? []).map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lecture</Label>
            <Select
              value={lectures.some((lecture) => lecture.id === lectureId) ? lectureId : ALL}
              onValueChange={(value) => {
                setLectureId(value);
                setPage(1);
              }}
              disabled={optionsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All lectures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All lectures</SelectItem>
                {lectures.map((lecture) => (
                  <SelectItem key={lecture.id} value={lecture.id}>
                    {courseId === ALL ? `${lecture.courseTitle} · ${lecture.title}` : lecture.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Action, name, course..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        {tracesLoading ? (
          <Loading />
        ) : (traces?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No actions yet. Changes that assistants or you make will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Who</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                    <th className="px-2 py-2 font-medium">Course</th>
                    <th className="px-2 py-2 font-medium">Lecture</th>
                  </tr>
                </thead>
                <tbody>
                  {traces?.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                        {format(new Date(item.createdAt), "d MMM yyyy, h:mm a")}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{item.actorName}</span>
                          <Badge variant={item.actorRole === "Teacher" ? "default" : "secondary"} className="w-fit">
                            {item.actorRole === "Teacher" ? "Admin" : "Assistant"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <p className="font-medium">{item.action}</p>
                        {item.detail && (
                          <p className="mt-1 text-muted-foreground">{item.detail}</p>
                        )}
                      </td>
                      <td className="px-2 py-3">{item.courseTitle || "—"}</td>
                      <td className="px-2 py-3">{item.lectureTitle || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {traces?.totalCount ?? 0} actions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!traces?.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!traces?.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default AssistantTracesPage;
