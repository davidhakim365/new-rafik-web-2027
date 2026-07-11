import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { subSeconds } from "date-fns";
import Countdown from "react-countdown";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSubmitExam } from "@/generated/api";
import { ExamNotAnswered } from "@/generated/model";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownEditor from "@uiw/react-markdown-editor";
import _ from "lodash";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import rehypeSanitize from "rehype-sanitize";
import { z } from "zod";
import { getGetExamQueryKey } from "../../../generated/api";

export function ExamSubmissionForm({
  courseId,
  exam,
}: {
  courseId: string;
  exam: ExamNotAnswered;
}) {
  const qc = useQueryClient();
  const submitExam = useSubmitExam({
    mutation: {
      onSuccess(data) {
        qc.invalidateQueries({
          predicate: (q) => {
            console.log(q.queryKey);
            return (q.queryKey[0] as string).includes("lecture");
          },
        });
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId, exam.id),
        });
        qc.invalidateQueries({
          queryKey: ["course", { id: courseId }],
        });
        toast({
          title: "Quiz submitted",
          description: data?.message,
        });
      },
    },
  });

  const FormSchema = useMemo(
    () =>
      z.object({
        ...exam.multipleChoiceQuestions.reduce(
          (acc: any, q) => ({
            ...acc,
            [q.id]: z
              .custom<string>((val) => q.choices.includes(val as string), {
                message: "please select an option",
              })
              .nullish(),
          }),
          {}
        ),
        ...exam.valueToleranceQuestions.reduce(
          (acc: any, q: any) => ({
            ...acc,
            [q.id]: z.coerce.number().nullish(),
          }),
          {}
        ),
      }),
    [exam.multipleChoiceQuestions, exam.valueToleranceQuestions]
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    data = _.omitBy(data, _.isNil);

    submitExam.mutate({
      courseId,
      examId: exam.id,
      data: {
        questionAnswers: Object.entries(data).map(([key, value]) => ({
          questionId: key,
          answer: value.toString(),
        })),
      },
    });
  };
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const pdfUrls = exam.description ? exam.description.match(urlRegex) : [];
  
  const multipleChoiceQuestions = exam.multipleChoiceQuestions.map((q) => (
    <FormField
      control={form.control}
      key={q.id}
      name={q.id}
      render={({ field }) => (
        <FormItem className='flex flex-col p-0 md:flex-row rounded-3xl overflow-clip bg-white/40'>
          <HoverCard>
            <HoverCardTrigger className='hidden w-fit h-fit md:block'>
              <div className='w-[200px] h-[200px] object-cover'>
                <img className='w-full h-full' src={q.image} alt='' />
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side='left'
              className='p-0 scale-[200%] rounded overflow-clip'>
              <img className='w-full h-full' src={q.image} alt='' />
            </HoverCardContent>
          </HoverCard>
          <div className='object-cover w-full md:hidden aspect-video'>
            <img src={q.image} className='w-full h-full' alt='' />
          </div>
          <div className='flex flex-col flex-grow w-full gap-2'>
            <div className='flex flex-col w-full h-full p-4 text-primary/90'>
            <p className=" text-2xl">{q.text}</p>

            </div>
            <div className=' bg-primary/60'>
              <FormControl>
                <RadioGroup
                  className='flex items-center px-10 py-4 text-white '
                  onValueChange={field.onChange}
                  value={field.value}>
                  <div className='grid items-center w-full gap-2 grid-col-1 md:grid-cols-3'>
                    {q.choices.map((o: any) => (
                      <FormItem
                        key={o}
                        className='px-6 py-1 space-x-3 space-y-0 rounded text-primary bg-white/60 w-fit'>
                        <FormControl>
                          <RadioGroupItem value={o} />
                        </FormControl>
                        <FormLabel>{o}</FormLabel>
                      </FormItem>
                    ))}
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage className='p-3' />
            </div>
          </div>
        </FormItem>
      )}
    />
  ));

  const valueToleranceQuestions = exam.valueToleranceQuestions.map((q) => (
    <FormField
      control={form.control}
      key={q.id}
      name={q.id}
      render={({ field }) => (
        <FormItem className='flex flex-col p-0 md:flex-row rounded-3xl overflow-clip bg-white/40'>
          <HoverCard>
            <HoverCardTrigger className='hidden w-fit h-fit md:block'>
              <div className='w-[200px] h-[200px] object-cover'>
                <img className='w-full h-full' src={q.image} alt='' />
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side='left'
              className='p-0 scale-[200%] rounded overflow-clip'>
              <img className='w-full h-full' src={q.image} alt='' />
            </HoverCardContent>
          </HoverCard>
          <div className='object-cover w-full md:hidden aspect-video'>
            <img src={q.image} className='w-full h-full' alt='' />
          </div>
          <div className='flex flex-col flex-grow w-full gap-2'>
            <div className='flex flex-col w-full h-full p-4 text-primary/90'>
            <p className=" text-2xl">{q.text}</p>

            </div>
            <div className='p-4 bg-primary/60'>
              <FormControl>
                <Input
                  className='border-2 w-fit text-primary border-primary'
                  {...field}
                />
              </FormControl>
              <FormMessage className='p-3' />
            </div>
          </div>
        </FormItem>
      )}
    />
  ));

  return (
    <ScrollArea className='w-full h-full p-4'>
      <div className='w-full h-full p-4 text-white rounded bg-primary/60'>
        <h1 className='flex items-center justify-between text-5xl text-center'>
          {exam.title} +
          <Countdown
            date={subSeconds(new Date(exam.expiresAt), 10)}
            onComplete={() => {
              onSubmit(form.getValues());
            }}
          />
        </h1>
        {pdfUrls.map((url, index) => {
      const previewUrl = `${url}/preview`; // Append '/preview' to the original URL
      return (
        <div
          key={index}
          className="rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
          style={{ height: "70vh",width:"100%"}}
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset
              className='flex flex-col w-full gap-2'
              disabled={submitExam.isPending}>
              {valueToleranceQuestions}
              {multipleChoiceQuestions}
              <Button className='w-fit self-end m-4 hover:scale-[160%] duration-300 transition-all scale-150'>
                Submit
              </Button>
            </fieldset>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
