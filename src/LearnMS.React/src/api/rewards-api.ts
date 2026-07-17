import { ApiResponse, api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export type AssistantRewardEvent = {
  id: string;
  type: string;
  amount: number;
  sessionsAttendedAfter?: number | null;
  reason?: string | null;
  createdAt: string;
};

export type AssistantRewards = {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  code: string;
  apples: number;
  sessionsAttended: number;
  currentSessionValue: number;
  nextSessionValue: number;
  sessionsUntilNextBonus: number;
  baseSessionValue: number;
  sessionsPerMilestone: number;
  sessionBonusIncrement: number;
  events: AssistantRewardEvent[];
};

export type AttendAssistantSessionResult = {
  assistantId: string;
  fullName: string;
  email: string;
  code: string;
  apples: number;
  applesAdded: number;
  sessionsAttended: number;
  currentSessionValue: number;
  sessionsUntilNextBonus: number;
  message: string;
};

export type PayAssistantRewardsResult = {
  assistantsPaid: number;
  totalApplesPaid: number;
  message: string;
};

export const useMyRewardsQuery = () => {
  return useQuery<ApiResponse<AssistantRewards>>({
    queryKey: ["rewards", "me"],
    queryFn: () => api.get("/api/rewards/me").then((res) => res.data),
  });
};

export const useAssistantRewardsQuery = (assistantId: string) => {
  return useQuery<ApiResponse<AssistantRewards>>({
    queryKey: ["rewards", "assistant", assistantId],
    enabled: !!assistantId,
    queryFn: () =>
      api.get(`/api/rewards/assistants/${assistantId}`).then((res) => res.data),
  });
};

export const useAttendAssistantSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AttendAssistantSessionResult>, unknown, { assistantId: string }>({
    mutationFn: ({ assistantId }) =>
      api
        .post(`/api/rewards/assistants/${assistantId}/attend-session`)
        .then((res) => res.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["assistant", { id: vars.assistantId }] });
      qc.invalidateQueries({ queryKey: ["assistants"] });
    },
  });
};

export const AttendByCodeRequest = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});
export type AttendByCodeRequest = z.infer<typeof AttendByCodeRequest>;

export const useAttendAssistantByCodeMutation = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AttendAssistantSessionResult>, unknown, AttendByCodeRequest>({
    mutationFn: (data) =>
      api.post("/api/rewards/assistants/attend-by-code", data).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["assistants"] });
    },
  });
};

export const AdjustAssistantApplesRequest = z.object({
  amount: z.coerce.number().refine((v) => v !== 0, { message: "Amount cannot be zero" }),
  reason: z.string().optional(),
});
export type AdjustAssistantApplesRequest = z.infer<typeof AdjustAssistantApplesRequest>;

export const useAdjustAssistantApplesMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<AttendAssistantSessionResult>,
    unknown,
    { assistantId: string; data: AdjustAssistantApplesRequest }
  >({
    mutationFn: ({ assistantId, data }) =>
      api
        .post(`/api/rewards/assistants/${assistantId}/apples`, data)
        .then((res) => res.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["assistant", { id: vars.assistantId }] });
      qc.invalidateQueries({ queryKey: ["assistants"] });
    },
  });
};

export const usePayAssistantRewardsMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PayAssistantRewardsResult>,
    unknown,
    { assistantId?: string } | void
  >({
    mutationFn: (data) =>
      api
        .post("/api/rewards/assistants/pay-rewards", data ?? {})
        .then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["assistants"] });
    },
  });
};

export const AddStudentApplesRequest = z.object({
  amount: z.coerce.number().refine((v) => v !== 0, { message: "Amount cannot be zero" }),
  reason: z.string().optional(),
});
export type AddStudentApplesRequest = z.infer<typeof AddStudentApplesRequest>;

export type StudentAppleLookup = {
  studentId: string;
  fullName: string;
  studentCode: string;
  apples: number;
};

export type AddStudentApplesResult = {
  studentId: string;
  fullName: string;
  studentCode: string;
  apples: number;
  amountAdded: number;
  message: string;
};

export const useAddStudentApplesMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<AddStudentApplesResult>,
    unknown,
    { studentId: string; data: AddStudentApplesRequest }
  >({
    mutationFn: ({ studentId, data }) =>
      api.post(`/api/students/${studentId}/apples`, data).then((res) => res.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", { id: vars.studentId }] });
    },
  });
};

export const LookupStudentByCodeRequest = z.object({
  code: z.string().min(1, { message: "Student code is required" }),
});
export type LookupStudentByCodeRequest = z.infer<typeof LookupStudentByCodeRequest>;

export const useLookupStudentByCodeMutation = () => {
  return useMutation<ApiResponse<StudentAppleLookup>, unknown, LookupStudentByCodeRequest>({
    mutationFn: (data) =>
      api.post("/api/rewards/students/lookup", data).then((res) => res.data),
  });
};

export const AddStudentApplesByCodeRequest = z.object({
  code: z.string().min(1),
  amount: z.coerce.number().refine((v) => v !== 0),
  reason: z.string().optional(),
});
export type AddStudentApplesByCodeRequest = z.infer<typeof AddStudentApplesByCodeRequest>;

export const useAddStudentApplesByCodeMutation = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AddStudentApplesResult>, unknown, AddStudentApplesByCodeRequest>({
    mutationFn: (data) =>
      api.post("/api/rewards/students/apples-by-code", data).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
