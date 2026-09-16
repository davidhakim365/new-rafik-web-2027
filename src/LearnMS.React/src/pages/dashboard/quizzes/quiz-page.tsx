import {
  useDeleteQuizMutation,
  useGetQuizQuery,
  useUpdateQuizMutation,
} from "@/api/quizzes-api";
import { BankQuestionCard } from "@/components/assessment/bank-question-card";
import { InlineQuestionEditor } from "@/components/assessment/inline-question-editor";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { useQuestionsStore } from "@/store/use-questions-store";
import { createEmptyDraft, draftToPayload } from "@/types/assessment";
import { Question } from "@/types/question";
import { zodResolver } from "@hookform/resolvers/zod";
import { Library, Plus, Trash } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const QuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();
  const { openModal } = useModalStore();
  const {
    setQuestions,
    resetAll,
    questions,
    removeQuestion,
    drafts,
    addDraft,
    updateDraft,
    removeDraft,
    clearDrafts,
  } = useQuestionsStore();
  const navigate = useNavigate();

  const { data: quiz, isLoading } = useGetQuizQuery({
    courseId: courseId as string,
    lectureId: lectureId as string,
    id: quizId as string,
    enabled: !!quizId,
  });

  const updateQuizMutation = useUpdateQuizMutation();
  const deleteQuizMutation = useDeleteQuizMutation();

  const FormSchema = z
    .object({
      id: z.string().uuid().optional(),
      title: z.string().min(1),
      description: z.string().min(1),
      resultType: z.enum(["Hidden", "ResultOnly", "ResultWithAnswer"]),
      passCount: z.coerce.number().min(0),
      expiryMinutes: z.coerce.number().min(0),
    })
    .refine(
      (data) => {
        const total = questions.length + drafts.length;
        return total >= 1 && total >= data.passCount;
      },
      {
        message: "Need at least one question; pass count cannot exceed questions",
        path: ["passCount"],
      }
    );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: undefined,
      title: "",
      description: "",
      resultType: "ResultWithAnswer",
      passCount: 1,
      expiryMinutes: 0,
    },
  });

  useEffect(() => {
    resetAll();
  }, [quizId, resetAll]);

  useEffect(() => {
    if (quiz?.status && quiz?.data) {
      setQuestions(quiz.data.questions as Question[]);
      form.setValue("id", quiz.data.id);
      form.setValue("title", quiz.data.title);
      form.setValue("description", quiz.data.description);
      form.setValue("passCount", quiz.data.passCount);
      form.setValue("resultType", quiz.data.resultType);
      form.setValue(
        "expiryMinutes",
        (quiz.data as { expiryMinutes?: number }).expiryMinutes ?? 0
      );
    }
  }, [quiz, setQuestions, form]);

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <Loading />
      </div>
    );
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    updateQuizMutation.mutate(
      {
        courseId: courseId as string,
        lectureId: lectureId as string,
        data: {
          ...data,
          questions: questions.map((q) => q.id),
          newQuestions: drafts.map(draftToPayload),
        },
      },
      {
        onSuccess: (res) => {
          toast({
            description: res.message,
            title: "Success",
          });
          clearDrafts();
          if (res.data?.questions) {
            setQuestions(res.data.questions as Question[]);
          }
          if (!quizId)
            navigate(
              `/dashboard/courses/${courseId}/lectures/${lectureId}/quizzes/${res.data.id}`,
              { replace: true }
            );
        },
      }
    );
  };

  return (
    <ScrollArea className="w-full h-full p-4 m-auto rounded shadow-md shadow-primary bg-primary/20 text-primary">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4">
          <fieldset
            disabled={
              updateQuizMutation.isPending || deleteQuizMutation.isPending
            }
            className="flex flex-col items-start gap-4 "
          >
            <div className="flex items-center justify-between w-full">
              <h1 className="text-3xl text-primary">
                {!quizId ? "Creating A Quiz" : "Editing A Quiz"}
              </h1>
              <div className="flex items-center gap-2">
                <Button type="submit">Save</Button>
                {quizId && (
                  <Confirmation
                    description="Are you sure you want to delete this quiz?"
                    title="Delete Quiz"
                    onConfirm={() => {
                      deleteQuizMutation.mutate(
                        {
                          courseId: courseId as string,
                          lectureId: lectureId as string,
                          quizId,
                        },
                        {
                          onSuccess: () => {
                            toast({
                              description: "Quiz deleted successfully",
                              title: "Success",
                            });
                            navigate(
                              `/dashboard/courses/${courseId}/lectures/${lectureId}`,
                              { replace: true }
                            );
                          },
                        }
                      );
                    }}
                    button={
                      <Button variant="destructive">
                        <Trash />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem className="w-full max-w-xl">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                name="passCount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass count (correct answers needed)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="expiryMinutes"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time limit (minutes, 0 = none)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="resultType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Show answers after submit?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={quiz?.data?.resultType ?? field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a result type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hidden">Hide results</SelectItem>
                        <SelectItem value="ResultOnly">Score only</SelectItem>
                        <SelectItem value="ResultWithAnswer">
                          Score + answers
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h2 className="text-xl mt-2">Questions</h2>
            {questions.map((q) => (
              <BankQuestionCard
                key={q.id}
                question={q}
                onRemove={() => removeQuestion(q.id)}
              />
            ))}
            {drafts.map((d) => (
              <InlineQuestionEditor
                key={d.localId}
                draft={d}
                onChange={(patch) => updateDraft(d.localId, patch)}
                onRemove={() => removeDraft(d.localId)}
              />
            ))}
            <div className="flex flex-wrap gap-2 self-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => openModal("select-questions-modal")}
              >
                <Library className="h-4 w-4 mr-2" /> From bank
              </Button>
              <Button
                type="button"
                onClick={() => addDraft(createEmptyDraft("MultipleChoice"))}
              >
                <Plus className="h-4 w-4 mr-2" /> Add question
              </Button>
            </div>
            <FormField
              name="passCount"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default QuizPage;
