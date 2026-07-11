import {
  useDeleteQuizMutation,
  useGetQuizQuery,
  useUpdateQuizMutation,
} from "@/api/quizzes-api";
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
import { Question } from "@/types/question";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Plus, Trash } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const QuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();
  const { openModal } = useModalStore();
  const { addQuestions, clearQuestions, questions, removeQuestion } =
    useQuestionsStore();
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
      passCount: z.coerce.number(),
      questions: z
        .array(z.string().uuid(), { required_error: "Questions are required" })
        .min(1, { message: "Questions must  be at least 1" })
        .default(questions.map((q) => q.id)),
    })
    .refine(
      (data) => data.questions.length >= data.passCount && data.passCount >= 0,
      {
        message: "Pass count must be less than or equal to questions count",
        path: ["passCount"],
      }
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
    if (quiz?.status && quiz?.data) {
      addQuestions(quiz.data.questions);
      form.setValue("id", quiz.data.id);
      form.setValue("title", quiz.data.title);
      form.setValue("description", quiz.data.description);
      form.setValue("passCount", quiz.data.passCount);
      form.setValue("resultType", quiz.data.resultType);
    }
  }, [quiz, addQuestions]);

  useEffect(() => {
    questions.forEach((q, i) => {
      form.setValue(`questions.${i}`, q.id);
    });
  }, [questions]);

  if (isLoading) {
    return (
      <div className='w-full h-full'>
        <Loading />
      </div>
    );
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    updateQuizMutation.mutate(
      {
        courseId: courseId as string,
        data,
        lectureId: lectureId as string,
      },
      {
        onSuccess: (data) => {
          toast({
            description: data.message,
            title: "Success",
          });
          if (!quizId)
            navigate(
              `/dashboard/courses/${courseId}/lectures/${lectureId}/quizzes/${data.data.id}`,
              { replace: true }
            );
        },
      }
    );
  };

  return (
    <ScrollArea className='w-full h-full p-4 m-auto rounded shadow-md shadow-primary bg-primary/20 text-primary'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='px-4'>
          <fieldset
            disabled={
              updateQuizMutation.isPending || deleteQuizMutation.isPending
            }
            className='flex flex-col items-start gap-4 '>
            <div className='flex items-center justify-between w-full'>
              {(!quizId && (
                <h1 className='text-3xl text-primary'>Creating A Quiz</h1>
              )) || <h1 className='text-3xl text-primary'>Editing A Quiz</h1>}
              <div className='flex items-center gap-2'>
                <Button type='submit'>Save</Button>
                {quizId && (
                  <Confirmation
                    description='Are you sure you want to delete this quiz?'
                    title='Delete Quiz'
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
                  <FormLabel>Quiz URL</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
              name='resultType'
              control={form.control}
              render={({ field }) => (
                <FormItem className='self-start w-fit'>
                  <FormLabel>Result Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={quiz?.data.resultType ?? field.value}>
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
                  {q.body.typename}
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
                {q.body.typename === "MultipleChoiceQuestion" && (
                  <MultipleQuestionContent {...q} />
                )}
                {q.body.typename === "ValueToleranceQuestion" && (
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
  if (question.body.typename === "ValueToleranceQuestion") return null;
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
  if (question.body.typename === "MultipleChoiceQuestion") return null;
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

export default QuizPage;
