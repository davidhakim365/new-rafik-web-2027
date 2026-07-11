import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGetQuizQueryKey, useSubmitQuiz } from "@/generated/api";
import { QuizNotAnswered } from "@/generated/model";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import rehypeSanitize from "rehype-sanitize";
import { z } from "zod";

export function QuizSubmissionForm({
  courseId,
  lectureId,
  quiz,
}: {
  courseId: string;
  lectureId: string;
  quiz: QuizNotAnswered;
}) {
  const qc = useQueryClient();
  const { mutate: submitQuiz, isPending: isSubmitting } = useSubmitQuiz({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetQuizQueryKey(courseId, lectureId, quiz.id),
        });
      },
    },
  });

  const FormSchema = useMemo(
    () =>
      z.object({
        ...quiz.multipleChoiceQuestions.reduce(
          (acc: any, q) => ({
            ...acc,
            [q.id]: z.custom<string>(
              (val) => q.choices.includes(val as string),
              {
                message: "please select an option",
              }
            ),
          }),
          {}
        ),
        ...quiz.valueToleranceQuestions.reduce(
          (acc: any, q: any) => ({
            ...acc,
            [q.id]: z.coerce.number(),
          }),
          {}
        ),
      }),
    [quiz.multipleChoiceQuestions, quiz.valueToleranceQuestions]
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    submitQuiz(
      {
        courseId,
        lectureId,
        quizId: quiz.id,
        data: {
          questionAnswers: Object.entries(data).map(([key, value]) => ({
            questionId: key,
            answer: (value as any).toString(),
          })),
        },
      },
      {
        onSuccess(data) {
          console.log(data);
          toast({
            title: "Quiz submitted",
            description: data?.message,
          });
        },
      }
    );
  };

const urlRegex = /(https?:\/\/[^\s]+)/g;
const pdfUrls = quiz.description ? quiz.description.match(urlRegex) : [];



  const multipleChoiceQuestions = quiz.multipleChoiceQuestions.map((q) => (
    <FormField
      control={form.control}
      key={q.id}
      name={q.id}
      render={({ field }) => (
        <FormItem className="flex flex-col p-2 overflow-hidden rounded-lg md:p-4 bg-white/40">
          <div className="w-full aspect-w-16 aspect-h-9">
            <img className="object-cover w-full h-full" src={q.image} alt="" />
          </div>
          <div className="w-full md:hidden aspect-video">
            <img src={q.image} className="object-cover w-full h-full" alt="" />
          </div>
          <div className="flex flex-col flex-grow w-full gap-2">
            <div className="flex flex-col w-full p-2 md:p-4 text-primary/90">
              <p className="text-1xl">{q.text}</p>
            </div>
            <div className="bg-primary/60">
              <FormControl>
                <RadioGroup
                  className="flex flex-col p-2 text-white"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  {q.choices.map((o: any) => (
                    <FormItem
                      key={o}
                      className="flex items-center p-2 rounded-lg bg-white/60"
                    >
                      <FormControl>
                        <RadioGroupItem value={o} />
                      </FormControl>
                      <FormLabel className="ml-2">{o}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage className="p-2 text-red-500" />
            </div>
          </div>
        </FormItem>
      )}
    />
  ));

  const valueToleranceQuestions = quiz.valueToleranceQuestions.map((q) => (
    <FormField
      control={form.control}
      key={q.id}
      name={q.id}
      render={({ field }) => (
        <FormItem className="flex flex-col p-2 overflow-hidden rounded-lg md:p-4 bg-white/40">
          <HoverCard>
            <HoverCardTrigger className="w-full aspect-w-16 aspect-h-9">
              <img className="object-cover w-full h-full" src={q.image} alt="" />
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              className="p-0 overflow-hidden scale-150 rounded-lg"
            >
              <img className="object-cover w-full h-full" src={q.image} alt="" />
            </HoverCardContent>
          </HoverCard>
          <div className="w-full md:hidden aspect-video">
            <img src={q.image} className="object-cover w-full h-full" alt="" />
          </div>
          <div className="flex flex-col p-2 md:p-4">
            <div className="flex flex-col w-full">
              <p className=" text-2xl">{q.text}</p>
            </div>
            <FormControl className="mt-2">
              <Input
                className="w-full p-2 border-2 text-primary border-primary"
                {...field}
              />
            </FormControl>
            <FormMessage className="p-2 text-red-500" />
          </div>
        </FormItem>
      )}
    />
  ));

  return (
    <ScrollArea className="w-full h-full p-2 md:p-4">
      <div className="w-full h-full p-2 text-white rounded-lg md:p-4 bg-primary/60">
        <h1 className="text-3xl text-center md:text-5xl">{quiz.title}</h1>
        {pdfUrls && (
  <div className="my-4 flex flex-col gap-4">
    {pdfUrls.map((url, index) => {
      const previewUrl = `${url}/preview`; // Append '/preview' to the original URL
      return (
        <div
          key={index}
          className="rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
          style={{ height: "70vh"}}
        >
          {/* Embed PDF directly in the iframe */}
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title={`PDF Preview ${index + 1}`}
            style={{ border: "none" }}
          ></iframe>
        </div>
      );
    })}
  </div>
)}



        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset
              className="flex flex-col w-full gap-2"
              disabled={isSubmitting}
            >
              {valueToleranceQuestions}
              {multipleChoiceQuestions}
              <Button className="self-center w-full mt-4 transition-transform duration-300 md:w-auto md:self-end md:mt-6 hover:scale-105">
                Submit
              </Button>
            </fieldset>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
