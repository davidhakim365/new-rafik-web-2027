import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/** How often an open payment inbox asks the server for new requests. */
const PAYMENT_REQUESTS_POLL_MS = 5_000;

function isPaymentInboxVisible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

export type PaymentRequestStatus = "Pending" | "Confirmed" | "Rejected";

export type PaymentRequestItem = {
  id: string;
  amount: number;
  imageUrl: string;
  imageThumbUrl?: string | null;
  note?: string | null;
  status: PaymentRequestStatus | string;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentCode: string;
  lastRequestAt?: string | null;
  lastRequestAmount?: number | null;
  lastRequestStatus?: PaymentRequestStatus | string | null;
  lastRequestImageUrl?: string | null;
  lastRequestImageThumbUrl?: string | null;
  lastRequestNote?: string | null;
};

export type PaymentRequestsPage = {
  items: PaymentRequestItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaymentRequestStats = {
  pending: number;
  confirmed: number;
  rejected: number;
  total: number;
};

export type PaymentRequestRejectionReason = {
  id: string;
  text: string;
  sortOrder: number;
};

export type PaymentSettings = {
  instapayNumber?: string | null;
  walletNumber?: string | null;
  updatedAt: string;
};

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type GetPaymentRequestsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PaymentRequestStatus | "all" | string;
};

export const PAYMENT_REQUESTS_QUERY_KEY = "payment-requests";

export function getPaymentRequestsQueryKey(params?: GetPaymentRequestsParams) {
  return [PAYMENT_REQUESTS_QUERY_KEY, params ?? {}] as const;
}

export function getMyPaymentRequestsQueryKey(params?: {
  page?: number;
  pageSize?: number;
}) {
  return [PAYMENT_REQUESTS_QUERY_KEY, "mine", params ?? {}] as const;
}

export function getPaymentRequestStatsQueryKey() {
  return [PAYMENT_REQUESTS_QUERY_KEY, "stats"] as const;
}

export function getPaymentRequestRejectionReasonsQueryKey() {
  return [PAYMENT_REQUESTS_QUERY_KEY, "rejection-reasons"] as const;
}

export function getPaymentSettingsQueryKey() {
  return [PAYMENT_REQUESTS_QUERY_KEY, "settings"] as const;
}

const getPaymentRequests = (params: GetPaymentRequestsParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  // Some phones reuse an identical GET and keep showing an old queue.
  searchParams.set("_", String(Date.now()));

  return api
    .get<ApiSuccess<PaymentRequestsPage>>(
      `/api/payment-requests?${searchParams.toString()}`,
      { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
    )
    .then((res) => res.data);
};

const getMyPaymentRequests = (params?: { page?: number; pageSize?: number }) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params?.page ?? 1));
  searchParams.set("pageSize", String(params?.pageSize ?? 100));

  return api
    .get<ApiSuccess<PaymentRequestsPage>>(
      `/api/payment-requests/mine?${searchParams.toString()}`
    )
    .then((res) => res.data);
};

const getPaymentRequestStats = () =>
  api
    .get<ApiSuccess<PaymentRequestStats>>(
      `/api/payment-requests/stats?_=${Date.now()}`,
      { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
    )
    .then((res) => res.data);

const getPaymentRequestRejectionReasons = () =>
  api
    .get<ApiSuccess<PaymentRequestRejectionReason[]>>(
      "/api/payment-requests/rejection-reasons"
    )
    .then((res) => res.data);

const createPaymentRequestRejectionReason = (text: string) =>
  api
    .post<ApiSuccess<PaymentRequestRejectionReason>>(
      "/api/payment-requests/rejection-reasons",
      { text }
    )
    .then((res) => res.data);

const getPaymentSettings = () =>
  api
    .get<ApiSuccess<PaymentSettings>>("/api/payment-requests/settings")
    .then((res) => res.data);

const updatePaymentSettings = (body: {
  instapayNumber?: string | null;
  walletNumber?: string | null;
}) =>
  api
    .put<ApiSuccess<PaymentSettings>>("/api/payment-requests/settings", body)
    .then((res) => res.data);

const createPaymentRequest = (formData: FormData) =>
  api
    .post<ApiSuccess<PaymentRequestItem>>("/api/payment-requests", formData)
    .then((res) => res.data);

const confirmPaymentRequest = (id: string) =>
  api
    .post<ApiSuccess<PaymentRequestItem>>(`/api/payment-requests/${id}/confirm`)
    .then((res) => res.data);

const rejectPaymentRequest = (vars: { id: string; reason?: string }) =>
  api
    .post<ApiSuccess<PaymentRequestItem>>(
      `/api/payment-requests/${vars.id}/reject`,
      { reason: vars.reason }
    )
    .then((res) => res.data);

export function usePaymentRequestsQuery(params: GetPaymentRequestsParams) {
  return useQuery({
    queryKey: getPaymentRequestsQueryKey(params),
    queryFn: () => getPaymentRequests(params),
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchIntervalInBackground: false,
    refetchInterval: () =>
      isPaymentInboxVisible() ? PAYMENT_REQUESTS_POLL_MS : false,
  });
}

export function useMyPaymentRequestsQuery(params?: {
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: getMyPaymentRequestsQueryKey(params),
    queryFn: () => getMyPaymentRequests(params),
  });
}

export function usePaymentRequestStatsQuery() {
  return useQuery({
    queryKey: getPaymentRequestStatsQueryKey(),
    queryFn: getPaymentRequestStats,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchIntervalInBackground: false,
    refetchInterval: () =>
      isPaymentInboxVisible() ? PAYMENT_REQUESTS_POLL_MS : false,
  });
}

/** Phones often freeze timers while the screen is off and skip the normal focus refresh. */
export function useRefreshPaymentRequestsOnWake() {
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void qc.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (key[0] !== PAYMENT_REQUESTS_QUERY_KEY) return false;
          // List and counts only. Settings stay put so a half-typed number is not wiped.
          return key[1] === "stats" || typeof key[1] === "object";
        },
      });
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [qc]);
}

export function usePaymentSettingsQuery() {
  return useQuery({
    queryKey: getPaymentSettingsQueryKey(),
    queryFn: getPaymentSettings,
  });
}

export function useUpdatePaymentSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: updatePaymentSettings,
    onSuccess: (res) => {
      qc.setQueryData(getPaymentSettingsQueryKey(), res);
    },
  });
}

export function usePaymentRequestRejectionReasonsQuery() {
  return useQuery({
    queryKey: getPaymentRequestRejectionReasonsQueryKey(),
    queryFn: getPaymentRequestRejectionReasons,
  });
}

export function useCreatePaymentRequestRejectionReasonMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: (text: string) => createPaymentRequestRejectionReason(text),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getPaymentRequestRejectionReasonsQueryKey(),
      });
    },
  });
}

function invalidatePaymentRequests(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [PAYMENT_REQUESTS_QUERY_KEY] });
}

export function useCreatePaymentRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: (formData: FormData) => createPaymentRequest(formData),
    onSuccess: () => invalidatePaymentRequests(qc),
  });
}

export function useConfirmPaymentRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: (id: string) => confirmPaymentRequest(id),
    onSuccess: () => invalidatePaymentRequests(qc),
  });
}

export function useRejectPaymentRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: (vars: { id: string; reason?: string }) =>
      rejectPaymentRequest(vars),
    onSuccess: () => invalidatePaymentRequests(qc),
  });
}
