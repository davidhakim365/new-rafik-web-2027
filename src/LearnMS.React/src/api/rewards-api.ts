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

export type AssistantLookup = {
  assistantId: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  code: string;
  apples: number;
  sessionsAttended: number;
  currentSessionValue: number;
};

export const LookupAssistantByCodeRequest = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});
export type LookupAssistantByCodeRequest = z.infer<typeof LookupAssistantByCodeRequest>;

export const useLookupAssistantByCodeMutation = () => {
  return useMutation<ApiResponse<AssistantLookup>, unknown, LookupAssistantByCodeRequest>({
    mutationFn: (data) =>
      api.post("/api/rewards/assistants/lookup", data).then((res) => res.data),
  });
};

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

export type StudentAppleLeaderboardItem = {
  studentId: string;
  fullName: string;
  studentCode: string;
  apples: number;
  level: string;
};

export type StudentAppleDailyBucket = {
  date: string;
  awarded: number;
  deducted: number;
  net: number;
};

export type StudentAppleLevelBucket = {
  level: string;
  studentsWithApples: number;
  totalApples: number;
};

export type StudentApplesStatistics = {
  studentsWithApples: number;
  totalApplesOutstanding: number;
  transactionsInRange: number;
  applesAwardedInRange: number;
  applesDeductedInRange: number;
  netApplesInRange: number;
  topStudents: StudentAppleLeaderboardItem[];
  applesByDay: StudentAppleDailyBucket[];
  applesByLevel: StudentAppleLevelBucket[];
};

export const useStudentApplesStatisticsQuery = (params?: {
  startDate?: string;
  endDate?: string;
  level?: string;
}) => {
  return useQuery<ApiResponse<StudentApplesStatistics>>({
    queryKey: ["statistics", "student-apples", params],
    queryFn: () =>
      api
        .get("/api/statistics/student-apples", { params })
        .then((res) => res.data),
  });
};

// --- Apple Rewards Store ---

export type AppleStoreSettings = {
  isEnabled: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  isOpen: boolean;
  updatedAt: string;
};

export type AppleRewardItem = {
  id: string;
  title: string;
  imageUrl: string;
  appleCost: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type StudentAppleOrder = {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl?: string | null;
  appleCost: number;
  status: string;
  createdAt: string;
  cancelledAt?: string | null;
};

export type StudentAppleStoreCatalog = {
  isOpen: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  apples: number;
  applesSpentOnActiveOrders: number;
  items: AppleRewardItem[];
  myOrders: StudentAppleOrder[];
};

export type AppleStoreAdminOverview = {
  activeOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  applesSpentActive: number;
  uniqueStudents: number;
  items: Array<{
    itemId: string;
    title: string;
    imageUrl?: string | null;
    appleCost: number;
    activeOrders: number;
    cancelledOrders: number;
    totalOrders: number;
    applesSpentActive: number;
  }>;
};

export type AppleStoreAdminOrder = {
  orderId: string;
  studentId: string;
  studentFullName: string;
  studentCode: string;
  level: string;
  itemId: string;
  itemTitle: string;
  appleCost: number;
  status: string;
  createdAt: string;
  cancelledAt?: string | null;
};

export type AppleStoreAdminOrders = {
  items: AppleStoreAdminOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const useAppleStoreSettingsQuery = () =>
  useQuery<ApiResponse<AppleStoreSettings>>({
    queryKey: ["apple-store", "settings"],
    queryFn: () => api.get("/api/rewards/store/settings").then((res) => res.data),
  });

export const useUpdateAppleStoreSettingsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      isEnabled: boolean;
      opensAt?: string | null;
      closesAt?: string | null;
    }) => api.put("/api/rewards/store/settings", data).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apple-store"] });
    },
  });
};

export const useAppleStoreItemsQuery = (includeInactive = true) =>
  useQuery<ApiResponse<AppleRewardItem[]>>({
    queryKey: ["apple-store", "items", includeInactive],
    queryFn: () =>
      api
        .get("/api/rewards/store/items", { params: { includeInactive } })
        .then((res) => res.data),
  });

export const useCreateAppleStoreItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      imageUrl: string;
      appleCost: number;
      sortOrder?: number;
      isActive?: boolean;
    }) => api.post("/api/rewards/store/items", data).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apple-store"] }),
  });
};

export const useUpdateAppleStoreItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: {
        title: string;
        imageUrl: string;
        appleCost: number;
        sortOrder: number;
        isActive: boolean;
      };
    }) =>
      api.put(`/api/rewards/store/items/${itemId}`, data).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apple-store"] }),
  });
};

export const useDeleteAppleStoreItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/api/rewards/store/items/${itemId}`).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apple-store"] }),
  });
};

export const useAppleStoreOverviewQuery = () =>
  useQuery<ApiResponse<AppleStoreAdminOverview>>({
    queryKey: ["apple-store", "overview"],
    queryFn: () =>
      api.get("/api/rewards/store/admin/overview").then((res) => res.data),
  });

export const useAppleStoreOrdersQuery = (params: {
  itemId?: string;
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useQuery<ApiResponse<AppleStoreAdminOrders>>({
    queryKey: ["apple-store", "orders", params],
    queryFn: () =>
      api
        .get("/api/rewards/store/admin/orders", { params })
        .then((res) => res.data),
  });

export const useAppleStoreStatusQuery = (enabled = true) =>
  useQuery<ApiResponse<{ isOpen: boolean; opensAt?: string | null; closesAt?: string | null }>>({
    queryKey: ["apple-store", "status"],
    enabled,
    queryFn: () => api.get("/api/rewards/store/status").then((res) => res.data),
    refetchInterval: 60_000,
  });

export const useAppleStoreCatalogQuery = (enabled = true) =>
  useQuery<ApiResponse<StudentAppleStoreCatalog>>({
    queryKey: ["apple-store", "catalog"],
    enabled,
    queryFn: () => api.get("/api/rewards/store/catalog").then((res) => res.data),
  });

export const useRedeemAppleStoreItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.post("/api/rewards/store/orders", { itemId }).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apple-store"] }),
  });
};

export const useCancelAppleStoreOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api
        .post(`/api/rewards/store/orders/${orderId}/cancel`)
        .then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apple-store"] }),
  });
};
