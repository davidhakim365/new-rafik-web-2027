export type QuestionChoiceDraft = {
  id: string;
  text?: string;
  imageUrl?: string;
};

export type DraftQuestion = {
  localId: string;
  questionType: "MultipleChoice" | "ValueTolerance" | "Essay";
  inputMode: "photo" | "text";
  text: string;
  description: string;
  image?: string;
  multipleCorrect?: string;
  multipleChoices?: QuestionChoiceDraft[];
  valueCorrect?: number;
  valueTolerance?: number;
  essayMaxLength?: number;
};

export type InlineQuestionPayload = {
  text?: string;
  description?: string;
  image?: string;
  questionType: string;
  multipleCorrect?: string;
  multipleChoices?: QuestionChoiceDraft[];
  valueCorrect?: number;
  valueTolerance?: number;
  essayMaxLength?: number;
};

export function draftToPayload(d: DraftQuestion): InlineQuestionPayload {
  return {
    text: d.text || undefined,
    description: d.description || undefined,
    image: d.image,
    questionType: d.questionType,
    multipleCorrect: d.multipleCorrect,
    multipleChoices: d.multipleChoices,
    valueCorrect: d.valueCorrect,
    valueTolerance: d.valueTolerance,
    essayMaxLength: d.essayMaxLength,
  };
}

export function createEmptyDraft(
  type: DraftQuestion["questionType"] = "MultipleChoice"
): DraftQuestion {
  const c1 = crypto.randomUUID();
  const c2 = crypto.randomUUID();
  return {
    localId: crypto.randomUUID(),
    questionType: type,
    inputMode: "photo",
    text: "",
    description: "",
    multipleChoices:
      type === "MultipleChoice"
        ? [
            { id: c1, text: "" },
            { id: c2, text: "" },
          ]
        : undefined,
    multipleCorrect: type === "MultipleChoice" ? c1 : undefined,
    valueCorrect: type === "ValueTolerance" ? 0 : undefined,
    valueTolerance: type === "ValueTolerance" ? 0 : undefined,
  };
}
