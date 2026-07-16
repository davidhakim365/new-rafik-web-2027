import {
  useDeleteQuizMutation,
  useGetQuizQuery,
  useUpdateQuizMutation,
} from "@/api/quizzes-api";
import { InlineQuestionEditor } from "@/components/assessment/inline-question-editor";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import { cn, toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { useQuestionsStore } from "@/store/use-questions-store";
import { createEmptyDraft, draftToPayload } from "@/types/assessment";
import { Question } from "@/types/question";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Library, Plus, Trash } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const QuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();
  const { openModal } = useModalStore();
  const {
    addQuestions,
    resetAll,
    questions,
    removeQuestion,
    drafts,
    addDraft,
    updateDraft,
    removeDraft,
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
  }, []);

  useEffect(() => {
    if (quiz?.status && quiz?.data) {
      addQuestions(quiz.data.questions as Question[]);
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
  }, [quiz, addQuestions]);

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

function BankQuestionCard({
  question,
  onRemove,
}: {
  question: Question;
  onRemove: () => void;
}) {
  const body = question.body as {
    $type?: string;
    typename?: string;
    choices?: Array<string | { id: string; text?: string; imageUrl?: string }>;
    correctAnswer?: string | number;
    tolerance?: number;
  };
  const typeName = body.$type ?? body.typename ?? "Question";

  return (
    <Card className="relative w-full rounded-3xl overflow-clip flex flex-col sm:flex-row bg-primary/10 text-primary p-0 border-0 min-h-[120px]">
      <Badge className="absolute top-2 left-2 z-10">{typeName}</Badge>
      <Button
        className="absolute top-2 right-2 z-10"
        variant="destructive"
        type="button"
        onClick={onRemove}
        size="icon"
      >
        <Delete />
      </Button>
      {question.image && (
        <HoverCard>
          <HoverCardTrigger className="h-[160px] w-full sm:w-[200px] p-0 shrink-0">
            <CardHeader className="h-full p-0">
              <img
                src={question.image}
                className="object-cover object-center w-full h-full"
                alt=""
              />
            </CardHeader>
          </HoverCardTrigger>
          <HoverCardContent
            side="left"
            className="p-0 w-[500px] rounded overflow-clip aspect-square shadow-primary shadow-md"
          >
            <img src={question.image} className="w-full h-full" alt="" />
          </HoverCardContent>
        </HoverCard>
      )}
      <CardContent className={cn("flex flex-col items-start p-4 gap-2")}>
        <h2 className="text-xl pr-10">{question.text}</h2>
        {question.description && (
          <p className="text-sm opacity-80">{question.description}</p>
        )}
        {Array.isArray(body.choices) && (
          <div className="flex flex-wrap gap-2">
            {body.choices.map((o, i) => {
              const label =
                typeof o === "string" ? o : o.text || o.imageUrl || o.id;
              const id = typeof o === "string" ? o : o.id;
              const isCorrect = String(body.correctAnswer) === String(id);
              return (
                <Badge
                  key={i}
                  variant={isCorrect ? "default" : "secondary"}
                >
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
        {body.tolerance != null && (
          <p className="text-sm">
            Answer: {body.correctAnswer} ± {body.tolerance}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default QuizPage;
