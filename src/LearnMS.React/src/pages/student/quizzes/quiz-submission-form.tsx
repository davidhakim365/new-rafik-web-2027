import {
  AssessmentTakeForm,
  buildTakeQuestions,
} from "@/components/assessment/assessment-take-form";
import { getGetQuizQueryKey, useSubmitQuiz } from "@/generated/api";
import { QuizNotAnswered } from "@/generated/model";
import { toast } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function QuizSubmissionForm({
  courseId,
  lectureId,
  quiz,
}: {
  courseId: string;
  lectureId: string;
  quiz: QuizNotAnswered & {
    essayQuestions?: Array<{
      id: string;
      text: string;
      description: string;
      image?: string | null;
      maxLength?: number | null;
    }>;
    expiresAt?: string | null;
    expiryMinutes?: number;
  };
}) {
  const qc = useQueryClient();
  const { mutate: submitQuiz, isPending } = useSubmitQuiz({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetQuizQueryKey(courseId, lectureId, quiz.id),
        });
      },
    },
  });

  const questions = useMemo(
    () =>
      buildTakeQuestions({
        multipleChoiceQuestions: quiz.multipleChoiceQuestions as any,
        valueToleranceQuestions: quiz.valueToleranceQuestions,
        essayQuestions: quiz.essayQuestions,
      }),
    [quiz]
  );

  return (
    <AssessmentTakeForm
      title={quiz.title}
      description={quiz.description}
      questions={questions}
      expiresAt={quiz.expiresAt}
      isSubmitting={isPending}
      onSubmit={(questionAnswers) => {
        submitQuiz(
          {
            courseId,
            lectureId,
            quizId: quiz.id,
            data: { questionAnswers },
          },
          {
            onSuccess(data) {
              toast({
                title: "Quiz submitted",
                description: data?.message,
              });
            },
          }
        );
      }}
    />
  );
}
