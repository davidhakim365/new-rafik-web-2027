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
import {
  getGetExamQueryKey,
  useDeleteExam,
  useGetExam,
  useUpdateExam,
} from "@/generated/api";
import { ExamDashboard, Question } from "@/generated/model";
import { cn, toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { useQuestionsStore } from "@/store/use-questions-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Delete, Plus, Trash } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const ExamPage = () => {
  const { courseId, examId } = useParams();
  const { openModal } = useModalStore();
  const { questions, removeQuestion } = useQuestionsStore();
  const navigate = useNavigate();
  const deleteExamMutation = useDeleteExam();

  const { data, isLoading } = useGetExam(courseId!, examId!, {
    query: {
      enabled: !!courseId && !!examId,
    },
  });

  const exam = data?.data as ExamDashboard;

  const { form, onSubmit } = useUpdateExamForm({
    exam,
    courseId: courseId as string,
  });

  if (isLoading) {
    return (
      <div className='w-full h-full'>
        <Loading />
      </div>
    );
  }

  return (
    <ScrollArea className='w-full h-full p-4 m-auto rounded shadow-md shadow-primary bg-primary/20 text-primary'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='px-4'>
          <fieldset
            disabled={form.formState.isSubmitting}
            className='flex flex-col items-start gap-4 '>
            <div className='flex items-center justify-between w-full'>
              {(!examId && (
                <h1 className='text-3xl text-primary'>Creating A exam</h1>
              )) || <h1 className='text-3xl text-primary'>Editing A exam</h1>}
              <div className='flex items-center gap-2'>

                <Button type='submit'>Save</Button>
                {examId && (
                  <Confirmation
                    description='Are you sure you want to delete this exam?'
                    title='Delete exam'
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
                      <Button variant='destructive'>
                        <Trash />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-center w-full'>
                  <FormLabel>Exam URL</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='price'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-center w-full'>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='retakePrice'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-center w-full'>
                  <FormLabel>Retake Price</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='passCount'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-center w-full'>
                  <FormLabel>Pass Count</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='expiryHours'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-center w-full'>
                  <FormLabel>Expiry Minutes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='resultType'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-start w-fit'>
                  <FormLabel>Result Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={exam?.resultType ?? field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a result type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Hidden'>Hidden</SelectItem>
                      <SelectItem value='ResultOnly'>Result Only</SelectItem>
                      <SelectItem value='ResultWithAnswer'>
                        Result With Answer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {questions.map((q) => (
              <Card
                key={q.id}
                className='relative h-[200px] w-full rounded-3xl overflow-clip flex bg-primary/10 text-primary p-0 border-0'>
                <Badge className='absolute top-2 left-2'>
                  {q.body.$type === "MultipleChoiceQuestion"
                    ? "Multiple Choice"
                    : "Value Tolerance"}
                </Badge>
                <Button
                  className='absolute top-2 right-2'
                  variant='destructive'
                  onClick={() => removeQuestion(q.id)}
                  size='icon'>
                  <Delete />
                </Button>
                {q.image && (
                  <HoverCard>
                    <HoverCardTrigger className='h-full w-[200px] p-0'>
                      <CardHeader className='h-full p-0'>
                        <img
                          src={q.image}
                          className='object-fill object-center w-full h-full'
                        />
                      </CardHeader>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side='left'
                      className='p-0 w-[500px] rounded overflow-clip aspect-square shadow-primary shadow-md'>
                      <img src={q.image} className='w-full h-full' alt='' />
                    </HoverCardContent>
                  </HoverCard>
                )}
                {q.body.$type === "MultipleChoiceQuestion" && (
                  <MultipleQuestionContent {...q} />
                )}
                {q.body.$type === "ValueToleranceQuestion" && (
                  <ValueQuestionContent {...q} />
                )}
              </Card>
            ))}
            <Button
              type='button'
              size='icon'
              className='self-end'
              onClick={() => openModal("select-questions-modal")}>
              <Plus />
            </Button>
            <FormField
              name='questions'
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

function MultipleQuestionContent(question: Question) {
  console.log(question.body.$type);
  if (question.body.$type === "ValueToleranceQuestion") return null;
  return (
    <CardContent className={cn("flex flex-col items-start p-4 gap-4")}>
      <h2 className='text-2xl'>{question.text}</h2>
      <div className='flex flex-col items-start ms-4'>
        {question.body!.choices.map((o) => (
          <Badge
            className={cn(
              "mt-3",
              o !== question.body!.correctAnswer && "text-primary"
            )}
            key={o}
            variant={
              o === question.body!.correctAnswer ? "default" : "secondary"
            }>
            {o}
          </Badge>
        ))}
      </div>
    </CardContent>
  );
}

function ValueQuestionContent(question: Question) {
  if (question.body.$type === "MultipleChoiceQuestion") return null;
  return (
    <CardContent
      className={cn(
        "flex flex-col items-start gap-4 p-4",
        !question.image && "items-center w-full"
      )}>
      <h2 className='text-2xl'>{question.text}</h2>
      <div className='flex flex-col items-start'>
        <p className='text-lg'>Correct: {question.body.correctAnswer}</p>
        <p className='text-lg'>Tolerance: {question.body.tolerance}</p>
      </div>
    </CardContent>
  );
}

export default ExamPage;

function useUpdateExamForm({
  exam,
  courseId,
}: {
  exam?: ExamDashboard;
  courseId: string;
}) {
  const { addQuestions, questions, clearQuestions } = useQuestionsStore();
  const qc = useQueryClient();
  const updateExamMutation = useUpdateExam({
    mutation: {
      onSuccess: ({ data }) => {
        toast({
          title: "Exam updated",
          description: "Exam updated successfully",
        });
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId!, data?.id!),
        });
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
          questions: z
            .array(z.string().uuid(), {
              required_error: "Questions are required",
            })
            .min(1, { message: "Questions must  be at least 1" })
            .default(questions.map((q) => q.id)),
        })
        .refine(
          (data) =>
            data.questions.length >= data.passCount && data.passCount >= 0,
          {
            message: "Pass count must be less than or equal to questions count",
            path: ["passCount"],
          }
        ),
    [questions]
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: undefined,
      title: "",
      description: "",
      resultType: "Hidden",
    },
  });

  useEffect(() => {
    clearQuestions();
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

  useEffect(() => {
    questions.forEach((q, i) => {
      form.setValue(`questions.${i}`, q.id);
    });
  }, [questions]);

  return {
    form,
    onSubmit: (data: z.infer<typeof FormSchema>) => {
      updateExamMutation.mutate({
        data: { ...data, questions: data.questions },
        courseId,
      });
    },
  };
}
