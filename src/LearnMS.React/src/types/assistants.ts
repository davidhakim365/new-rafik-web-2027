export type Assistant = {
  id: string;
  email: string;
  code: string;
  apples: number;
  sessionsAttended: number;
  permissions: string[];
};

export type AssistantIncome = {
  amount: number;
  happenedAt: string;
  claimedAt?: string;
} & (
  | {
      type: "CodeSold";
      code: string;
    }
  | {
      type: "StudentCredit";
      studentId: string;
    }
);
