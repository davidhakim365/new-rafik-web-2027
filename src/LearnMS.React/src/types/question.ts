import { components } from "@/lib/api";

export type QuestionPageList = NonNullable<
  components["schemas"]["QuestionPageList"]
>;

export type Question = components["schemas"]["Question"];

export type MultipleChoiceNotAnswered =
  components["schemas"]["MultipleChoiceNotAnswered"];
export type ValueToleranceNotAnswered =
  components["schemas"]["ValueToleranceNotAnswered"];
