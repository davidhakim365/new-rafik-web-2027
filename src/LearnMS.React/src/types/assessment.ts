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

export type QuestionBodyLike = {
  $type?: string;
  typename?: string;
  choices?: Array<string | QuestionChoiceDraft>;
  correctAnswer?: string | number;
  tolerance?: number;
  maxLength?: number;
};

export function getQuestionType(
  body?: QuestionBodyLike
): DraftQuestion["questionType"] {
  const t = `${body?.$type ?? body?.typename ?? ""}`.toLowerCase();
  if (t.includes("value")) return "ValueTolerance";
  if (t.includes("essay")) return "Essay";
  return "MultipleChoice";
}

export function normalizeChoices(
  choices?: Array<string | QuestionChoiceDraft>
): QuestionChoiceDraft[] {
  if (!choices?.length) return createDefaultMultipleChoices();
  return choices.map((c, i) =>
    typeof c === "string"
      ? { id: c, text: c }
      : {
          id: c.id || `c${i + 1}`,
          text: c.text,
          imageUrl: c.imageUrl,
        }
  );
}

export function questionToDraft(question: {
  text?: string;
  description?: string;
  image?: string | null;
  body?: QuestionBodyLike;
}): DraftQuestion {
  const body = question.body ?? {};
  const questionType = getQuestionType(body);
  const multipleChoices =
    questionType === "MultipleChoice"
      ? normalizeChoices(body.choices)
      : undefined;

  let multipleCorrect =
    questionType === "MultipleChoice"
      ? String(body.correctAnswer ?? "")
      : undefined;
  if (multipleChoices && multipleCorrect) {
    const byId = multipleChoices.find((c) => c.id === multipleCorrect);
    if (!byId) {
      const byText = multipleChoices.find((c) => c.text === multipleCorrect);
      if (byText) multipleCorrect = byText.id;
    }
  }

  return {
    localId: crypto.randomUUID(),
    questionType,
    inputMode: "text",
    text: question.text ?? "",
    description: question.description ?? "",
    image: question.image || undefined,
    multipleChoices,
    multipleCorrect,
    valueCorrect:
      questionType === "ValueTolerance"
        ? Number(body.correctAnswer ?? 0)
        : undefined,
    valueTolerance:
      questionType === "ValueTolerance" ? Number(body.tolerance ?? 0) : undefined,
    essayMaxLength: questionType === "Essay" ? body.maxLength : undefined,
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
