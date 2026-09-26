import {
  DiscountTarget,
  StudentDiscountItem,
  useAssignStudentDiscountsMutation,
  useDeleteStudentDiscountMutation,
  useStudentDiscountsQuery,
  useUpdateStudentDiscountMutation,
} from "@/api/discounts-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { levelMap } from "@/components/dashboard/student-picker";
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
import { toast } from "@/components/ui/use-toast";
import { useGetAllStudents } from "@/generated/api";
import { SingleStudent } from "@/generated/model";
import { cn } from "@/lib/utils";
import { BadgePercent, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const APPLIES_OPTIONS: { value: DiscountTarget; label: string }[] = [
  { value: "Lecture", label: "Lecture price" },
  { value: "Renewal", label: "Renewal price" },
  { value: "Both", label: "Lecture and renewal" },
];

function appliesLabel(value: DiscountTarget) {
  return APPLIES_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function previewPrice(percentage: number) {
  const charged = Math.round(100 * (100 - percentage)) / 100;
  return charged;
}

const DiscountsPage = () => {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<SingleStudent[]>([]);
  const [percentage, setPercentage] = useState("20");
  const [appliesTo, setAppliesTo] = useState<DiscountTarget>("Both");
  const [listSearch, setListSearch] = useState("");
  const [page, setPage] = useState(1);

  const selectedIds = new Set(selectedStudents.map((student) => student.id));
  const { data: studentsData, isLoading: studentsLoading } = useGetAllStudents({
    page: 1,
    pageSize: 20,
    search: studentSearch,
  });
  const students = (studentsData?.data?.items ?? []).filter(
    (student) => !selectedIds.has(student.id)
  );

  const { data: discountsData, isLoading: discountsLoading } =
    useStudentDiscountsQuery({
      page,
      pageSize: 10,
      search: listSearch,
    });
  const discounts = discountsData?.data;

  const assignMutation = useAssignStudentDiscountsMutation();

  const parsedPercentage = Number(percentage);
  const percentageValid =
    Number.isFinite(parsedPercentage) &&
    parsedPercentage > 0 &&
    parsedPercentage <= 100;

  const assignDiscount = () => {
    if (selectedStudents.length === 0 || !percentageValid) return;

    assignMutation.mutate(
      {
        studentIds: selectedStudents.map((student) => student.id),
        percentage: parsedPercentage,
        appliesTo,
      },
      {
        onSuccess: (result) => {
          toast({
            title: "Discount saved",
            description: result.message,
          });
          setSelectedStudents([]);
          setStudentSearch("");
          setPage(1);
        },
      }
    );
  };

  return (
    <DashboardPageShell
      title="Discounts"
      description="Give selected students a percentage off the lecture price, the renewal price, or both."
      icon={BadgePercent}
      fullWidth
    >
      <DashboardCard>
        <h3 className="mb-1 text-lg font-semibold">Assign discount</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Each student keeps one discount. Saving again for the same student
          replaces it. The lower price is what they are charged.
        </p>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_240px]">
          <div className="space-y-3">
            <Label>Students</Label>
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <Badge
                    key={student.id}
                    variant="outline"
                    className="gap-1 border-color2/20 py-1 pl-2 pr-1"
                  >
                    <span>
                      {student.fullName} · {student.studentCode}
                    </span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      onClick={() =>
                        setSelectedStudents((current) =>
                          current.filter((item) => item.id !== student.id)
                        )
                      }
                      aria-label={`Remove ${student.fullName}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, or student ID..."
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
            </div>
            {studentsLoading ? (
              <Loading />
            ) : students.length > 0 ? (
              <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-xl border border-color2/10">
                {students.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudents((current) => [...current, student])
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                        "hover:bg-color2/10 focus-visible:bg-color2/10 focus-visible:outline-none"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{student.fullName}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {student.studentCode} · {student.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-color2/20">
                        {levelMap[student.level]}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {studentSearch
                  ? "No matching students."
                  : "Search to add students."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-percentage">Percentage</Label>
            <Input
              id="discount-percentage"
              type="number"
              min={0.01}
              max={100}
              step={0.5}
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {percentageValid
                ? `Example: 100 LE becomes ${previewPrice(parsedPercentage)} LE.`
                : "Enter a percentage greater than 0 and up to 100."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Applies to</Label>
            <Select
              value={appliesTo}
              onValueChange={(value) => setAppliesTo(value as DiscountTarget)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLIES_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={
                assignMutation.isPending ||
                selectedStudents.length === 0 ||
                !percentageValid
              }
              onClick={assignDiscount}
            >
              {assignMutation.isPending ? "Saving..." : "Save discount"}
            </Button>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Current discounts</h3>
          <Input
            className="w-full max-w-xs"
            placeholder="Search discounts..."
            value={listSearch}
            onChange={(event) => {
              setListSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {discountsLoading ? (
          <Loading />
        ) : (discounts?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No discounts yet. Choose students above and save a percentage.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Student</th>
                    <th className="px-2 py-2 font-medium">Percentage</th>
                    <th className="px-2 py-2 font-medium">Applies to</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts?.items.map((item) => (
                    <DiscountRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {discounts?.totalCount ?? 0} students
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!discounts?.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!discounts?.hasNextPage}
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

function DiscountRow({ item }: { item: StudentDiscountItem }) {
  const [percentage, setPercentage] = useState(String(item.percentage));
  const [appliesTo, setAppliesTo] = useState<DiscountTarget>(item.appliesTo);
  const updateMutation = useUpdateStudentDiscountMutation();
  const deleteMutation = useDeleteStudentDiscountMutation();

  useEffect(() => {
    setPercentage(String(item.percentage));
    setAppliesTo(item.appliesTo);
  }, [item.percentage, item.appliesTo, item.id]);

  const parsed = Number(percentage);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= 100;

  return (
    <tr className="border-b align-top last:border-0">
      <td className="px-2 py-3">
        <p className="font-medium">{item.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {item.studentCode} · {levelMap[item.level]} · {item.phoneNumber}
        </p>
      </td>
      <td className="px-2 py-3">
        <Input
          className="w-24"
          type="number"
          min={0.01}
          max={100}
          step={0.5}
          value={percentage}
          onChange={(event) => setPercentage(event.target.value)}
          aria-label={`Percentage for ${item.fullName}`}
        />
      </td>
      <td className="px-2 py-3">
        <Select
          value={appliesTo}
          onValueChange={(value) => setAppliesTo(value as DiscountTarget)}
        >
          <SelectTrigger className="w-48" aria-label={`Applies to for ${item.fullName}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLIES_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={updateMutation.isPending || !valid}
            onClick={() =>
              updateMutation.mutate(
                { id: item.id, percentage: parsed, appliesTo },
                {
                  onSuccess: () =>
                    toast({
                      title: "Discount updated",
                      description: `${item.fullName} now has ${parsed}% off ${appliesLabel(appliesTo).toLowerCase()}.`,
                    }),
                }
              )
            }
          >
            Save
          </Button>
          <Confirmation
            title="Remove discount"
            description={`${item.fullName} will pay the full lecture and renewal prices again.`}
            onConfirm={() =>
              deleteMutation.mutate(item.id, {
                onSuccess: () =>
                  toast({
                    title: "Discount removed",
                    description: item.fullName,
                  }),
              })
            }
            button={
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            }
          />
        </div>
      </td>
    </tr>
  );
}

export default DiscountsPage;
