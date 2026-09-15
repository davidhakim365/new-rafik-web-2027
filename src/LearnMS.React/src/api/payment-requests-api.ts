import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
};

export type PaymentRequestsPage = {
  items: PaymentRequestItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

const getPaymentRequests = (params: GetPaymentRequestsParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  return api
    .get<ApiSuccess<PaymentRequestsPage>>(
      `/api/payment-requests?${searchParams.toString()}`
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
