import Loading from "@/components/loading/loading";
import { useGetQuiz } from "@/generated/api";
import { QuizSubmissionForm } from "@/pages/student/quizzes/quiz-submission-form";
import SubmittedQuiz from "@/pages/student/quizzes/submitted-quiz";
import { useParams } from "react-router-dom";

const StudentQuizPage = () => {
  const { courseId, lectureId, quizId } = useParams();

  const { data: quiz, isLoading } = useGetQuiz(courseId!, lectureId!, quizId!);

  if (isLoading || quiz?.data!.$type === "QuizDashboard") {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (quiz?.data?.$type === "QuizNotAnswered") {
    return (
      <QuizSubmissionForm
        courseId={courseId!}
        lectureId={lectureId!}
        quiz={quiz.data!}
      />
    );
  }

  return <SubmittedQuiz quiz={quiz?.data!} />;
};

export default StudentQuizPage;
