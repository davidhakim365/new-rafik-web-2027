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

/** Letter label for choice index: 0 -> a), 1 -> b), ... */
export function choiceLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)})`;
}

/** Default four choices: a), b), c), d) — ready to fill in. */
export function createDefaultMultipleChoices(
  count = 4
): QuestionChoiceDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    text: `${choiceLetterLabel(i)} `,
  }));
}

export function createEmptyChoice(index: number): QuestionChoiceDraft {
  return {
    id: crypto.randomUUID(),
    text: `${choiceLetterLabel(index)} `,
  };
}

export function createEmptyDraft(
  type: DraftQuestion["questionType"] = "MultipleChoice"
): DraftQuestion {
  const multipleChoices =
    type === "MultipleChoice" ? createDefaultMultipleChoices() : undefined;
  return {
    localId: crypto.randomUUID(),
    questionType: type,
    inputMode: "photo",
    text: "",
    description: "",
    multipleChoices,
    multipleCorrect:
      type === "MultipleChoice" ? multipleChoices![0].id : undefined,
    valueCorrect: type === "ValueTolerance" ? 0 : undefined,
    valueTolerance: type === "ValueTolerance" ? 0 : undefined,
  };
}
