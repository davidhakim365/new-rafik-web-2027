import { ApiResponse } from "@/api";
import { ApiError } from "@/lib/axiosCustomInstant";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const PARENT_TOKEN_KEY = "parentToken";
export const PARENT_STUDENT_KEY = "parentStudent";

export const ParentLoginRequest = z.object({
  studentCode: z.string().min(1, { message: "Student ID is required" }),
  phoneNumber: z.string().min(8, { message: "Student phone number is required" }),
  parentPhoneNumber: z
    .string()
    .min(8, { message: "Parent phone number is required" }),
});

export type ParentLoginRequest = z.infer<typeof ParentLoginRequest>;

export type ParentStudentSummary = {
  id: string;
  fullName: string;
  studentCode: string;
  level: "Level0" | "Level1" | "Level2" | "Level3";
  schoolName: string;
};

export type ParentLoginResult = {
  token: string;
  student: ParentStudentSummary;
};

export type ParentStatistics = {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  quizCount: number;
  examCount: number;
  averageQuizScorePercent: number | null;
  averageExamScorePercent: number | null;
};

export type ParentAttendanceItem = {
  lectureId: string;
  lectureTitle: string;
  courseTitle: string;
  attended: boolean;
  attendedAt: string | null;
};

export type ParentQuizGradeItem = {
  lectureId: string;
  lectureTitle: string;
  courseTitle: string;
  offlineQuizScore: number | null;
  homeworkScore: number | null;
  onlineCorrect: number | null;
  onlineTotal: number | null;
};

export type ParentExamGradeItem = {
  examId: string;
  title: string;
  courseTitle: string;
  studentScore: number | null;
  totalScore: number | null;
  submittedAt: string | null;
};

export type ParentProgressResult = {
  student: ParentStudentSummary;
  statistics: ParentStatistics;
  attendance: ParentAttendanceItem[];
  quizGrades: ParentQuizGradeItem[];
  examGrades: ParentExamGradeItem[];
};

const parentApi = axios.create();

parentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response?.status >= 400) {
      const data = error.response.data as { code?: string; message?: string };

      if (error.response.status === 401) {
        clearParentSession();
      }

      toast({
        title: "Error",
        description: data.message ?? error.message,
        variant: "destructive",
      });

      throw new ApiError(data.code ?? "error", data.message ?? error.message);
    }

    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });

    return Promise.reject(error);
  }
);

export function clearParentSession() {
  localStorage.removeItem(PARENT_TOKEN_KEY);
  localStorage.removeItem(PARENT_STUDENT_KEY);
}

export function getParentToken() {
  return localStorage.getItem(PARENT_TOKEN_KEY);
}

export function getStoredParentStudent(): ParentStudentSummary | null {
  const raw = localStorage.getItem(PARENT_STUDENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParentStudentSummary;
  } catch {
    return null;
  }
}

export function useParentLoginMutation() {
  const qrc = useQueryClient();
  return useMutation<ApiResponse<ParentLoginResult>, ApiError, ParentLoginRequest>({
    mutationKey: ["parent-login"],
    throwOnError: false,
    mutationFn: (data) =>
      parentApi.post("/api/parent/login", data).then((res) => res.data),
    onSuccess: (res) => {
      if (!res.status) return;
      localStorage.setItem(PARENT_TOKEN_KEY, res.data.token);
      localStorage.setItem(PARENT_STUDENT_KEY, JSON.stringify(res.data.student));
      qrc.invalidateQueries({ queryKey: ["parent-progress"] });
    },
  });
}

export function useParentProgressQuery(enabled = true) {
  return useQuery<ApiResponse<ParentProgressResult>, ApiError>({
    queryKey: ["parent-progress"],
    enabled: enabled && !!getParentToken(),
    queryFn: () => {
      const token = getParentToken();
      if (!token) throw new ApiError("parent/invalid-token", "Not signed in");
      return parentApi
        .get("/api/parent/progress", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.data);
    },
    retry: false,
  });
}

export function useParentLogout() {
  const qrc = useQueryClient();
  return () => {
    clearParentSession();
    qrc.removeQueries({ queryKey: ["parent-progress"] });
  };
}
