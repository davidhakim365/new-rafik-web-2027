import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import {
  getGetExamQueryKey,
  getGetProfileQueryKey,
  useBuyExam,
  useGetExam,
} from "@/generated/api";
import { toast } from "@/lib/utils";
import { ExamSubmissionForm } from "@/pages/student/exams/exam-submission-form";
import SubmittedExam from "@/pages/student/exams/submitted-exam";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

const StudentExamPage = () => {
  const { courseId, examId } = useParams();

  const { data, isLoading } = useGetExam(courseId!, examId!);
  const qc = useQueryClient();
  const { mutate: buyExam } = useBuyExam({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetExamQueryKey(courseId!, examId!),
        });
        qc.invalidateQueries({
          queryKey: getGetProfileQueryKey(),
        });
        toast({
          title: "Exam purchased",
          description: "Exam purchased successfully",
        });
      },
    },
  });

  const exam = data?.data;

  if (isLoading || exam?.$type === "ExamDashboard") {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (
    exam?.$type === "ExamNotAnswered" &&
    new Date(exam.expiresAt) > new Date()
  ) {
    return <ExamSubmissionForm courseId={courseId!} exam={exam} />;
  }

  if (exam?.$type === "ExamNotAnswered") {
    return (
      <div className='container flex flex-col w-full h-full p-10 my-4 border shadow-lg text-primary bg-primary/20 rounded-xl shadow-primary border-primary/40'>
        <h1 className='text-4xl text-center text-bold'>{exam.title}</h1>
        <p className='text-xl'>{exam.description}</p>
        <div className='flex items-center justify-center grow'>
          <Button
            className='p-6 text-xl transition-all hover:shadow-lg shadow-primary hover:scale-105'
            onClick={() => buyExam({ courseId: courseId!, examId: examId! })}>
            Exam expired - Retake Exam for {exam.retakePrice}
          </Button>
        </div>
      </div>
    );
  }

  if (exam?.$type === "ExamNotBought") {
    return (
      <div className='container flex flex-col w-full h-full p-10 my-4 border shadow-lg text-primary bg-primary/20 rounded-xl shadow-primary border-primary/40'>
        <h1 className='text-4xl text-center text-bold'>{exam.title}</h1>
        <p className='text-xl'>{exam.description}</p>

        <div className='flex items-center justify-center grow'>
          <Confirmation
            title='Confirm purchase'
            description={`Are you sure you want to buy this exam (you have ${exam.expiryHours} minutes to finish it)?`}
            button={
              <Button className='p-6 text-xl transition-all hover:shadow-lg shadow-primary hover:scale-105'>
                Buy Exam for {exam.price}
              </Button>
            }
            onConfirm={() => buyExam({ courseId: courseId!, examId: examId! })}
          />
        </div>
      </div>
    );
  }

  return <SubmittedExam courseId={courseId!} exam={exam!} />;
};

export default StudentExamPage;
