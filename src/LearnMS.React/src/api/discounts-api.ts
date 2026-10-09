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

export type DiscountLectureOption = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  level?: StudentLevel | null;
  price?: number | null;
  renewalPrice?: number | null;
};

export type LectureDiscountCandidate = {
  studentId: string;
  fullName: string;
  studentCode: string;
  phoneNumber: string;
  email: string;
  level: StudentLevel;
  attendedCount: number;
  courseLectureCount: number;
  discountId?: string | null;
  percentage?: number | null;
  appliesTo?: DiscountTarget | null;
};

export type LectureStudentDiscountItem = {
  id: string;
  studentId: string;
  lectureId: string;
  lectureTitle: string;
  fullName: string;
  studentCode: string;
  phoneNumber: string;
  level: StudentLevel;
  attendedCount: number;
  percentage: number;
  appliesTo: DiscountTarget;
  createdAt: string;
};

export type LectureDiscountCandidatesPage = {
  items: LectureDiscountCandidate[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type LectureStudentDiscountsPage = {
  items: LectureStudentDiscountItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export const DISCOUNTS_QUERY_KEY = "student-discounts";
export const LECTURE_DISCOUNTS_QUERY_KEY = "lecture-student-discounts";

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

const getDiscountLectures = () =>
  api
    .get<ApiSuccess<DiscountLectureOption[]>>("/api/discounts/lectures")
    .then((res) => res.data);

const getLectureDiscountCandidates = (
  lectureId: string,
  params: { page?: number; pageSize?: number; search?: string; minAttendance?: number }
) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 20));
  searchParams.set("minAttendance", String(params.minAttendance ?? 0));
  if (params.search) searchParams.set("search", params.search);

  return api
    .get<ApiSuccess<LectureDiscountCandidatesPage>>(
      `/api/discounts/lectures/${lectureId}/students?${searchParams.toString()}`
    )
    .then((res) => res.data);
};

const getLectureStudentDiscounts = (
  lectureId: string,
  params: { page?: number; pageSize?: number; search?: string }
) => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));
  if (params.search) searchParams.set("search", params.search);

  return api
    .get<ApiSuccess<LectureStudentDiscountsPage>>(
      `/api/discounts/lectures/${lectureId}?${searchParams.toString()}`
    )
    .then((res) => res.data);
};

const assignLectureStudentDiscounts = (vars: {
  lectureId: string;
  studentIds: string[];
  percentage: number;
  appliesTo: DiscountTarget;
}) =>
  api
    .post<ApiSuccess<LectureStudentDiscountItem[]>>(
      `/api/discounts/lectures/${vars.lectureId}`,
      {
        studentIds: vars.studentIds,
        percentage: vars.percentage,
        appliesTo: vars.appliesTo,
      }
    )
    .then((res) => res.data);

const updateLectureStudentDiscount = (vars: {
  id: string;
  percentage: number;
  appliesTo: DiscountTarget;
}) =>
  api
    .patch<ApiSuccess<LectureStudentDiscountItem>>(
      `/api/discounts/lecture-discounts/${vars.id}`,
      { percentage: vars.percentage, appliesTo: vars.appliesTo }
    )
    .then((res) => res.data);

const deleteLectureStudentDiscount = (id: string) =>
  api
    .delete<ApiSuccess<string>>(`/api/discounts/lecture-discounts/${id}`)
    .then((res) => res.data);

function invalidateDiscounts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [DISCOUNTS_QUERY_KEY] });
}

function invalidateLectureDiscounts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [LECTURE_DISCOUNTS_QUERY_KEY] });
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

export function useDiscountLecturesQuery() {
  return useQuery({
    queryKey: [LECTURE_DISCOUNTS_QUERY_KEY, "lectures"],
    queryFn: getDiscountLectures,
  });
}

export function useLectureDiscountCandidatesQuery(
  lectureId: string | null,
  params: { page?: number; pageSize?: number; search?: string; minAttendance?: number }
) {
  return useQuery({
    queryKey: [LECTURE_DISCOUNTS_QUERY_KEY, "candidates", lectureId, params],
    queryFn: () => getLectureDiscountCandidates(lectureId!, params),
    enabled: !!lectureId,
  });
}

export function useLectureStudentDiscountsQuery(
  lectureId: string | null,
  params: { page?: number; pageSize?: number; search?: string }
) {
  return useQuery({
    queryKey: [LECTURE_DISCOUNTS_QUERY_KEY, "saved", lectureId, params],
    queryFn: () => getLectureStudentDiscounts(lectureId!, params),
    enabled: !!lectureId,
  });
}

export function useAssignLectureStudentDiscountsMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: assignLectureStudentDiscounts,
    onSuccess: () => invalidateLectureDiscounts(qc),
  });
}

export function useUpdateLectureStudentDiscountMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: updateLectureStudentDiscount,
    onSuccess: () => invalidateLectureDiscounts(qc),
  });
}

export function useDeleteLectureStudentDiscountMutation() {
  const qc = useQueryClient();
  return useMutation({
    throwOnError: false,
    mutationFn: deleteLectureStudentDiscount,
    onSuccess: () => invalidateLectureDiscounts(qc),
  });
}
