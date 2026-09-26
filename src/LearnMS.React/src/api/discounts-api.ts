import { api } from "@/api";
import { StudentLevel } from "@/generated/model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DiscountTarget = "Lecture" | "Renewal" | "Both";

export type StudentDiscountItem = {
  id: string;
  studentId: string;
  fullName: string;
  studentCode: string;
  phoneNumber: string;
  email: string;
  level: StudentLevel;
  percentage: number;
  appliesTo: DiscountTarget;
  createdAt: string;
};

export type StudentDiscountsPage = {
  items: StudentDiscountItem[];
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

export type GetStudentDiscountsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export const DISCOUNTS_QUERY_KEY = "student-discounts";

export function getStudentDiscountsQueryKey(params?: GetStudentDiscountsParams) {
  return [DISCOUNTS_QUERY_KEY, params ?? {}] as const;
}

const getStudentDiscounts = (params: GetStudentDiscountsParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));
  if (params.search) searchParams.set("search", params.search);

  return api
    .get<ApiSuccess<StudentDiscountsPage>>(
      `/api/discounts?${searchParams.toString()}`
    )
    .then((res) => res.data);
};

const assignStudentDiscounts = (body: {
  studentIds: string[];
  percentage: number;
  appliesTo: DiscountTarget;
}) =>
  api
    .post<ApiSuccess<StudentDiscountItem[]>>("/api/discounts", body)
    .then((res) => res.data);

const updateStudentDiscount = (vars: {
  id: string;
  percentage: number;
  appliesTo: DiscountTarget;
}) =>
  api
    .patch<ApiSuccess<StudentDiscountItem>>(`/api/discounts/${vars.id}`, {
      percentage: vars.percentage,
      appliesTo: vars.appliesTo,
    })
    .then((res) => res.data);

const deleteStudentDiscount = (id: string) =>
  api
    .delete<ApiSuccess<string>>(`/api/discounts/${id}`)
    .then((res) => res.data);

function invalidateDiscounts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [DISCOUNTS_QUERY_KEY] });
}

export function useStudentDiscountsQuery(params: GetStudentDiscountsParams) {
  return useQuery({
    queryKey: getStudentDiscountsQueryKey(params),
    queryFn: () => getStudentDiscounts(params),
  });
}

export function useAssignStudentDiscountsMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: assignStudentDiscounts,
    onSuccess: () => invalidateDiscounts(qc),
  });
}

export function useUpdateStudentDiscountMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: updateStudentDiscount,
    onSuccess: () => invalidateDiscounts(qc),
  });
}

export function useDeleteStudentDiscountMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: deleteStudentDiscount,
    onSuccess: () => invalidateDiscounts(qc),
  });
}
