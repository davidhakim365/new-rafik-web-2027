import { useBuyLectureMutation } from "@/api/lectures-api";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  getGetCourseQueryKey,
  getGetLectureQueryKey,
  useGetCourse,
  useGetLecture,
  useGetProfile,
} from "@/generated/api";
import {
  GetStudentCourseResult,
  GetStudentLectureResult,
  SingleLectureItem,
} from "@/generated/model";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { isInsufficientBalanceError } from "@/lib/error-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { FaClock, FaPlay, FaQuestionCircle, FaLock } from "react-icons/fa";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MarkdownWrapper } from "@/components/ui/markdown-wrapper";

const StudentLecturePage = () => {
  const { lectureId, courseId } = useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { isLoading: isLectureLoading, data: lectureData } = useGetLecture(
    courseId!,
    lectureId!,
    {
      query: {
        refetchOnMount: true,
      },
    }
  );

  const { isLoading: isCourseLoading, data: courseData } = useGetCourse(
    courseId!
  );
  if (isLectureLoading || isCourseLoading) {
    return <Loading />;
  }

  if (!lectureData?.data || !courseData?.data) {
    return <Loading />;
  }

  const lecture = lectureData.data;
  const course = courseData.data;

  if (
    lecture.$type !== "GetStudentLectureResult" ||
    course.$type !== "GetStudentCourseResult"
  )
    return;

  return (
    <div className="min-h-screen bg-background">
      <LectureHeader lecture={lecture} course={course} />
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2
            dir={isRTL ? "rtl" : "ltr"}
            className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl lg:text-4xl text-foreground"
          >
            {t("lectures.lectureContent")}
          </h2>
          <div className="space-y-4">
            {lecture.items.map((item) => (
              <LectureItem
                key={item.id}
                isLocked={
                  course.enrollment !== "Active" &&
                  lecture.enrollment !== "Active"
                }
                item={item}
                courseId={courseId!}
                lectureId={lectureId!}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLecturePage;

function LectureHeader({
  lecture,
  course,
}: {
  lecture: GetStudentLectureResult;
  course: GetStudentCourseResult;
}) {
  const { t } = useTranslation();
  const buyLectureMutation = useBuyLectureMutation();
  const { openModal } = useModalStore();
  const qc = useQueryClient();
  const { data: profile } = useGetProfile();

  const onBuying = () => {
    // Check insufficient balance before making the purchase
    const requiredAmount =
      lecture.enrollment === "Expired" ? lecture.renewalPrice : lecture.price;
    const userCredits =
      profile?.data?.$type === "GetStudentProfileResult"
        ? profile.data.credits
        : 0;

    if (userCredits < (requiredAmount || 0)) {
      openModal("redeem-credit-modal");
      return;
    }

    buyLectureMutation.mutate(
      {
        lectureId: lecture.id,
        courseId: course.id,
      },
      {
        onSuccess: () => {
          toast({ title: t("lectures.purchaseSuccessful") });
          qc.invalidateQueries({
            queryKey: getGetLectureQueryKey(course.id, lecture.id),
          });
          qc.invalidateQueries({ queryKey: getGetCourseQueryKey(course.id) });
        },
        onError: (error) => {
          if (isInsufficientBalanceError(error)) {
            openModal("redeem-credit-modal");
          }
        },
      }
    );
  };

  return (
    <div className="bg-lecturePage">
      <div className="container px-4 py-16 mx-auto sm:py-24 lg:py-32">
        <div className="grid items-center grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
              {lecture.title}
            </h1>
            <div className="text-base leading-relaxed prose-sm prose sm:text-lg opacity-90 sm:prose-base dark:prose-invert max-w-none">
              <MarkdownWrapper linkLabel={t("lectures.clickHereToViewLink")}>
                {lecture.description}
              </MarkdownWrapper>
            </div>{" "}
            <div className="flex flex-col gap-4 pt-4">
              {lecture.isPublished &&
                lecture.enrollment !== "Active" &&
                course.enrollment !== "Active" &&
                (() => {
                  const requiredAmount =
                    lecture.enrollment === "Expired"
                      ? lecture.renewalPrice
                      : lecture.price;
                  const userCredits =
                    profile?.data?.$type === "GetStudentProfileResult"
                      ? profile.data.credits
                      : 0;
                  const hasInsufficientBalance =
                    userCredits < (requiredAmount || 0);
                  if (hasInsufficientBalance) {
                    return (
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => openModal("redeem-credit-modal")}
                        className="flex items-center w-full gap-2 font-semibold transition-all shadow-lg hover:shadow-xl sm:w-fit"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Insufficient Balance (Buy Credit)
                      </Button>
                    );
                  }

                  return (
                    <Confirmation
                      button={
                        <Button
                          size="lg"
                          className="w-full font-semibold transition-all border shadow-lg bg-background text-primary hover:bg-background/90 border-primary/20 hover:shadow-xl sm:w-fit"
                        >
                          {lecture.enrollment === "Expired"
                            ? t("lectures.renewFor", {
                                price: lecture.renewalPrice,
                                days: lecture.expirationDays,
                              })
                            : t("lectures.buyFor", {
                                price: lecture.price,
                                days: lecture.expirationDays,
                              })}
                        </Button>
                      }
                      description={t("lectures.confirmPurchaseDescription")}
                      onConfirm={onBuying}
                      title={t("lectures.confirmPurchase")}
                      disabled={buyLectureMutation.isPending}
                    />
                  );
                })()}

              <div className="flex flex-col gap-2">
                {lecture.enrollment === "Active" && (
                  <div className="flex items-center w-full gap-2 px-3 py-2 rounded-lg sm:px-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm sm:w-fit">
                    <FaClock className="flex-shrink-0 text-green-400" />
                    <span className="text-xs font-medium sm:text-sm">
                      {t("lectures.lectureExpiresOn")}{" "}
                      {new Date(lecture.expiresAt!).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {course.enrollment === "Active" && (
                  <div className="flex items-center w-full gap-2 px-3 py-2 rounded-lg sm:px-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm sm:w-fit">
                    <FaClock className="flex-shrink-0 text-green-400" />
                    <span className="text-xs font-medium sm:text-sm">
                      {t("lectures.courseExpiresOn")}{" "}
                      {new Date(course.expiresAt!).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last lg:justify-self-end">
            <div className="w-full h-48 mx-auto overflow-hidden border shadow-2xl max-w-64 sm:h-56 lg:w-64 lg:h-64 rounded-2xl">
              <img
                src={lecture.imageUrl ?? ""}
                alt={lecture.title}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LectureItem({
  item,
  courseId,
  lectureId,
  isLocked,
}: {
  item: SingleLectureItem;
  courseId: string;
  lectureId: string;
  isLocked: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onClick = () => {
    if (!isLocked) {
      navigate(
        `/courses/${courseId}/lectures/${lectureId}/${
          item.type === "Lesson" ? "lessons" : "quizzes"
        }/${item.id}`
      );
      return;
    }
    toast({
      title: t("lectures.isLocked", {
        type:
          item.type === "Lesson" ? t("lectures.lesson") : t("lectures.quiz"),
      }),
      description: t("lectures.isLockedDescription"),
      variant: "destructive",
    });
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all duration-200 shadow-sm hover:shadow-md border rounded-lg bg-card",
        !isLocked
          ? "hover:border-primary/50 cursor-pointer hover:bg-muted/30"
          : "cursor-not-allowed opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center relative flex-shrink-0",
              item.type === "Lesson"
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {item.type === "Lesson" ? (
              <FaPlay className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <FaQuestionCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {isLocked && (
              <div className="absolute flex items-center justify-center w-5 h-5 rounded-full sm:w-6 sm:h-6 -top-1 -right-1 bg-muted">
                <FaLock className="w-2 h-2 sm:w-3 sm:h-3 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold sm:text-lg text-foreground line-clamp-2">
              {item.title}
            </CardTitle>
          </div>

          <div className="flex items-center flex-shrink-0 gap-2">
            <Badge
              className={cn(
                "transition-colors text-xs",
                item.type === "Lesson"
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
              )}
              variant="outline"
            >
              {item.type === "Lesson"
                ? t("lectures.lesson")
                : t("lectures.quiz")}
            </Badge>
            {isLocked && (
              <Badge variant="secondary" className="text-xs">
                <FaLock className="w-2 h-2 mr-1 sm:w-3 sm:h-3" />
                {t("lectures.locked")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
