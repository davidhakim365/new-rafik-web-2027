import { components } from "@/lib/api";

export type Quiz = {
  id: string;
  type: "Quiz";
  title: string;
  order: number;
};

export type QuizDashboard = NonNullable<components["schemas"]["QuizDashboard"]>;

export type QuizResult = NonNullable<
  components["schemas"]["QuizResultSuccess"]["data"]
>;

export type QuizNotAnswered = NonNullable<
  components["schemas"]["QuizNotAnswered"]
>;

export type QuizResultOnly = NonNullable<
  components["schemas"]["QuizResultOnly"]
>;

export type QuizResultWithAnswer = NonNullable<
  components["schemas"]["QuizResultWithAnswer"]
>;

export type QuizHidden = NonNullable<components["schemas"]["QuizHidden"]>;
