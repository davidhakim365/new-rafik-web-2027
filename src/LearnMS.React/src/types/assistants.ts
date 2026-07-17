export type Assistant = {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  code: string;
  apples: number;
  sessionsAttended: number;
  permissions: string[];
};

export type AssistantIncome = {
  type: "CodeSold" | "StudentCredit" | string;
  amount: number;
  code?: string | null;
  studentId?: string | null;
  happenedAt: string;
  claimedAt?: string | null;
};

export function assistantDisplayName(assistant: {
  fullName?: string | null;
  email: string;
}) {
  return assistant.fullName?.trim() || assistant.email;
}
