import Confirmation from "@/components/confirmation";
import { BankQuestionCard } from "@/components/assessment/bank-question-card";
import { InlineQuestionEditor } from "@/components/assessment/inline-question-editor";
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
import {
  getGetExamQueryKey,
  useDeleteExam,
  useGetExam,
  useUpdateExam,
} from "@/generated/api";
import { ExamDashboard } from "@/generated/model";
import { toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { useQuestionsStore } from "@/store/use-questions-store";
import { createEmptyDraft, draftToPayload } from "@/types/assessment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Library, Plus, Trash } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const ExamPage = () => {
  const { courseId, examId } = useParams();
  const { openModal } = useModalStore();
  const {
    questions,
    removeQuestion,
    drafts,
    addDraft,
    updateDraft,
    removeDraft,
  } = useQuestionsStore();
  const navigate = useNavigate();
  const deleteExamMutation = useDeleteExam();

  const { data, isLoading } = useGetExam(courseId!, examId!, {
    query: {
      enabled: !!courseId && !!examId && examId !== "add",
    },
  });

  const exam = data?.data as ExamDashboard;

  const { form, onSubmit } = useUpdateExamForm({
    exam,
    courseId: courseId as string,
    examId: examId && examId !== "add" ? examId : undefined,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full p-4 m-auto rounded shadow-md shadow-primary bg-primary/20 text-primary">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4">
          <fieldset
            disabled={form.formState.isSubmitting}
            className="flex flex-col items-start gap-4 "
          >
            <div className="flex items-center justify-between w-full">
              <h1 className="text-3xl text-primary">
                {!examId || examId === "add"
                  ? "Creating An Exam"
                  : "Editing An Exam"}
              </h1>
              <div className="flex items-center gap-2">
                <Button type="submit">Save</Button>
                {examId && examId !== "add" && (
                  <Confirmation
                    description="Are you sure you want to delete this exam?"
                    title="Delete exam"
                    onConfirm={() => {
                      deleteExamMutation.mutate(
                        {
                          courseId: courseId as string,
                          examId: examId as string,
                        },
                        {
                          onSuccess: () => {
                            toast({
                              description: "exam deleted successfully",
                              title: "Success",
                            });
                            navigate(`/dashboard/courses/${courseId}`, {
                              replace: true,
                            });
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
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                name="price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="retakePrice"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retake Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="passCount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="expiryHours"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access duration (minutes)</FormLabel>
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
                      defaultValue={exam?.resultType ?? field.value}
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
          </fieldset>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default ExamPage;

function useUpdateExamForm({
  exam,
  courseId,
  examId,
}: {
  exam?: ExamDashboard;
  courseId: string;
  examId?: string;
}) {
  const { addQuestions, questions, drafts, resetAll } = useQuestionsStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const updateExamMutation = useUpdateExam({
    mutation: {
      onSuccess: ({ data, message }) => {
        toast({
          title: "Success",
          description: message || "Exam updated successfully",
        });
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId!, data?.id!),
        });
        qc.invalidateQueries({ queryKey: ["questions"] });
        qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
        if (!examId && data?.id) {
          navigate(`/dashboard/courses/${courseId}/exams/${data.id}`, {
            replace: true,
          });
        }
      },
    },
  });

  const FormSchema = useMemo(
    () =>
      z
        .object({
          id: z.string().uuid().optional(),
          title: z.string().min(1),
          description: z.string().min(1),
          resultType: z.enum(["Hidden", "ResultOnly", "ResultWithAnswer"]),
          passCount: z.coerce.number(),
          price: z.coerce.number(),
          retakePrice: z.coerce.number(),
          expiryHours: z.coerce.number().min(1),
        })
        .refine(
          () => {
            const total = questions.length + drafts.length;
            return total >= 1;
          },
          { message: "Add at least one question", path: ["title"] }
        ),
    [questions, drafts]
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: undefined,
      title: "",
      description: "",
      resultType: "ResultWithAnswer",
    },
  });

  useEffect(() => {
    resetAll();
  }, []);

  useEffect(() => {
    if (exam) {
      addQuestions(exam.questions);
      form.setValue("id", exam.id);
      form.setValue("title", exam.title);
      form.setValue("description", exam.description);
      form.setValue("passCount", exam.passCount);
      form.setValue("resultType", exam.resultType);
      form.setValue("price", exam.price);
      form.setValue("retakePrice", exam.retakePrice);
      form.setValue("expiryHours", exam.expiryHours);
    }
  }, [exam, addQuestions]);

  return {
    form,
    onSubmit: (data: z.infer<typeof FormSchema>) => {
      updateExamMutation.mutate({
        data: {
          ...data,
          questions: questions.map((q) => q.id),
          newQuestions: drafts.map(draftToPayload),
        } as any,
        courseId,
      });
    },
  };
}
