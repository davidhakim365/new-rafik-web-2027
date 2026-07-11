import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGetExamQueryKey, useBuyExam } from "@/generated/api";
import {
  ExamHidden,
  ExamResultOnly,
  ExamResultWithAnswer,
} from "@/generated/model";

import { cn, toast } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownEditor from "@uiw/react-markdown-editor";
import MDEditor from "@uiw/react-md-editor";

import React from "react";
import rehypeSanitize from "rehype-sanitize";

const SubmittedExam: React.FC<{
  courseId: string;
  exam: ExamResultOnly | ExamResultWithAnswer | ExamHidden;
}> = ({ exam, courseId }) => {
  const qc = useQueryClient();
  const { mutate: buyExam, isPending: isBuyExamLoading } = useBuyExam({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId, exam.id),
        });
        toast({
          title: "Exam purchased",
          description: "Exam purchased successfully",
        });
      },
    },
  });

  const questions = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const pdfUrls = exam.description ? exam.description.match(urlRegex) : [];
  for (const q of exam.multipleChoiceQuestions) {
    questions.push(
      <div
        key={q.id}
        className=" flex flex-col w-full border-white hover:scale-[102%] transition-all duration-300 hover:border-[2px] hover:shadow-lg shadow-white md:flex-row rounded-3xl   bg-white/40"
      >
        <HoverCard>
          <HoverCardTrigger className="hidden w-fit h-fit md:block rounded-l-3xl overflow-clip">
            <div className=" h-[200px] object-fill">
              <img className="w-full h-full" src={q.image} alt="" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="left"
            className="p-0 scale-[250%] rounded overflow-clip"
          >
            <img className="w-full h-full" src={q.image} alt="" />
          </HoverCardContent>
        </HoverCard>
        <div className="object-cover w-full rounded-t-3xl overflow-clip md:hidden aspect-video">
          <img src={q.image} className="w-full h-full" alt="" />
        </div>
        <div className="flex flex-col flex-grow w-full gap-2 md:rounded-bl-none rounded-b-3xl rounded-r-3xl rounded-br-3xl overflow-clip">
          <div className="flex flex-col w-full h-full gap-2 p-4 text-primary/90">
            <p className=" text-2xl">{q.text}</p>
          </div>
          <div className="grid items-center justify-center grid-cols-1 gap-2 p-4 md:grid-cols-3 bg-primary/80">
            {q.choices.map((option) => (
              <div
                key={option}
                className={cn(
                  "p-2 px-10 w-fit flex text-xl border-white border-[3px] items-center justify-center bg-white/40 text-primary/80 rounded-3xl",
                  exam.$type === "ExamResultOnly" &&
                    q.studentAnswer === option &&
                    "bg-yellow-500 text-white",
                  exam.$type === "ExamResultWithAnswer" &&
                    option === q.studentAnswer &&
                    !(q as any).isCorrect &&
                    "bg-red-500 text-white",
                  exam.$type === "ExamResultWithAnswer" &&
                    option === (q as any).correctAnswer &&
                    (q as any).isCorrect &&
                    "bg-green-500 text-white",
                  exam.$type === "ExamResultWithAnswer" &&
                    option === (q as any).correctAnswer &&
                    !(q as any).isCorrect &&
                    "bg-zinc-500 text-white"
                )}
              >
                <h3>{option}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  for (const q of exam.valueToleranceQuestions) {
    questions.push(
      <div
        key={q.id}
        className=" flex flex-col w-full border-white hover:scale-[102%] transition-all duration-300 hover:border-[2px] hover:shadow-lg shadow-white md:flex-row rounded-3xl   bg-white/40"
      >
        <HoverCard>
          <HoverCardTrigger className="hidden w-fit h-fit md:block rounded-l-3xl overflow-clip">
            <div className=" h-[200px] object-fill">
              <img className="w-full h-full" src={q.image} alt="" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="left"
            className="p-0 scale-[250%] rounded overflow-clip"
          >
            <img className="w-full h-full" src={q.image} alt="" />
          </HoverCardContent>
        </HoverCard>
        <div className="object-cover w-full rounded-t-3xl overflow-clip md:hidden aspect-video">
          <img src={q.image} className="w-full h-full" alt="" />
        </div>
        <div className="flex flex-col flex-grow w-full gap-2 md:rounded-bl-none rounded-b-3xl rounded-r-3xl rounded-br-3xl overflow-clip">
          <div className="flex flex-col w-full h-full gap-2 p-4 text-primary/90">
            <p className=" text-2xl">{q.text}</p>
          </div>
          <div className="grid items-center justify-center grid-cols-1 gap-2 p-4 md:grid-cols-3 bg-primary/80">
            <div
              className={cn(
                "p-2 px-10 w-fit flex text-xl border-white border-[3px] items-center justify-center bg-white/40 text-primary/80 rounded-3xl",
                exam.$type === "ExamResultOnly" && "bg-yellow-500 text-white",
                exam.$type === "ExamResultWithAnswer" &&
                  (q as any).isCorrect === false &&
                  "bg-red-500 text-white",
                (q as any).isCorrect && "bg-green-500 text-white"
              )}
            >
              <p>{q.studentAnswer}</p>
            </div>
            {exam.$type === "ExamResultWithAnswer" && (
              <div
                className={cn(
                  "p-2 px-10 w-fit flex text-xl border-white border-[3px] items-center justify-center bg-white/40 text-primary/80 rounded-3xl",
                  "bg-green-500 text-white"
                )}
              >
                <p>{(q as any).correctAnswer}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full p-6 ">
      <div className="flex flex-col items-center w-full h-full gap-4 p-4 text-white rounded-xl bg-primary/60">
        <h1 className="text-6xl text-center">{exam.title}</h1>
        {exam.$type !== "ExamHidden" && (
          <div className="flex font-bold flex-col my-32 gap-2 items-center justify-center text-primary/80 text-4xl rounded-[50%] w-60 h-60 border-primary/60 border-2 p-4 shadow-xl shadow-white/40 bg-white">
            Result
            <h3>
              {exam.numOfCorrect}/{exam.numOfQuestions}
            </h3>
            {(exam.passCount <= exam.numOfCorrect && (
              <h3 className="text-green-500">Passed</h3>
            )) || (
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-red-500">Failed</h3>
                <Confirmation
                  title="Retake Exam"
                  description="Are you sure you want to retake this exam?"
                  onConfirm={() =>
                    buyExam({
                      courseId,
                      examId: exam.id,
                    })
                  }
                  button={
                    <Button
                      disabled={isBuyExamLoading}
                      size="sm"
                      variant="destructive"
                      className="text-xs text-muted"
                    >
                      Retake for {exam.retakePrice} LE
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        )}
        {pdfUrls.map((url, index) => {
          const previewUrl = `${url}/preview`; // Append '/preview' to the original URL
          return (
            <div
              key={index}
              className="rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
              style={{ height: "70vh", width: "100%" }}
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
        {questions}
      </div>
    </ScrollArea>
  );
};

export default SubmittedExam;
