import {
  AssessmentTakeForm,
  buildTakeQuestions,
} from "@/components/assessment/assessment-take-form";
import { api } from "@/api";
import {
  getGetLectureQueryKey,
  getGetQuizQueryKey,
  getGetStudentCourseDetailsQueryKey,
  useSubmitQuiz,
} from "@/generated/api";
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
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lectureId),
        });
        qc.invalidateQueries({
          queryKey: getGetStudentCourseDetailsQueryKey(courseId),
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

  const expiryMinutes = quiz.expiryMinutes ?? 0;

  return (
    <AssessmentTakeForm
      title={quiz.title}
      description={quiz.description}
      questions={questions}
      expiresAt={quiz.expiresAt}
      expiryMinutes={expiryMinutes}
      requireStartConfirm={expiryMinutes > 0}
      isSubmitting={isPending}
      onConfirmStart={async () => {
        const res = await api.post(
          `/api/courses/${courseId}/lectures/${lectureId}/quizzes/${quiz.id}/start`
        );
        return res.data?.data?.expiresAt ?? null;
      }}
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
