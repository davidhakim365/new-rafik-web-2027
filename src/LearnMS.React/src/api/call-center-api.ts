import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CallCenterStudent = {
  id: string;
  studentCode: string;
  fullName: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  attended: boolean;
  homeworkScore?: number | null;
  chooseHomeworkScore?: number | null;
  quizScore?: number | null;
  comment?: string | null;
  called: boolean;
  calledAt?: string | null;
};

export type CallCenterStudentsPage = {
  items: CallCenterStudent[];
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

export type GetCallCenterStudentsParams = {
  courseId: string;
  lectureId: string;
  search?: string;
  attendance?: "all" | "present" | "absent";
  page?: number;
  pageSize?: number;
};

export function getCallCenterStudentsQueryKey(params: GetCallCenterStudentsParams) {
  return ["call-center-students", params] as const;
}

export const getCallCenterStudents = (params: GetCallCenterStudentsParams) => {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.attendance && params.attendance !== "all") {
    searchParams.set("attendance", params.attendance);
  }
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 50));

  const qs = searchParams.toString();
  return api
    .get<ApiSuccess<CallCenterStudentsPage>>(
      `/api/call-center/courses/${params.courseId}/lectures/${params.lectureId}/students${
        qs ? `?${qs}` : ""
      }`
    )
    .then((res) => res.data);
};

export const upsertCallCenterStudent = (vars: {
  courseId: string;
  lectureId: string;
  studentId: string;
  comment?: string | null;
  called?: boolean;
}) =>
  api
    .put<ApiSuccess<CallCenterStudent>>(
      `/api/call-center/courses/${vars.courseId}/lectures/${vars.lectureId}/students/${vars.studentId}`,
      {
        comment: vars.comment,
        called: vars.called,
      }
    )
    .then((res) => res.data);

export function useCallCenterStudentsQuery(
  params: GetCallCenterStudentsParams | null
) {
  return useQuery({
    queryKey: params
      ? getCallCenterStudentsQueryKey(params)
      : ["call-center-students", "idle"],
    queryFn: () => getCallCenterStudents(params!),
    enabled: !!params?.courseId && !!params?.lectureId,
  });
}

export function useUpsertCallCenterStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertCallCenterStudent,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["call-center-students"],
        predicate: (query) => {
          const key = query.queryKey[1] as GetCallCenterStudentsParams | undefined;
          return (
            !!key &&
            key.courseId === vars.courseId &&
            key.lectureId === vars.lectureId
          );
        },
      });
    },
  });
}

/** Build Egypt-friendly WhatsApp digits for wa.me */
export function toWhatsAppDigits(phone: string): string | null {
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length >= 12) digits = digits.slice(2);

  if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length === 10) return `20${digits}`;
  if (digits.length >= 11 && digits.startsWith("20")) return digits;
  if (digits.length >= 9) return `20${digits}`;
  return null;
}

export function buildCallCenterWhatsAppMessage(
  student: CallCenterStudent,
  lectureTitle: string,
  language: "ar" | "en"
): string {
  const score = (value?: number | null) =>
    value == null ? (language === "ar" ? "غير مسجل" : "N/A") : String(value);
  const attendance =
    language === "ar"
      ? student.attended
        ? "حاضر"
        : "غائب"
      : student.attended
        ? "Present"
        : "Absent";
  const comment =
    student.comment?.trim() ||
    (language === "ar" ? "لا يوجد" : "None");

  if (language === "ar") {
    return [
      `مرحباً، متابعة للطالب/ة: ${student.fullName}`,
      `كود الطالب: ${student.studentCode}`,
      `المحاضرة: ${lectureTitle}`,
      `الحضور: ${attendance}`,
      `واجب المقال: ${score(student.homeworkScore)}`,
      `واجب الاختيار: ${score(student.chooseHomeworkScore)}`,
      `درجة الاختبار: ${score(student.quizScore)}`,
      `ملاحظة: ${comment}`,
    ].join("\n");
  }

  return [
    `Hello, follow-up for student: ${student.fullName}`,
    `Student code: ${student.studentCode}`,
    `Lecture: ${lectureTitle}`,
    `Attendance: ${attendance}`,
    `Essay homework: ${score(student.homeworkScore)}`,
    `Choose homework: ${score(student.chooseHomeworkScore)}`,
    `Quiz score: ${score(student.quizScore)}`,
    `Comment: ${comment}`,
  ].join("\n");
}

export function openWhatsApp(phone: string, message: string): boolean {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return false;
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
