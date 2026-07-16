import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

type EssayItem = {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  studentId: string;
  isPendingGrade?: boolean;
};

export function EssayGradingPanel({
  courseId,
  lectureId,
  quizId,
  examId,
  items,
}: {
  courseId: string;
  lectureId?: string;
  quizId?: string;
  examId?: string;
  items: EssayItem[];
}) {
  const qc = useQueryClient();
  const grade = useMutation({
    mutationFn: async ({
      questionId,
      studentId,
      isCorrect,
    }: {
      questionId: string;
      studentId: string;
      isCorrect: boolean;
    }) => {
      if (quizId && lectureId) {
        return api.post(
          `/api/courses/${courseId}/lectures/${lectureId}/quizzes/${quizId}/grade-essay`,
          { studentId, questionId, isCorrect }
        );
      }
      return api.post(`/api/courses/${courseId}/exams/${examId}/grade-essay`, {
        studentId,
        questionId,
        isCorrect,
      });
    },
    onSuccess: () => {
      toast({ title: "Graded", description: "Essay score updated" });
      qc.invalidateQueries({ queryKey: ["quiz"] });
      qc.invalidateQueries({ queryKey: ["exam"] });
    },
  });

  const pending = items.filter((i) => i.isPendingGrade !== false);

  if (!pending.length) return null;

  return (
    <div className="space-y-3 rounded-2xl border bg-background p-4">
      <h3 className="text-lg font-semibold">Pending essay grading</h3>
      {pending.map((item) => (
        <div
          key={`${item.studentId}-${item.questionId}`}
          className="rounded-xl border p-3 space-y-2"
        >
          <p className="font-medium">{item.questionText}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {item.studentAnswer}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={grade.isPending}
              onClick={() =>
                grade.mutate({
                  questionId: item.questionId,
                  studentId: item.studentId,
                  isCorrect: true,
                })
              }
            >
              <Check className="mr-1 h-4 w-4" /> Correct
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={grade.isPending}
              onClick={() =>
                grade.mutate({
                  questionId: item.questionId,
                  studentId: item.studentId,
                  isCorrect: false,
                })
              }
            >
              <X className="mr-1 h-4 w-4" /> Incorrect
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
