import {
  AssessmentTakeForm,
  buildTakeQuestions,
} from "@/components/assessment/assessment-take-form";
import { getGetExamQueryKey, useSubmitExam } from "@/generated/api";
import { ExamNotAnswered } from "@/generated/model";
import { toast } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function ExamSubmissionForm({
  courseId,
  exam,
}: {
  courseId: string;
  exam: ExamNotAnswered & {
    essayQuestions?: Array<{
      id: string;
      text: string;
      description: string;
      image?: string | null;
      maxLength?: number | null;
    }>;
  };
}) {
  const qc = useQueryClient();
  const submitExam = useSubmitExam({
    mutation: {
      onSuccess(data) {
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId, exam.id),
        });
        qc.invalidateQueries({
          queryKey: ["course", { id: courseId }],
        });
        toast({
          title: "Exam submitted",
          description: data?.message,
        });
      },
    },
  });

  const questions = useMemo(
    () =>
      buildTakeQuestions({
        multipleChoiceQuestions: exam.multipleChoiceQuestions as any,
        valueToleranceQuestions: exam.valueToleranceQuestions,
        essayQuestions: exam.essayQuestions,
      }),
    [exam]
  );

  const remainingMs = exam.expiresAt
    ? new Date(exam.expiresAt).getTime() - Date.now()
    : 0;
  const expiryMinutes =
    remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / 60_000)) : 0;

  return (
    <AssessmentTakeForm
      title={exam.title}
      description={exam.description}
      questions={questions}
      expiresAt={exam.expiresAt}
      expiryMinutes={expiryMinutes}
      requireStartConfirm={!!exam.expiresAt}
      isSubmitting={submitExam.isPending}
      onConfirmStart={async () => exam.expiresAt}
      onSubmit={(questionAnswers) => {
        submitExam.mutate({
          courseId,
          examId: exam.id,
          data: { questionAnswers },
        });
      }}
    />
  );
}
