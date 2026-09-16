import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { useGetProfile, useGetQuiz } from "@/generated/api";
import { isWrongCourseLevelError } from "@/lib/error-utils";
import { profileStudentLevel, studentCoursesHref } from "@/lib/student-level";
import { QuizSubmissionForm } from "@/pages/student/quizzes/quiz-submission-form";
import SubmittedQuiz from "@/pages/student/quizzes/submitted-quiz";
import { Navigate, useParams } from "react-router-dom";

const StudentQuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();

  const { data: quiz, isLoading, isFetching, error, refetch } = useGetQuiz(
    courseId!,
    lectureId!,
    quizId!,
    {
      query: {
        throwOnError: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    }
  );
  const { data: profile } = useGetProfile();
  const studentLevel = profileStudentLevel(profile);

  if (studentLevel && isWrongCourseLevelError(error)) {
    return <Navigate to={studentCoursesHref(studentLevel)} replace />;
  }

  if ((isLoading || isFetching) && !quiz?.data) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (quiz?.data?.$type === "QuizDashboard") {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (quiz?.data?.$type === "QuizNotAnswered") {
    return (
      <QuizSubmissionForm
        key={`${quiz.data.id}-attempt`}
        courseId={courseId!}
        lectureId={lectureId!}
        quiz={quiz.data!}
      />
    );
  }

  if (!quiz?.data) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full gap-4 px-6 text-center'>
        <p className='text-lg font-medium'>Couldn't load this quiz.</p>
        <p className='text-sm text-muted-foreground'>
          Check your connection and try again. If this keeps happening, open the
          site in Chrome — not Instagram or Facebook.
        </p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  return <SubmittedQuiz quiz={quiz.data} />;
};

export default StudentQuizPage;
