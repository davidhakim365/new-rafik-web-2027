import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import AppErrorFallback from "@/components/app-error-fallback";
import RequireAuth from "@/components/require-auth";
import LoadingPage from "@/pages/shared/loading-page";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Route, Routes, useLocation } from "react-router-dom";
import StudentLayout from "./components/student-layout";

const PasswordResetPage = lazy(() => import("@/pages/auth/password-reset-page"));
const SignInSignUpPage = lazy(() => import("@/pages/auth/sign-in-sign-up-page"));
const AssistantDetailsPage = lazy(() => import("@/pages/dashboard/assistants/assistant-details-page"));
const AssistantTracesPage = lazy(() => import("@/pages/dashboard/assistant-traces/assistant-traces-page"));
const AssistantsPage = lazy(() => import("@/pages/dashboard/assistants/assistants-page"));
const AddCoursePage = lazy(() => import("@/pages/dashboard/courses/add-course-page"));
const CoursesPage = lazy(() => import("@/pages/dashboard/courses/courses-page"));
const DashboardCoursePage = lazy(() => import("@/pages/dashboard/courses/dashboard-course-page"));
const CreditCodesPage = lazy(() => import("@/pages/dashboard/credit-codes/credit-code-page"));
const ExamPage = lazy(() => import("@/pages/dashboard/exams/exam-page"));
const ExamStudentsPage = lazy(() => import("@/pages/dashboard/exams/exam-students-page"));
const DiscountsPage = lazy(() => import("@/pages/dashboard/discounts/discounts-page"));
const ExpirationTimePage = lazy(() => import("@/pages/dashboard/expiration-time/expiration-time-page"));
const FilesPage = lazy(() => import("@/pages/dashboard/files/files-page"));
const GrantedAccessPage = lazy(() => import("@/pages/dashboard/granted-access/granted-access-page"));
const ImportantLecturesPage = lazy(() => import("@/pages/dashboard/important-lectures/important-lectures-page"));
const LectureDetailsPage = lazy(() => import("@/pages/dashboard/lectures/lecture-details-page"));
const LectureStudentsPage = lazy(() => import("@/pages/dashboard/lectures/lecture-students-page"));
const LectureBarcodeScannerPage = lazy(() => import("@/pages/dashboard/lectures/lecture-barcode-scanner-page"));
const LessonDetailsPage = lazy(() => import("@/pages/dashboard/lessons/lesson-details-page"));
const QuestionsPage = lazy(() => import("@/pages/dashboard/questions/questions-page"));
const QuizPage = lazy(() => import("@/pages/dashboard/quizzes/quiz-page"));
const AssistantRewardsScannerPage = lazy(() => import("@/pages/dashboard/rewards/assistant-rewards-scanner-page"));
const MyProfilePage = lazy(() => import("@/pages/dashboard/rewards/my-profile-page"));
const MyRewardsPage = lazy(() => import("@/pages/dashboard/rewards/my-rewards-page"));
const RewardSystemSettingsPage = lazy(() => import("@/pages/dashboard/rewards/reward-system-settings-page"));
const StudentApplesScannerPage = lazy(() => import("@/pages/dashboard/rewards/student-apples-scanner-page"));
const AppleRewardsStorePage = lazy(() => import("@/pages/dashboard/rewards/apple-rewards-store-page"));
const CallCenterPage = lazy(() => import("@/pages/dashboard/call-center/call-center-page"));
const StatisticsPage = lazy(() => import("@/pages/dashboard/statistics/statistics-page"));
const AddStudentsPage = lazy(() => import("@/pages/dashboard/students/add-students-page"));
const StudentDetailsPage = lazy(() => import("@/pages/dashboard/students/student-details-page"));
const PaymentRequestsPage = lazy(() => import("@/pages/dashboard/payment-requests/payment-requests-page"));
const StudentsPage = lazy(() => import("@/pages/dashboard/students/students-page"));
const StudentCoursePage = lazy(() =>
  import("@/pages/student/courses/student-course-page").then((module) => ({
    default: module.StudentCoursePage,
  }))
);
const StudentCoursesPage = lazy(() =>
  import("@/pages/student/courses/student-courses-page").then((module) => ({
    default: module.StudentCoursesPage,
  }))
);
const StudentExamPage = lazy(() => import("@/pages/student/exams/student-exam-page"));
const StudentHomePage2 = lazy(() => import("@/pages/student/home/student-home.page"));
const StudentLecturePage = lazy(() => import("@/pages/student/lectures/student-lecture-page"));
const StudentLessonPage = lazy(() => import("@/pages/student/lessons/student-lesson-page"));
const StudentPayments = lazy(() => import("@/pages/student/payment/student-payments"));
const StudentQuizPage = lazy(() => import("@/pages/student/quizzes/student-quiz-page"));
const StudentAppleRewardsPage = lazy(() => import("@/pages/student/rewards/student-apple-rewards-page"));
const ParentLoginPage = lazy(() => import("@/pages/parent/parent-login-page"));
const ParentDashboardPage = lazy(() => import("@/pages/parent/parent-dashboard-page"));

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
          FallbackComponent={AppErrorFallback}
        >
          <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/sign-in-sign-up" element={<SignInSignUpPage />} />
            <Route
              path="/auth/reset-password"
              element={<PasswordResetPage />}
            />
            <Route path="/parent" element={<ParentLoginPage />} />
            <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
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
              <Route path="apple-rewards" element={<StudentAppleRewardsPage />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <RequireAuth roles={["Teacher", "Assistant"]}>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route
                path=""
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ViewStatistics"]}
                  >
                    <StatisticsPage />
                  </RequireAuth>
                }
              />

              <Route
                path="important-lectures"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLecture"]}
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
                    permissions={["ManageCourses", "ManageLecture", "ManageLectureStudents"]}
                    requireAnyPermission
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
                    permissions={["ManageCourses", "ManageLecture", "ManageLectureStudents"]}
                    requireAnyPermission
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
                    permissions={["ManageLecture"]}
                  >
                    <LectureDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/students"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLectureStudents"]}
                  >
                    <LectureStudentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/scan"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLectureStudents"]}
                  >
                    <LectureBarcodeScannerPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/lessons/:lessonId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLecture"]}
                  >
                    <LessonDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/quizzes/add"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLecture"]}
                  >
                    <QuizPage />
                  </RequireAuth>
                }
              />
              <Route
                path="courses/:courseId/lectures/:lectureId/quizzes/:quizId"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageLecture"]}
                  >
                    <QuizPage />
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
                path="credit-codes"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCreditCodes", "GenerateCreditCodes"]}
                    requireAnyPermission
                  >
                    <CreditCodesPage />
                  </RequireAuth>
                }
              />
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
                path="assistant-trace"
                element={
                  <RequireAuth roles={["Teacher"]}>
                    <AssistantTracesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="assistant-rewards-scanner"
                element={
                  <RequireAuth roles={["Teacher"]}>
                    <AssistantRewardsScannerPage />
                  </RequireAuth>
                }
              />
              <Route
                path="reward-system-settings"
                element={
                  <RequireAuth roles={["Teacher"]}>
                    <RewardSystemSettingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="student-apples-scanner"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageStudentApples"]}
                  >
                    <StudentApplesScannerPage />
                  </RequireAuth>
                }
              />
              <Route
                path="apple-rewards-store"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageAppleRewardsStore"]}
                  >
                    <AppleRewardsStorePage />
                  </RequireAuth>
                }
              />
              <Route
                path="my-profile"
                element={
                  <RequireAuth roles={["Assistant"]}>
                    <MyProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="my-rewards"
                element={
                  <RequireAuth roles={["Assistant"]}>
                    <MyRewardsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="call-center"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageCallCenter"]}
                  >
                    <CallCenterPage />
                  </RequireAuth>
                }
              />
              <Route
                path="students/add"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["AddStudents"]}
                  >
                    <AddStudentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="payment-requests"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManagePaymentRequests"]}
                  >
                    <PaymentRequestsPage />
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
              <Route
                path="granted-access"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageGrantedAccess"]}
                  >
                    <GrantedAccessPage />
                  </RequireAuth>
                }
              />
              <Route
                path="expiration-time"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageExpirationTime"]}
                  >
                    <ExpirationTimePage />
                  </RequireAuth>
                }
              />
              <Route
                path="discounts"
                element={
                  <RequireAuth
                    roles={["Teacher", "Assistant"]}
                    permissions={["ManageDiscounts"]}
                  >
                    <DiscountsPage />
                  </RequireAuth>
                }
              />
            </Route>
          </Routes>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default App;
