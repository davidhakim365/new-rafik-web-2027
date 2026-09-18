import Confirmation from "@/components/confirmation";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  PaymentRequestItem,
  useConfirmPaymentRequestMutation,
  useCreatePaymentRequestRejectionReasonMutation,
  usePaymentRequestRejectionReasonsQuery,
  usePaymentRequestStatsQuery,
  usePaymentRequestsQuery,
  useRejectPaymentRequestMutation,
} from "@/api/payment-requests-api";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { format } from "date-fns";
import { CheckCircle2, Clock, Plus, Search, Wallet, XCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: string) {
  if (status === "Confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (status === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
}

const OTHER_REJECTION_OPTION = "other";

function StatusCountCard({
  title,
  value,
  icon: Icon,
  active,
  className,
  iconClassName,
  onClick,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  active: boolean;
  className: string;
  iconClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
        className,
        active && "ring-2 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </button>
  );
}

const PaymentRequestsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: parseInt(searchParams.get("page") || "1", 10) - 1,
    pageSize: parseInt(searchParams.get("pageSize") || "10", 10),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "Pending");
  const [preview, setPreview] = useState<PaymentRequestItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentRequestItem | null>(
    null
  );
  const [rejectOption, setRejectOption] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const query = usePaymentRequestsQuery({
    page: pageIndex + 1,
    pageSize,
    search,
    status,
  });
  const statsQuery = usePaymentRequestStatsQuery();
  const reasonsQuery = usePaymentRequestRejectionReasonsQuery();
  const confirmMutation = useConfirmPaymentRequestMutation();
  const rejectMutation = useRejectPaymentRequestMutation();
  const addReasonMutation = useCreatePaymentRequestRejectionReasonMutation();
  const rejectionReasons = reasonsQuery.data?.data ?? [];

  const pendingId = confirmMutation.isPending
    ? confirmMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables?.id
      : null;

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
  }, [pageIndex, pageSize, search, status, setSearchParams]);

  const columns = useMemo<ColumnDef<PaymentRequestItem>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-sm">
            {format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm")}
          </div>
        ),
      },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-[180px] space-y-0.5">
              <Link
                to={`/dashboard/students/${item.studentId}`}
                className="font-medium text-primary hover:underline"
              >
                {item.studentName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {item.studentEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.studentPhone} · {item.studentCode}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount LE",
        cell: ({ row }) => (
          <div className="font-semibold">{row.original.amount} LE</div>
        ),
      },
      {
        id: "transfer",
        header: "Transfer",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button
              type="button"
              className="h-12 w-12 overflow-hidden rounded-md border bg-muted"
              onClick={() => setPreview(item)}
            >
              <img
                src={item.imageThumbUrl || item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          );
        },
      },
      {
        id: "lastRequest",
        header: "Last approved",
        cell: ({ row }) => {
          const item = row.original;
          if (!item.lastRequestAt || !item.lastRequestImageUrl) {
            return (
              <span className="text-sm text-muted-foreground">No approved request</span>
            );
          }
          const sameImage =
            item.lastRequestImageUrl === item.imageUrl ||
            (!!item.lastRequestImageThumbUrl &&
              item.lastRequestImageThumbUrl === item.imageThumbUrl);
          return (
            <div className="flex min-w-[160px] items-start gap-2 text-start">
              <button
                type="button"
                className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted"
                onClick={() => setPreview(item)}
              >
                <img
                  src={item.lastRequestImageThumbUrl || item.lastRequestImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="min-w-0 space-y-0.5">
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  {format(new Date(item.lastRequestAt), "dd MMM yyyy, HH:mm")}
                </p>
                <p className="text-xs font-medium">
                  {item.lastRequestAmount} LE · {item.lastRequestStatus}
                </p>
                {sameImage && (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Same screenshot
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "note",
        header: "Note",
        size: 280,
        cell: ({ row }) => (
          <div className="max-w-[28rem] whitespace-pre-wrap break-words text-start text-sm text-muted-foreground">
            {row.original.note || "—"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-1">
              <Badge className={statusBadgeClass(item.status)}>
                {item.status}
              </Badge>
              {item.status === "Rejected" && item.rejectionReason && (
                <p className="max-w-[16rem] whitespace-pre-wrap break-words text-start text-xs text-rose-600">
                  {item.rejectionReason}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          if (item.status !== "Pending") return null;
          const busy = pendingId === item.id;
          return (
            <div className="flex flex-wrap gap-2">
              <Confirmation
                title="Confirm payment?"
                description={`Add ${item.amount} LE to ${item.studentName}'s balance.`}
                disabled={busy}
                onConfirm={() => {
                  confirmMutation.mutate(item.id, {
                    onSuccess: (res) => {
                      toast({
                        title: res.message ?? "Payment confirmed",
                      });
                    },
                  });
                }}
                button={
                  <Button size="sm" disabled={busy}>
                    Confirm
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white"
                disabled={busy}
                onClick={() => {
                  setRejectOption("");
                  setOtherReason("");
                  setRejectTarget(item);
                }}
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [confirmMutation, pendingId]
  );

  const resetRejectForm = () => {
    setRejectTarget(null);
    setRejectOption("");
    setOtherReason("");
  };

  const selectedReasonText =
    rejectOption === OTHER_REJECTION_OPTION
      ? otherReason.trim()
      : rejectionReasons.find((reason) => reason.id === rejectOption)?.text ??
        "";

  const onReject = () => {
    if (!rejectTarget) return;
    const reason = selectedReasonText;
    if (!reason) {
      toast({
        title: "Choose a rejection comment",
        variant: "destructive",
      });
      return;
    }
    const id = rejectTarget.id;
    rejectMutation.mutate(
      { id, reason },
      {
        onSuccess: (res) => {
          toast({ title: res.message ?? "Payment request rejected" });
          resetRejectForm();
        },
      }
    );
  };

  const onSaveOtherOption = () => {
    const text = otherReason.trim();
    if (!text) return;
    addReasonMutation.mutate(text, {
      onSuccess: (res) => {
        if (res.data?.id) {
          setRejectOption(res.data.id);
          setOtherReason("");
        }
        toast({ title: res.message ?? "Comment saved as a constant option" });
      },
    });
  };

  return (
    <DashboardPageShell
      title="Payment Requests"
      description="Review transfer screenshots and confirm or reject student credit requests."
      icon={Wallet}
      fullWidth
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusCountCard
          title="Pending"
          value={statsQuery.data?.data?.pending ?? 0}
          icon={Clock}
          active={status === "Pending"}
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          iconClassName="bg-amber-500/20 text-amber-600"
          onClick={() => {
            setStatus("Pending");
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        />
        <StatusCountCard
          title="Approved"
          value={statsQuery.data?.data?.confirmed ?? 0}
          icon={CheckCircle2}
          active={status === "Confirmed"}
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          iconClassName="bg-emerald-500/20 text-emerald-600"
          onClick={() => {
            setStatus("Confirmed");
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        />
        <StatusCountCard
          title="Declined"
          value={statsQuery.data?.data?.rejected ?? 0}
          icon={XCircle}
          active={status === "Rejected"}
          className="border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          iconClassName="bg-rose-500/20 text-rose-600"
          onClick={() => {
            setStatus("Rejected");
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        />
      </div>

      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, or phone"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={query.data?.data?.items ?? []}
            getRowId={(row) => row.id}
            pagination={{
              hasNextPage: query.data?.data?.hasNextPage ?? false,
              hasPreviousPage: query.data?.data?.hasPreviousPage ?? false,
              pageCount: query.data?.data?.totalCount ?? 0,
              pageIndex,
              pageSize,
            }}
            rowCount={query.data?.data?.totalCount ?? 0}
            setPagination={setPagination}
          />
        )}
      </DashboardCard>

      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {preview
                ? `${preview.studentName} · ${preview.amount} LE`
                : "Transfer screenshot"}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {preview.note && (
                <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 text-sm">
                  {preview.note}
                </p>
              )}
              <div
                className={
                  preview.lastRequestImageUrl
                    ? "grid gap-4 md:grid-cols-2"
                    : "grid gap-4"
                }
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Current · {format(new Date(preview.createdAt), "dd MMM yyyy, HH:mm")}
                  </p>
                  <img
                    src={preview.imageUrl}
                    alt=""
                    className="max-h-[70vh] w-full rounded-lg object-contain"
                  />
                </div>
                {preview.lastRequestImageUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Last approved ·{" "}
                      {preview.lastRequestAt
                        ? format(
                            new Date(preview.lastRequestAt),
                            "dd MMM yyyy, HH:mm"
                          )
                        : "—"}{" "}
                      · {preview.lastRequestAmount} LE · {preview.lastRequestStatus}
                    </p>
                    {(preview.lastRequestImageUrl === preview.imageUrl ||
                      (!!preview.lastRequestImageThumbUrl &&
                        preview.lastRequestImageThumbUrl ===
                          preview.imageThumbUrl)) && (
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Same screenshot as current request
                      </p>
                    )}
                    <img
                      src={preview.lastRequestImageUrl}
                      alt=""
                      className="max-h-[70vh] w-full rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && !rejectMutation.isPending) {
            resetRejectForm();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject payment request?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget?.studentName} will see this comment. The balance
              will not change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Select
              value={rejectOption || undefined}
              onValueChange={setRejectOption}
              disabled={rejectMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a rejection comment" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {rejectionReasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    <span className="whitespace-normal text-start">
                      {reason.text}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_REJECTION_OPTION}>Other</SelectItem>
              </SelectContent>
            </Select>
            {rejectOption === OTHER_REJECTION_OPTION && (
              <div className="space-y-2">
                <Textarea
                  maxLength={500}
                  placeholder="Write a new constant comment"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={
                    !otherReason.trim() || addReasonMutation.isPending
                  }
                  onClick={onSaveOtherOption}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Save as constant option
                </Button>
                <p className="text-xs text-muted-foreground">
                  This comment is saved to the dropdown for next time.
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={rejectMutation.isPending || !selectedReasonText}
              onClick={(e) => {
                e.preventDefault();
                onReject();
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageShell>
  );
};

export default PaymentRequestsPage;
