import Loading from "@/components/loading/loading";
import { useGetProfile, useGetQuiz } from "@/generated/api";
import { isWrongCourseLevelError } from "@/lib/error-utils";
import { profileStudentLevel, studentCoursesHref } from "@/lib/student-level";
import { QuizSubmissionForm } from "@/pages/student/quizzes/quiz-submission-form";
import SubmittedQuiz from "@/pages/student/quizzes/submitted-quiz";
import { Navigate, useParams } from "react-router-dom";

const StudentQuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();

  const { data: quiz, isLoading, error } = useGetQuiz(
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

  if (isLoading && !quiz?.data) {
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
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  return <SubmittedQuiz quiz={quiz.data} />;
};

export default StudentQuizPage;
