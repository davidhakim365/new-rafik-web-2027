import {
  AppleRewardItem,
  useAppleStoreItemsQuery,
  useAppleStoreOrdersQuery,
  useAppleStoreOverviewQuery,
  useAppleStoreSettingsQuery,
  useCreateAppleStoreItemMutation,
  useDeleteAppleStoreItemMutation,
  useUpdateAppleStoreItemMutation,
  useUpdateAppleStoreSettingsMutation,
} from "@/api/rewards-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { ImageUploadField } from "@/components/image-upload-field";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useDownloadFile from "@/hooks/useDownloadFile";
import { toast } from "@/lib/utils";
import { format } from "date-fns";
import {
  Apple,
  Download,
  Gift,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function toLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const emptyItemForm = {
  title: "",
  imageUrl: "",
  appleCost: 10,
  sortOrder: 0,
  isActive: true,
};

const AppleRewardsStorePage = () => {
  return (
    <DashboardPageShell
      title="Apple Rewards Store"
      description="Manage exchange items, when students can choose, and review their selections."
      icon={Gift}
      decorative
    >
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-color2/5 p-1">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <ItemsTab />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="statistics">
          <StatisticsTab />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
};

function ItemsTab() {
  const { data, isLoading } = useAppleStoreItemsQuery(true);
  const createMutation = useCreateAppleStoreItemMutation();
  const updateMutation = useUpdateAppleStoreItemMutation();
  const deleteMutation = useDeleteAppleStoreItemMutation();
  const [form, setForm] = useState(emptyItemForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items = data?.data ?? [];

  const resetForm = () => {
    setForm(emptyItemForm);
    setEditingId(null);
  };

  const startEdit = (item: AppleRewardItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      imageUrl: item.imageUrl,
      appleCost: item.appleCost,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
  };

  const onSave = () => {
    if (!form.title.trim() || !form.imageUrl.trim() || form.appleCost <= 0) {
      toast({
        title: "Missing fields",
        description: "Title, photo, and apple cost are required.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate(
        {
          itemId: editingId,
          data: {
            title: form.title.trim(),
            imageUrl: form.imageUrl,
            appleCost: form.appleCost,
            sortOrder: form.sortOrder,
            isActive: form.isActive,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Item updated" });
            resetForm();
          },
        }
      );
      return;
    }

    createMutation.mutate(
      {
        title: form.title.trim(),
        imageUrl: form.imageUrl,
        appleCost: form.appleCost,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      },
      {
        onSuccess: () => {
          toast({ title: "Item created" });
          resetForm();
        },
      }
    );
  };

  if (isLoading) return <Loading />;

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <DashboardCard>
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold">
            {editingId ? "Edit item" : "Add item"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Students exchange apples for these rewards while the store is open.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Notebook"
            />
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <ImageUploadField
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Apple cost</Label>
              <Input
                type="number"
                min={1}
                value={form.appleCost}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    appleCost: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-color2/10 px-3 py-2">
            <Label htmlFor="item-active">Active</Label>
            <Switch
              id="item-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isActive: checked }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {editingId ? "Save changes" : "Add item"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <DashboardCard className="sm:col-span-2 xl:col-span-3">
            <p className="py-10 text-center text-sm text-muted-foreground">
              No reward items yet. Add the first one.
            </p>
          </DashboardCard>
        ) : (
          items.map((item) => (
            <DashboardCard key={item.id} padding="sm" className="overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold leading-tight">{item.title}</h4>
                  <Badge variant={item.isActive ? "secondary" : "outline"}>
                    {item.isActive ? "Active" : "Off"}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <Apple className="size-4" />
                  {item.appleCost} apples
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Confirmation
                    button={
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    }
                    title="Deactivate this item?"
                    description="Students will no longer see it. Past choices stay in history."
                    onConfirm={() =>
                      deleteMutation.mutate(item.id, {
                        onSuccess: () => toast({ title: "Item deactivated" }),
                      })
                    }
                  />
                </div>
              </div>
            </DashboardCard>
          ))
        )}
      </div>
    </div>
  );
}

function ScheduleTab() {
  const { data, isLoading } = useAppleStoreSettingsQuery();
  const updateMutation = useUpdateAppleStoreSettingsMutation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");

  useEffect(() => {
    if (!data?.data) return;
    setIsEnabled(data.data.isEnabled);
    setOpensAt(toLocalInputValue(data.data.opensAt));
    setClosesAt(toLocalInputValue(data.data.closesAt));
  }, [data?.data]);

  if (isLoading) return <Loading />;

  const settings = data?.data;

  const onSave = () => {
    updateMutation.mutate(
      {
        isEnabled,
        opensAt: fromLocalInputValue(opensAt),
        closesAt: fromLocalInputValue(closesAt),
      },
      {
        onSuccess: (res) => {
          toast({
            title: "Schedule saved",
            description: res.data?.isOpen
              ? "Store is open for students now."
              : "Store is closed for students.",
          });
        },
      }
    );
  };

  return (
    <DashboardCard className="max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Store schedule</h3>
          <p className="text-sm text-muted-foreground">
            Students only see Apple Rewards while the store is enabled and inside
            this time window.
          </p>
        </div>
        <Badge
          variant="secondary"
          className={
            settings?.isOpen
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }
        >
          {settings?.isOpen ? "Open now" : "Closed"}
        </Badge>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-color2/10 px-4 py-3">
          <div>
            <p className="font-medium">Enable store</p>
            <p className="text-xs text-muted-foreground">
              Turn off anytime to hide the page from students
            </p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="opens-at">Opens at</Label>
            <Input
              id="opens-at"
              type="datetime-local"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty for no start limit</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closes-at">Closes at</Label>
            <Input
              id="closes-at"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty for no end limit</p>
          </div>
        </div>

        <Button onClick={onSave} disabled={updateMutation.isPending} className="gap-2">
          {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save schedule
        </Button>
      </div>
    </DashboardCard>
  );
}

function StatisticsTab() {
  const { data, isLoading } = useAppleStoreOverviewQuery();
  if (isLoading) return <Loading />;
  const overview = data?.data;

  const cards = [
    { label: "Active choices", value: overview?.activeOrders ?? 0 },
    { label: "Students choosing", value: overview?.uniqueStudents ?? 0 },
    { label: "Apples spent (active)", value: overview?.applesSpentActive ?? 0 },
    { label: "Cancelled", value: overview?.cancelledOrders ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard key={card.label} padding="sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
          </DashboardCard>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(overview?.items ?? []).map((item) => (
          <DashboardCard key={item.itemId} padding="sm">
            <div className="flex gap-3">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold">{item.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {item.appleCost} apples each
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-emerald-500/10 px-2 py-1">
                    <p className="font-semibold">{item.activeOrders}</p>
                    <p className="text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg bg-muted px-2 py-1">
                    <p className="font-semibold">{item.cancelledOrders}</p>
                    <p className="text-muted-foreground">Cancelled</p>
                  </div>
                  <div className="rounded-lg bg-color2/10 px-2 py-1">
                    <p className="font-semibold">{item.applesSpentActive}</p>
                    <p className="text-muted-foreground">Apples</p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}

function StudentsTab() {
  const [itemId, setItemId] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<string>("Active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: itemsData } = useAppleStoreItemsQuery(true);
  const { download, isDownloading } = useDownloadFile();

  const queryParams = useMemo(
    () => ({
      itemId: itemId === "all" ? undefined : itemId,
      level: level === "all" ? undefined : level,
      status: status === "all" ? undefined : status,
      search: search.trim() || undefined,
      page,
      pageSize: 50,
    }),
    [itemId, level, status, search, page]
  );

  const { data, isLoading } = useAppleStoreOrdersQuery(queryParams);
  const orders = data?.data?.items ?? [];
  const totalCount = data?.data?.totalCount ?? 0;
  const pageSize = data?.data?.pageSize ?? 50;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (itemId !== "all") params.set("itemId", itemId);
    if (level !== "all") params.set("level", level);
    if (status !== "all") params.set("status", status);
    const qs = params.toString();
    return `/api/rewards/store/admin/orders/export${qs ? `?${qs}` : ""}`;
  }, [itemId, level, status]);

  return (
    <div className="space-y-4">
      <DashboardCard padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Name, code, item…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select
                value={itemId}
                onValueChange={(v) => {
                  setItemId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  {(itemsData?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="Level0">Level 0</SelectItem>
                  <SelectItem value="Level1">Level 1</SelectItem>
                  <SelectItem value="Level2">Level 2</SelectItem>
                  <SelectItem value="Level3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={isDownloading}
            onClick={() => download(exportUrl, "apple-reward-orders.csv")}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export Excel (CSV)
          </Button>
        </div>
      </DashboardCard>

      <DashboardCard padding="sm">
        {isLoading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No student choices match these filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-color2/10 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Student</th>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Level</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">Apples</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Chosen at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-color2/10">
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="px-3 py-2.5 font-medium">
                        {order.studentFullName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {order.studentCode}
                      </td>
                      <td className="px-3 py-2.5">
                        {String(order.level).replace("Level", "Level ")}
                      </td>
                      <td className="px-3 py-2.5">{order.itemTitle}</td>
                      <td className="px-3 py-2.5">{order.appleCost}</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            order.status === "Active" ? "secondary" : "outline"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {totalCount} result{totalCount === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </DashboardCard>
    </div>
  );
}

export default AppleRewardsStorePage;
