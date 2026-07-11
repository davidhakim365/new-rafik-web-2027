import { DashboardLayout } from "@/components/dashboard-layout";
import PageFallBackOnError from "@/components/fallback-on-error";
import RequireAuth from "@/components/require-auth";
import PasswordResetPage from "@/pages/auth/password-reset-page";
import SignInSignUpPage from "@/pages/auth/sign-in-sign-up-page";
import AssistantDetailsPage from "@/pages/dashboard/assistants/assistant-details-page";
import AssistantsPage from "@/pages/dashboard/assistants/assistants-page";
import AddCoursePage from "@/pages/dashboard/courses/add-course-page";
import CoursesPage from "@/pages/dashboard/courses/courses-page";
import DashboardCoursePage from "@/pages/dashboard/courses/dashboard-course-page";
import CreditCodesPage from "@/pages/dashboard/credit-codes/credit-code-page";
import ExamPage from "@/pages/dashboard/exams/exam-page";
import ExamStudentsPage from "@/pages/dashboard/exams/exam-students-page";
import FilesPage from "@/pages/dashboard/files/files-page";
import ImportantLecturesPage from "@/pages/dashboard/important-lectures/important-lectures-page";
import LectureDetailsPage from "@/pages/dashboard/lectures/lecture-details-page";
import LessonDetailsPage from "@/pages/dashboard/lessons/lesson-details-page";
import QuestionsPage from "@/pages/dashboard/questions/questions-page";
import QuizPage from "@/pages/dashboard/quizzes/quiz-page";
import StatisticsPage from "@/pages/dashboard/statistics/statistics-page";
import StudentDetailsPage from "@/pages/dashboard/students/student-details-page";
import StudentsPage from "@/pages/dashboard/students/students-page";
import { StudentCoursePage } from "@/pages/student/courses/student-course-page";
import { StudentCoursesPage } from "@/pages/student/courses/student-courses-page";
import StudentExamPage from "@/pages/student/exams/student-exam-page";
import StudentHomePage2 from "@/pages/student/home/student-home.page";
import StudentLecturePage from "@/pages/student/lectures/student-lecture-page";
import StudentLessonPage from "@/pages/student/lessons/student-lesson-page";
import StudentPayments from "@/pages/student/payment/student-payments";
import StudentQuizPage from "@/pages/student/quizzes/student-quiz-page";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Routes, useLocation } from "react-router-dom";
import StudentLayout from "./components/student-layout";

function App() {
  const location = useLocation();

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          resetKeys={[location.key]}
          onError={(error) => {
            console.log(error);
          }}
          onReset={reset}
          FallbackComponent={PageFallBackOnError}
        >
          <Routes>
            <Route path="/sign-in-sign-up" element={<SignInSignUpPage />} />
            <Route
              path="/auth/reset-password"
              element={<PasswordResetPage />}
            />
            <Route path="/" element={<StudentLayout />}>
              <Route path="/" element={<StudentHomePage2 />} />
            </Route>

            {/* non-auth */}
            <Route path="/" element={<StudentLayout />}>
              <Route path="/courses" element={<StudentCoursesPage />} />
              <Route
                path="/courses/levels/:levelNum"
                element={<StudentCoursesPage />}
              />
              <Route
                path="/courses/:courseId"
                element={<StudentCoursePage />}
              />
              <Route
                path="/courses/:courseId/lectures/:lectureId"
                element={<StudentLecturePage />}
              />
            </Route>

            <Route
              path="/"
              element={
                <RequireAuth roles={["Student"]}>
                  <StudentLayout />
                </RequireAuth>
              }
            >
              {/* <Route path="courses" element={<StudentCoursesPage />} /> */}
              {/* <Route path="courses/:courseId" element={<StudentCoursePage />} /> */}
              <Route
                path="courses/:courseId/exams/:examId"
                element={<StudentExamPage />}
              />
              {/* <Route
                path="courses/:courseId/lectures/:lectureId"
                element={<StudentLecturePage />}
              /> */}
              <Route
                path="courses/:courseId/lectures/:lectureId/lessons/:lessonId"
                element={<StudentLessonPage />}
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/quizzes/:quizId"
                element={<StudentQuizPage />}
              />
              <Route path="payments" element={<StudentPayments />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <RequireAuth roles={["Teacher", "Assistant"]}>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="" element={<StatisticsPage />} />

              <Route
                path="important-lectures"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLectures"]}
                  >
                    <ImportantLecturesPage />
                  </RequireAuth>
                }
              />

              <Route
                path="courses"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <CoursesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/add"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <AddCoursePage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <DashboardCoursePage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <LectureDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/lessons/:lessonId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <LessonDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/quizzes/:quizId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <QuizPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/quizzes/add"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <QuizPage />
                  </RequireAuth>
                }
              />

              <Route
                path="courses/:courseId/exams/:examId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <ExamPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/exams/:examId/students"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <ExamStudentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/exams/add"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCourses"]}
                  >
                    <ExamPage />
                  </RequireAuth>
                }
              />
              <Route path="credit-codes" element={<CreditCodesPage />} />
              <Route
                path="files"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageFiles"]}
                  >
                    <FilesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="questions"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageFiles"]}
                  >
                    <QuestionsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="assistants"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageAssistants"]}
                  >
                    <AssistantsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="assistants/:assistantId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageAssistants"]}
                  >
                    <AssistantDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="students"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageStudents"]}
                  >
                    <StudentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="students/:studentId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageStudents"]}
                  >
                    <StudentDetailsPage />
                  </RequireAuth>
                }
              />
            </Route>
          </Routes>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default App;
