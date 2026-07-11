import { useBuyCourseMutation } from "@/api/courses-api";
import { useBuyLectureMutation } from "@/api/lectures-api";
import { useBuyExamMutation } from "@/api/exams-api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlasticButton } from "@/components/ui/plastic-button";
import { toast } from "@/components/ui/use-toast";
import {
  useGetStudentCourseDetails,
  getGetStudentCourseDetailsQueryKey,
  useGetProfile,
} from "@/generated/api";
import {
  StudentLectureDto,
  StudentCourseDetailsDto,
  StudentCourseDetailsDtoItemsItem,
  StudentExamDto,
  StudentLectureDtoItemsItem,
  StudentAssetDto,
} from "@/generated/model";
import {
  CourseAccordionSkeleton,
  CourseHeaderSkeleton,
} from "@/components/ui/course-skeleton";
import { useModalStore } from "@/store/use-modal-store";
import { isInsufficientBalanceError } from "@/lib/error-utils";
import React, { useState, useRef } from "react";
import {
  FaSpinner,
  FaBook,
  FaClock,
  FaPlay,
  FaRedo,
  FaShoppingCart,
  FaCheckCircle,
  FaQuestionCircle,
  FaFileAlt,
  FaHourglassHalf,
  FaChevronDown,
  FaChevronUp,
  FaFilePdf,
  FaImage,
  FaDownload,
  FaPaperclip,
  FaGraduationCap,
  FaAlignLeft,
  FaFolder,
  FaUser,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  genRandomPattern,
  GridPattern,
} from "@/components/ui/grid-feature-cards";
import { MarkdownWrapper } from "@/components/ui/markdown-wrapper";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BookOpen, Coins, AlertTriangle, ArrowLeft } from "lucide-react";

export const StudentCoursePage = () => {
  const { courseId } = useParams();
  const { isLoading, data } = useGetStudentCourseDetails(courseId!);
  const accordionRef = useRef<HTMLDivElement>(null);

  console.log({ data });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CourseHeaderSkeleton />
        <CourseAccordionSkeleton />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Course Not Found
          </h2>
          <p className="text-muted-foreground">
            The requested course could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CourseHeader course={data.data} />
      <CourseAccordion
        ref={accordionRef}
        items={data.data.items || []}
        course={data.data}
      />
    </div>
  );
};

function CourseHeader({ course }: { course: StudentCourseDetailsDto }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (course.enrollment) {
      case "Active":
        return (
          <Badge className="px-3 py-1 shadow-lg bg-chart-2/15 text-chart-2 border-chart-2/30 hover:bg-chart-2/25 backdrop-blur-sm">
            {t("courses.status.active")}
          </Badge>
        );
      case "Expired":
        return (
          <Badge className="px-3 py-1 shadow-lg bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25 backdrop-blur-sm">
            {t("courses.status.expired")}
          </Badge>
        );
      default:
        return (
          <Badge className="px-3 py-1 shadow-lg bg-slate-800/80 text-slate-200 border-slate-600/50 hover:bg-slate-800/90 backdrop-blur-sm">
            {t("courses.status.available")}
          </Badge>
        );
    }
  };

  const getLevelDisplay = (level: string) => {
    const levelMap: Record<string, string> = {
      Level0: t("latestLectures.levels.level0"),
      Level1: t("latestLectures.levels.level1"),
      Level2: t("latestLectures.levels.level2"),
      Level3: t("latestLectures.levels.level3"),
    };
    return levelMap[level] || level;
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="relative z-20 py-6 overflow-hidden sm:py-8 md:py-12 lg:py-20 bg-background"
    >
      <div className="absolute inset-0 z-0 opacity-30">
        <GridPattern
          width={100}
          height={100}
          x="0"
          y="0"
          squares={genRandomPattern(20)}
          className="w-full h-full stroke-primary/10 fill-primary/5"
        />
      </div>

      <div className="container relative z-10 px-3 py-4 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8 sm:py-6 md:py-8 lg:py-16">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button onClick={() => navigate(-1)} variant="link" className="group">
            <ArrowLeft
              className={`w-4 h-4 ${
                isRTL
                  ? "group-hover:translate-x-1"
                  : "group-hover:-translate-x-1"
              } transition-transform ${isRTL ? "rotate-180" : ""}`}
            />
            {isRTL ? "العودة" : "Go Back"}
          </Button>
        </div>

        <div className="grid items-start grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="order-first lg:order-last lg:col-span-5 xl:col-span-5">
            <div className="lg:sticky lg:top-8 group">
              <div className="relative w-full max-w-sm mx-auto overflow-hidden border-2 shadow-2xl sm:max-w-md md:max-w-lg lg:max-w-none rounded-lg sm:rounded-xl md:rounded-2xl border-border/20 bg-card aspect-[3/2] transition-all duration-300 group-hover:shadow-3xl group-hover:border-border/40">
                <img
                  src={course.imageUrl || ""}
                  alt={t("courses.courseImageAlt")}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="items-center justify-center hidden w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/60">
                  <div className="p-3 text-center sm:p-4 md:p-6">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full sm:w-12 sm:h-12 md:w-16 md:h-16 sm:mb-3 md:mb-4 bg-primary/10">
                      <FaBook className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <span className="text-xs font-medium sm:text-sm md:text-base text-muted-foreground">
                      {t("courses.coursePreview")}
                    </span>
                  </div>
                </div>

                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:col-span-7 xl:col-span-7">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 font-medium"
                >
                  {getLevelDisplay(course.level || "")}
                </Badge>
              </div>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-heading">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="max-w-4xl text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl xl:text-2xl text-paragraph">
                    {course.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Enrollment Price Card */}
              <SpotlightCard spotlightColor="#6300ff30">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <span className="text-xs font-semibold sm:text-sm text-primary">
                        {t("courses.enrollmentPrice")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold sm:gap-3 sm:text-xl md:text-2xl text-card-foreground">
                    <Coins className="w-5 h-5 text-orange-600 sm:w-6 sm:h-6 dark:text-orange-400" />
                    <span className="text-orange-600 dark:text-orange-400">
                      {course.price} {t("common.currency")}
                    </span>
                  </div>
                </div>
              </SpotlightCard>

              {/* Renewal Price Card */}
              {course.renewalPrice && (
                <SpotlightCard spotlightColor="#ff630030">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FaRedo className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <span className="text-xs font-semibold sm:text-sm text-primary">
                          {t("courses.renewalPrice")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-bold sm:gap-3 sm:text-xl md:text-2xl text-card-foreground">
                      <Coins className="w-5 h-5 text-orange-600 sm:w-6 sm:h-6 dark:text-orange-400" />
                      <span className="text-orange-600 dark:text-orange-400">
                        {course.renewalPrice} {t("common.currency")}
                      </span>
                    </div>
                  </div>
                </SpotlightCard>
              )}

              {course.enrollment === "Active" && course.expiresAt && (
                <SpotlightCard
                  className="sm:col-span-2 lg:col-span-1"
                  spotlightColor="#00ff6330"
                >
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 text-chart-2">
                        <FaClock />
                      </div>
                      <span className="text-xs font-medium sm:text-sm md:text-base text-muted-foreground">
                        {t("courses.expiresOn")}
                      </span>
                    </div>
                    <div className="text-sm font-semibold sm:text-base md:text-lg lg:text-xl text-card-foreground">
                      {new Date(course.expiresAt).toLocaleDateString(
                        isRTL ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              )}
            </div>

            <div className="pt-3 sm:pt-4 md:pt-6">
              {course.enrollment !== "Active" ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  <BuyButton course={course} />
                  {course.enrollment === "Expired" && (
                    <div className="relative p-4 overflow-hidden border-2 rounded-lg shadow-lg sm:p-5 md:p-6 sm:rounded-xl border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10 dark:border-amber-800/30 group">
                      <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent group-hover:opacity-100" />
                      <div className="relative flex items-start gap-3 sm:gap-4">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full shadow-md sm:w-10 sm:h-10 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20">
                          <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <h4 className="text-sm font-bold sm:text-base text-amber-800 dark:text-amber-200">
                            Course Access Expired
                          </h4>
                          <p className="text-xs leading-relaxed sm:text-sm text-amber-700 dark:text-amber-300">
                            {t("courses.enrollmentExpiredMessage")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // For active courses, don't show any buttons
                <div className="pt-3">{/* Empty div for proper spacing */}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CourseAccordion = React.forwardRef<
  HTMLDivElement,
  {
    items: StudentCourseDetailsDtoItemsItem[];
    course: StudentCourseDetailsDto;
  }
>(({ items, course }, ref) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!items || items.length === 0) {
    return (
      <div ref={ref} className="min-h-screen bg-background">
        <div className="w-full px-3 py-8 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8 sm:py-12 md:py-16 lg:py-20">
          <div className="w-full mx-auto text-center">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full sm:w-16 sm:h-16 md:w-20 md:h-20 bg-muted/50">
                <FaBook className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">
                {t("courses.noContentAvailable")}
              </h2>
              <p className="max-w-md mx-auto text-xs sm:text-sm md:text-base text-muted-foreground/80">
                {t("courses.description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort all items by order property
  const sortedItems = [...items].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="relative z-10 w-full px-3 py-6 mx-auto max-w-7xl sm:px-4 md:px-6 lg:px-8 sm:py-8 md:py-12 lg:py-16 xl:py-20">
        <div className="relative z-10 w-full space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16 xl:space-y-20">
          {/* Course Content Section */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
            <div className="space-y-3 text-center sm:space-y-4 md:space-y-6">
              <h2
                dir={isRTL ? "rtl" : "ltr"}
                className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-heading"
              >
                {t("courses.heroTitle")}
              </h2>
            </div>

            {sortedItems.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="w-full space-y-3 sm:space-y-4 md:space-y-6"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {sortedItems.map((item) => (
                  <AccordionItem
                    dir={isRTL ? "rtl" : "ltr"}
                    key={item.id}
                    value={item.id}
                    className="w-full transition-all duration-300 border-none rounded-lg shadow-lg sm:rounded-xl md:rounded-2xl bg-coursePage backdrop-blur-sm hover:shadow-xl hover:bg-coursePage/80"
                  >
                    <AccordionTrigger className="hover:no-underline group text-foreground touch-manipulation">
                      {item.$type === "StudentLectureDto" ? (
                        <LectureAccordionHeader
                          lecture={item as StudentLectureDto}
                          course={course}
                        />
                      ) : (
                        <ExamAccordionHeader exam={item as StudentExamDto} />
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="border-t bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 backdrop-blur-sm border-border/30">
                      {item.$type === "StudentLectureDto" ? (
                        <LectureAccordionContent
                          lecture={item as StudentLectureDto}
                        />
                      ) : (
                        <ExamAccordionContent exam={item as StudentExamDto} />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="w-full p-6 text-center border rounded-lg shadow-lg sm:p-8 sm:rounded-xl md:rounded-2xl bg-coursePage backdrop-blur-sm border-border/20">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full sm:w-16 sm:h-16 bg-muted/50">
                    <FaFileAlt className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold sm:text-lg text-foreground">
                    {t("courses.noContentAvailable")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("courses.joinStudentsMessage")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CourseAccordion.displayName = "CourseAccordion";

function LectureAccordionHeader({
  lecture,
  course,
}: {
  lecture: StudentLectureDto;
  course: StudentCourseDetailsDto;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const getEnrollmentBadge = (enrollment?: string) => {
    switch (enrollment) {
      case "Active":
        return (
          <Badge className="px-2 py-1 text-xs transition-colors sm:px-3 sm:text-sm bg-chart-2/10 text-chart-2 border-chart-2/30 hover:bg-chart-2/20 dark:bg-chart-2/15 dark:hover:bg-chart-2/25">
            <FaCheckCircle
              className={`w-3 h-3 ${
                isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"
              } sm:w-4 sm:h-4`}
            />
            {t("courses.status.active")}
          </Badge>
        );
      case "Expired":
        return (
          <Badge className="px-2 py-1 text-xs transition-colors sm:px-3 sm:text-sm bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/25">
            <FaClock
              className={`w-3 h-3 ${
                isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"
              } sm:w-4 sm:h-4`}
            />
            {t("courses.status.expired")}
          </Badge>
        );
      default:
        return (
          <Badge className="px-2 py-1 text-xs transition-colors sm:px-3 sm:text-sm bg-muted/50 text-muted-foreground border-muted-foreground/30 hover:bg-muted/70 dark:bg-muted/40 dark:hover:bg-muted/60">
            <FaClock
              className={`w-3 h-3 ${
                isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"
              } sm:w-4 sm:h-4`}
            />
            {t("courses.status.available")}
          </Badge>
        );
    }
  };

  return (
    <div className="flex gap-3 p-4 sm:gap-4 md:gap-6 sm:flex-row sm:items-center sm:p-6 lg:p-8">
      {/* Image Section */}
      <div className="flex-shrink-0">
        <div className="relative w-16 h-16 overflow-hidden transition-all duration-300 shadow-lg sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-xl group-hover:scale-105 group-hover:shadow-xl">
          <img
            src={course.imageUrl || ""}
            alt={lecture.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="items-center justify-center hidden w-full h-full bg-transparent dark:bg-black/40">
            <FaGraduationCap className="w-8 h-8 text-white sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" />
          </div>
          <div className="absolute flex items-center justify-center w-6 h-6 text-white bg-transparent border rounded-full shadow-md dark:border-white top-1 right-1 sm:top-2 sm:right-2 sm:w-8 sm:h-8 md:w-10 md:h-10">
            <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
        {/* Mobile Layout: Title and Badge */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="space-y-2">
            <h3 className="text-base font-bold leading-tight break-words transition-colors text-foreground group-hover:text-primary line-clamp-3">
              {lecture.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {
                  (
                    lecture.items?.filter(
                      (item) => item.$type === "StudentLessonDto"
                    ) || []
                  ).length
                }{" "}
                {t("lectures.lesson")}
              </span>
              <span>•</span>
              <span>
                {
                  (
                    lecture.items?.filter(
                      (item) => item.$type === "StudentQuizDto"
                    ) || []
                  ).length
                }{" "}
                {t("lectures.quiz")}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-shrink-0">
              {getEnrollmentBadge(lecture.enrollment)}
            </div>
            {/* Price Info for Mobile */}
            {(lecture.enrollment as string) !== "Active" && (
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-full dark:bg-orange-900/30">
                    <Coins className="w-2 h-2 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-sm font-bold break-words text-primary">
                    {lecture.enrollment === "Expired"
                      ? `${lecture.renewalPrice || 0} ${t("common.currency")}`
                      : `${lecture.price || 0} ${t("common.currency")}`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {lecture.expirationDays || 0} days
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout: Title Section */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold leading-tight break-words transition-colors sm:text-xl lg:text-2xl xl:text-3xl text-foreground group-hover:text-primary">
              {lecture.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {
                (
                  lecture.items?.filter(
                    (item) => item.$type === "StudentLessonDto"
                  ) || []
                ).length
              }{" "}
              {t("lectures.lesson")}
            </span>
            <span>•</span>
            <span>
              {
                (
                  lecture.items?.filter(
                    (item) => item.$type === "StudentQuizDto"
                  ) || []
                ).length
              }{" "}
              {t("lectures.quiz")}
            </span>
          </div>
        </div>

        {/* Stats and Price Row - Desktop Only */}
        <div className="hidden sm:flex sm:flex-col sm:gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Badge for desktop - positioned at end */}
          <div className="flex items-center justify-start md:justify-end md:flex-shrink-0">
            {getEnrollmentBadge(lecture.enrollment)}
          </div>

          {/* Price Info for Desktop */}
          {(lecture.enrollment as string) !== "Active" && (
            <div className="flex flex-col items-start gap-0.5 md:items-end md:text-right md:ml-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full dark:bg-orange-900/30">
                  <Coins className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-sm font-bold break-words sm:text-base lg:text-lg text-primary">
                  {lecture.enrollment === "Expired"
                    ? `${lecture.renewalPrice || 0} ${t("common.currency")}`
                    : `${lecture.price || 0} ${t("common.currency")}`}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {lecture.expirationDays || 0} days
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LectureAccordionContent({ lecture }: { lecture: StudentLectureDto }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  const buyLectureMutation = useBuyLectureMutation();
  const { openModal } = useModalStore();
  const { data: profile } = useGetProfile();

  const isRTL = i18n.language === "ar";

  const onBuyClick = () => {
    if (lecture.enrollment === "Active") {
      // Navigate to lecture if already enrolled
      navigate(`/courses/${courseId}/lectures/${lecture.id}`);
    } else {
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

      // Purchase the lecture
      buyLectureMutation.mutate(
        {
          courseId: courseId!,
          lectureId: lecture.id,
        },
        {
          onSuccess: () => {
            toast({
              title: t("lectures.purchaseSuccessful"),
              description: t("courses.enrollNow"),
            });
            // Invalidate relevant queries to refresh the data
            queryClient.invalidateQueries({
              queryKey: getGetStudentCourseDetailsQueryKey(courseId!),
            });
          },
          onError: (error) => {
            if (isInsufficientBalanceError(error)) {
              openModal("redeem-credit-modal");
            } else {
              toast({
                title: "Error",
                description: "Failed to purchase lecture. Please try again.",
                variant: "destructive",
              });
            }
          },
        }
      );
    }
  };

  const handleButtonClick = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      navigate("/sign-in-sign-up");
      return;
    }

    const requiredAmount =
      lecture.enrollment === "Expired" ? lecture.renewalPrice : lecture.price;
    const userCredits = profile.data.credits || 0;

    if (userCredits < (requiredAmount || 0)) {
      openModal("redeem-credit-modal");
    } else {
      onBuyClick();
    }
  };

  const getButtonConfig = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return {
        text: t("courses.signInToBuyLecture"),
        icon: FaUser,
        variant: "default" as const,
        className:
          "w-full h-10 text-sm font-semibold tracking-wide sm:h-11 sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1",
        isInsufficientBalance: false,
        requiresAuth: true,
      };
    }

    const requiredAmount =
      lecture.enrollment === "Expired" ? lecture.renewalPrice : lecture.price;
    const userCredits = profile.data.credits || 0;
    const hasInsufficientBalance = userCredits < (requiredAmount || 0);

    if (lecture.enrollment === "Active") {
      return {
        text: t("courses.buttons.continue"),
        icon: FaPlay,
        variant: "default" as const,
        className:
          "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-200",
        isInsufficientBalance: false,
      };
    } else if (hasInsufficientBalance) {
      return {
        text: `${t("courses.insufficientBalance")} (${t("courses.buyCredit")})`,
        icon: AlertTriangle,
        variant: "destructive" as const,
        className: "transition-all duration-200",
        isInsufficientBalance: true,
      };
    } else if (lecture.enrollment === "Expired") {
      return {
        text: t("courses.buttons.renew"),
        icon: FaRedo,
        variant: "outline" as const,
        className:
          "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 hover:border-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 shadow-md hover:shadow-lg transition-all duration-200",
        isInsufficientBalance: false,
      };
    } else {
      return {
        text: t("courses.buttons.enroll"),
        icon: FaShoppingCart,
        variant: "outline" as const,
        className:
          "bg-primary/5 hover:bg-primary/10 text-primary border-primary/30 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-200",
        isInsufficientBalance: false,
      };
    }
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div
      className="px-3 pb-4 space-y-4 sm:px-6 sm:pb-8 sm:space-y-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Action Button Section - Only for Non-Active Lectures */}
      {(lecture.enrollment as string) !== "Active" && (
        <div className="space-y-3 sm:space-y-4">
          <PlasticButton
            onClick={handleButtonClick}
            size="default"
            variant={buttonConfig.variant}
            disabled={buyLectureMutation.isPending}
            className={`w-full h-10 text-sm font-semibold tracking-wide sm:h-11 sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${buttonConfig.className}`}
          >
            <div className="flex items-center justify-center gap-3">
              {buyLectureMutation.isPending ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin sm:w-5 sm:h-5" />
                  <span>{t("courses.processing")}</span>
                </>
              ) : (
                <>
                  <ButtonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{buttonConfig.text}</span>
                </>
              )}
            </div>
          </PlasticButton>

          {/* Price Info for Non-Active Lectures */}
          {(lecture.enrollment as string) !== "Active" && (
            <div className="relative p-4 overflow-hidden transition-all duration-300 border-2 shadow-lg rounded-xl sm:p-6 bg-gradient-to-br from-muted/20 to-muted/40 border-border/30 hover:border-border/50 hover:shadow-xl group">
              <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    <p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {lecture.enrollment === "Expired"
                        ? t("courses.renewal")
                        : t("courses.enrollNow")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full shadow-md bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20">
                      <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-lg font-bold text-transparent bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text dark:from-amber-400 dark:to-amber-500 sm:text-xl">
                      {lecture.enrollment === "Expired"
                        ? `${lecture.renewalPrice || 0} ${t("common.currency")}`
                        : `${lecture.price || 0} ${t("common.currency")}`}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <FaClock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                      {t("courses.expiresOn")}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-transparent bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                    {lecture.expirationDays || 0} days
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Enrollment Status */}
      {lecture.enrollment === "Active" &&
        lecture.expiresAt &&
        (() => {
          const expiresAt = new Date(lecture.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isExpiringSoon = daysUntilExpiry <= 5;

          return (
            <div
              className={`p-3 border rounded-lg sm:p-4 ${
                isExpiringSoon
                  ? "bg-yellow-50/80 border-yellow-200/80 dark:bg-yellow-900/20 dark:border-yellow-800/50"
                  : "bg-green-50/80 border-green-200/80 dark:bg-green-900/20 dark:border-green-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isExpiringSoon
                      ? "bg-yellow-100 dark:bg-yellow-800/30"
                      : "bg-green-100 dark:bg-green-800/30"
                  }`}
                >
                  <FaClock
                    className={`w-4 h-4 ${
                      isExpiringSoon
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isExpiringSoon
                        ? "text-yellow-800 dark:text-yellow-200"
                        : "text-green-800 dark:text-green-200"
                    }`}
                  >
                    {t("courses.expiresOn")}
                  </p>
                  <p
                    className={`text-sm ${
                      isExpiringSoon
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {expiresAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Description Section */}
      <DescriptionSection description={lecture.description} />

      {/* Attachments Section */}
      <AttachmentsSection attachments={lecture.assets} />

      {/* Lecture Content Items - Always shown */}
      <LectureItemsAccordions lecture={lecture} courseId={courseId!} />

      {/* Additional Info for Non-Active Lectures */}
      {(lecture.enrollment as string) !== "Active" &&
        lecture.enrollment === "Expired" && (
          <div className="p-3 border rounded-lg sm:p-4 bg-muted/20 border-border/30">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("courses.enrollmentExpiredMessage")}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function DescriptionSection({ description }: { description?: string | null }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaAlignLeft className="w-4 h-4 text-primary" />
          <h4 className="text-base font-semibold text-foreground sm:text-xl">
            {t("courses.description")}
          </h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium transition-colors text-primary hover:text-primary/80"
        >
          {isExpanded ? (
            <FaChevronUp className="w-4 h-4" />
          ) : (
            <FaChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="p-3 border rounded-lg shadow-sm sm:p-4 bg-background/90 border-border/50 backdrop-blur-sm">
          <MarkdownWrapper linkLabel={t("lectures.clickHereToViewLink")}>
            {description}
          </MarkdownWrapper>
        </div>
      )}
    </div>
  );
}

function AttachmentsSection({
  attachments,
}: {
  attachments?: StudentAssetDto[];
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Pdf":
        return <FaFilePdf className="w-4 h-4 text-red-500" />;
      case "Image":
        return <FaImage className="w-4 h-4 text-blue-500" />;
      default:
        return <FaPaperclip className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAssetClick = (asset: StudentAssetDto) => {
    // For now, we'll just log the asset. In a real app, you'd download or open the asset
    console.log("Asset clicked:", asset);
    // TODO: Implement asset download/viewing logic
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFolder className="w-4 h-4 text-primary sm:w-5 sm:h-5" />
          <h4 className="text-base font-semibold text-foreground sm:text-xl">
            {t("courses.attachments")} ({attachments?.length || 0})
          </h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium transition-colors text-primary hover:text-primary/80"
        >
          {isExpanded ? (
            <FaChevronUp className="w-4 h-4" />
          ) : (
            <FaChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="p-3 border rounded-lg shadow-sm sm:p-4 bg-background/90 border-border/50 backdrop-blur-sm">
          {attachments && attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="flex items-center gap-3 p-3 transition-all duration-200 border rounded-lg cursor-pointer bg-card/50 border-border/50 hover:bg-card/70 hover:border-border/70"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {asset.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.type}
                    </p>
                  </div>
                  <FaDownload className="w-4 h-4 transition-colors text-muted-foreground hover:text-primary" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-muted/30">
                <FaFolder className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("courses.noAssetsAvailable")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LessonAccordionItem({
  lesson,
  courseId,
  lectureId,
  lectureEnrollment,
}: {
  lesson: StudentLectureDtoItemsItem;
  courseId: string;
  lectureId: string;
  lectureEnrollment?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (lesson.$type !== "StudentLessonDto") return null;

  const handleLessonClick = () => {
    navigate(`/courses/${courseId}/lectures/${lectureId}/lessons/${lesson.id}`);
  };

  return (
    <AccordionItem
      value={`lesson-${lesson.id}`}
      className="border-b border-border/20"
    >
      <AccordionTrigger className="flex flex-1 items-center justify-between py-4 px-6 text-sm font-semibold transition-all hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180 text-left hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <FaPlay className="w-3 h-3 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{lesson.title}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                {t("lectures.lesson")} •
                <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-full dark:bg-orange-900/20">
                  <Coins className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                </div>
                {lesson.renewalPrice} {t("common.currency")}
              </p>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 backdrop-blur-sm border-t border-border/30 overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-6 pt-2 pb-4 space-y-3">
          {lesson.description && (
            <DescriptionSection description={lesson.description} />
          )}
          {lectureEnrollment === "Active" && (
            <div className="flex justify-end">
              <PlasticButton
                onClick={handleLessonClick}
                size="sm"
                className="w-full font-medium transition-all duration-300 transform border-0 shadow-md sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:shadow-lg hover:scale-105"
              >
                {t("lectures.startLesson")}
              </PlasticButton>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function QuizAccordionItem({
  quiz,
  courseId,
  lectureId,
  lectureEnrollment,
}: {
  quiz: StudentLectureDtoItemsItem;
  courseId: string;
  lectureId: string;
  lectureEnrollment?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (quiz.$type !== "StudentQuizDto") return null;

  const handleQuizClick = () => {
    navigate(`/courses/${courseId}/lectures/${lectureId}/quizzes/${quiz.id}`);
  };

  return (
    <AccordionItem
      value={`quiz-${quiz.id}`}
      className="border-b border-border/20"
    >
      <AccordionTrigger className="flex flex-1 items-center justify-between py-4 px-6 text-sm font-semibold transition-all hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180 text-left hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
              <FaQuestionCircle className="w-3 h-3 text-destructive" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{quiz.title}</p>
              <p className="text-sm text-muted-foreground">
                {t("lectures.quiz")} • {quiz.questionsCount}{" "}
                {t("quiz.questions")}
              </p>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 backdrop-blur-sm border-t border-border/30 overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-6 pt-2 pb-4 space-y-3">
          {quiz.description && (
            <DescriptionSection description={quiz.description} />
          )}
          {lectureEnrollment === "Active" && (
            <div className="flex justify-end">
              <PlasticButton
                onClick={handleQuizClick}
                size="sm"
                variant="destructive"
                className="w-full font-medium transition-all duration-300 transform border-0 shadow-md sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-105"
              >
                {t("quiz.takeQuiz")}
              </PlasticButton>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function LectureItemsAccordions({
  lecture,
  courseId,
}: {
  lecture: StudentLectureDto;
  courseId: string;
}) {
  const { t } = useTranslation();

  // Combine and sort all items by order
  const sortedItems = (lecture.items || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Count lessons and quizzes
  const lessonCount = sortedItems.filter(
    (item) => item.$type === "StudentLessonDto"
  ).length;
  const quizCount = sortedItems.filter(
    (item) => item.$type === "StudentQuizDto"
  ).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h4 className="text-base font-semibold text-foreground sm:text-xl">
          {t("lectures.lectureContent")}
        </h4>
      </div>

      {/* Stats Section */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FaPlay className="w-3 h-3 text-blue-500" />
          <span>
            {lessonCount} {t("lectures.lessons")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FaQuestionCircle className="w-3 h-3 text-green-500" />
          <span>
            {quizCount} {t("lectures.quizzes")}
          </span>
        </div>
      </div>

      {/* Combined Content Section */}
      <div className="space-y-2">
        <div className="border rounded-lg bg-card">
          {sortedItems.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {sortedItems.map((item) =>
                item.$type === "StudentLessonDto" ? (
                  <LessonAccordionItem
                    key={item.id}
                    lesson={item}
                    courseId={courseId}
                    lectureId={lecture.id}
                    lectureEnrollment={lecture.enrollment}
                  />
                ) : (
                  <QuizAccordionItem
                    key={item.id}
                    quiz={item}
                    courseId={courseId}
                    lectureId={lecture.id}
                    lectureEnrollment={lecture.enrollment}
                  />
                )
              )}
            </Accordion>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("lectures.noContentAvailable")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BuyButton({ course }: { course: StudentCourseDetailsDto }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const { mutate, isPending } = useBuyCourseMutation();
  const { openModal } = useModalStore();
  const { data: profile } = useGetProfile();
  const navigate = useNavigate();

  const onClick = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      navigate("/sign-in-sign-up");
      return;
    }

    // Check insufficient balance before making the purchase
    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;

    if (userCredits < (requiredAmount || 0)) {
      openModal("redeem-credit-modal");
      setIsOpen(false);
      return;
    }

    mutate(
      { courseId: course.id },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
        onError: (error) => {
          setIsOpen(false);
          if (isInsufficientBalanceError(error)) {
            openModal("redeem-credit-modal");
          }
        },
      }
    );
  };

  const getButtonText = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return t("courses.signInToBuyCourse");
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;
    const hasInsufficientBalance = userCredits < (requiredAmount || 0);

    if (hasInsufficientBalance) {
      return `${t("courses.insufficientBalance")} (${t("courses.buyCredit")})`;
    }

    if (course.enrollment === "Expired") {
      return t("courses.buttons.renew");
    }
    return t("courses.buttons.enroll");
  };

  const getButtonStyle = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return "w-full h-10 sm:h-11 font-semibold transition-all duration-500 sm:w-auto transform hover:scale-105 hover:-translate-y-1 touch-manipulation";
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;
    const hasInsufficientBalance = userCredits < (requiredAmount || 0);

    if (hasInsufficientBalance) {
      return "w-full h-10 sm:h-11 font-semibold transition-all duration-500 sm:w-auto transform hover:scale-105 hover:-translate-y-1 touch-manipulation";
    }

    if (course.enrollment === "Expired") {
      return "w-full h-10 sm:h-11 font-semibold transition-all duration-500 border-2 shadow-md bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 border-orange-300 hover:border-orange-400 hover:shadow-lg dark:from-orange-900/20 dark:to-orange-800/20 dark:text-orange-300 dark:border-orange-700 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 sm:w-auto transform hover:scale-105 hover:-translate-y-1 touch-manipulation";
    }
    return "w-full h-10 sm:h-11 font-semibold transition-all duration-500 border-2 shadow-md bg-gradient-to-r from-primary/10 to-primary/20 text-primary hover:from-primary/20 hover:to-primary/30 border-primary/30 hover:border-primary/50 hover:shadow-lg sm:w-auto transform hover:scale-105 hover:-translate-y-1 touch-manipulation";
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      e.preventDefault();
      navigate("/sign-in-sign-up");
      return;
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;

    // If insufficient balance, prevent default and open redeem modal directly
    if (userCredits < (requiredAmount || 0)) {
      e.preventDefault();
      openModal("redeem-credit-modal");
      return;
    }

    // If sufficient balance, allow the AlertDialog to open normally
    // No need to prevent default here, let the AlertDialogTrigger handle it
  };

  // Determine if we should show the AlertDialog or handle click manually
  const shouldShowConfirmationModal = () => {
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return false;
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;

    return userCredits >= (requiredAmount || 0);
  };

  const getButtonVariant = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return "default" as const;
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;
    const hasInsufficientBalance = userCredits < (requiredAmount || 0);

    return hasInsufficientBalance
      ? ("destructive" as const)
      : ("default" as const);
  };

  const getButtonIcon = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return <FaUser className="w-4 h-4" />;
    }

    const requiredAmount =
      course.enrollment === "Expired" ? course.renewalPrice : course.price;
    const userCredits = profile.data.credits || 0;
    const hasInsufficientBalance = userCredits < (requiredAmount || 0);

    if (hasInsufficientBalance) {
      return <AlertTriangle className="w-4 h-4" />;
    }

    return course.enrollment === "Expired" ? (
      <FaRedo className="w-4 h-4" />
    ) : (
      <FaShoppingCart className="w-4 h-4" />
    );
  };

  const getModalTitle = () => {
    if (course.enrollment === "Expired") {
      return t("courses.confirmRenewal");
    }
    return t("courses.confirmEnrollment");
  };

  const getModalDescription = () => {
    if (course.enrollment === "Expired") {
      return t("courses.confirmRenewalDescription", { title: course.title });
    }
    return t("courses.confirmEnrollmentDescription", { title: course.title });
  };

  const getConfirmButtonText = () => {
    if (course.enrollment === "Expired") {
      return t("courses.confirmRenewalButton");
    }
    return t("courses.confirmEnrollmentButton");
  };

  // Render button with or without AlertDialog based on the condition
  const buttonContent = (
    <PlasticButton
      size="default"
      variant={getButtonVariant()}
      className={getButtonStyle()}
      onClick={handleButtonClick}
    >
      <div className="flex items-center justify-center gap-2">
        {getButtonIcon()}
        <span className="text-sm font-semibold tracking-wide sm:text-base">
          {getButtonText()}
        </span>
      </div>
    </PlasticButton>
  );

  // If the user has sufficient balance and is authenticated, wrap with AlertDialog
  if (shouldShowConfirmationModal()) {
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>{buttonContent}</AlertDialogTrigger>
        <AlertDialogContent className="max-w-xs mx-3 border sm:max-w-sm md:max-w-lg sm:mx-4 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-foreground sm:text-base md:text-lg lg:text-xl">
              {getModalTitle()}
            </AlertDialogTitle>
            <AlertDialogDescription
              dir={isRTL ? "rtl" : "ltr"}
              className="text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base"
            >
              {getModalDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3">
            <AlertDialogCancel className="w-full text-sm border h-9 sm:h-10 sm:text-base bg-background text-foreground hover:bg-muted sm:w-auto touch-manipulation">
              {t("courses.cancel")}
            </AlertDialogCancel>
            <Button
              onClick={onClick}
              disabled={isPending}
              className="w-full text-sm h-9 sm:h-10 sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto touch-manipulation"
            >
              {isPending ? (
                <>
                  <FaSpinner className="w-3 h-3 mr-2 animate-spin sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">
                    {t("courses.processing")}
                  </span>
                </>
              ) : (
                getConfirmButtonText()
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // For insufficient balance or unauthenticated users, render button without AlertDialog
  return buttonContent;
}

function ExamAccordionHeader({ exam }: { exam: StudentExamDto }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const getEnrollmentBadge = (enrollment?: string) => {
    switch (enrollment) {
      case "Active":
        return (
          <Badge className="px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm bg-chart-2/10 text-chart-2 border-chart-2/30 hover:bg-chart-2/20 hover:border-chart-2/40 hover:scale-105 dark:bg-chart-2/15 dark:hover:bg-chart-2/25 shadow-sm hover:shadow-md">
            <FaCheckCircle
              className={`w-3.5 h-3.5 ${
                isRTL ? "ml-1.5 sm:ml-2" : "mr-1.5 sm:mr-2"
              } sm:w-4 sm:h-4 flex-shrink-0`}
            />
            {t("courses.status.active")}
          </Badge>
        );
      case "Expired":
        return (
          <Badge className="px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 hover:border-destructive/40 hover:scale-105 dark:bg-destructive/15 dark:hover:bg-destructive/25 shadow-sm hover:shadow-md">
            <FaClock
              className={`w-3.5 h-3.5 ${
                isRTL ? "ml-1.5 sm:ml-2" : "mr-1.5 sm:mr-2"
              } sm:w-4 sm:h-4 flex-shrink-0`}
            />
            {t("courses.status.expired")}
          </Badge>
        );
      default:
        return (
          <Badge className="px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm bg-muted/50 text-muted-foreground border-muted-foreground/30 hover:bg-muted/70 hover:border-muted-foreground/40 hover:scale-105 dark:bg-muted/40 dark:hover:bg-muted/60 shadow-sm hover:shadow-md">
            <FaClock
              className={`w-3.5 h-3.5 ${
                isRTL ? "ml-1.5 sm:ml-2" : "mr-1.5 sm:mr-2"
              } sm:w-4 sm:h-4 flex-shrink-0`}
            />
            {t("courses.status.available")}
          </Badge>
        );
    }
  };

  return (
    <div className="grid grid-cols-[auto,1fr] gap-4 p-4 sm:flex sm:flex-row sm:items-center sm:gap-6 sm:p-5 lg:p-6 xl:p-8 touch-manipulation">
      {/* Image Section - Enhanced mobile sizing */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 overflow-hidden transition-all duration-300 rounded-lg shadow-md sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 sm:rounded-xl hover:shadow-lg hover:scale-105">
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-50 via-orange-100/80 to-orange-200/60 dark:from-orange-900/20 dark:via-orange-800/30 dark:to-orange-700/40">
            <FaFileAlt className="transition-transform duration-300 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-orange-600/70 dark:text-orange-400/70 hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Content Section - Enhanced responsive layout */}
      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
        {/* Mobile Layout: Optimized vertical stacking */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="space-y-2">
            <h3 className="text-base font-bold leading-tight break-words transition-colors text-foreground group-hover:text-primary line-clamp-2 sm:text-lg">
              {exam.title}
            </h3>
            <div className="flex items-center justify-start">
              {getEnrollmentBadge("Available")}
            </div>
          </div>

          {/* Mobile Stats with better spacing */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
              <FaQuestionCircle className="flex-shrink-0 w-4 h-4 text-orange-600/70" />
              <span className="font-medium">
                {exam.questionsCount} {t("exams.questions")}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
              <FaHourglassHalf className="flex-shrink-0 w-4 h-4 text-blue-600/70" />
              <span className="font-medium">
                {exam.expiryHours} {t("exams.minutes")}
              </span>
            </div>
          </div>

          {/* Mobile Price Section - Enhanced */}
          <div className="p-3 border rounded-lg bg-orange-50/80 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full dark:bg-orange-900/30">
                  <Coins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-base font-bold text-orange-700 dark:text-orange-300">
                  {exam.price} {t("common.currency")}
                </span>
              </div>
              {exam.retakePrice > 0 && (
                <div className="flex items-center gap-1 text-sm text-orange-600/80 dark:text-orange-400/80">
                  <span className="text-xs">{t("exams.retake")}:</span>
                  <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-full dark:bg-orange-900/30">
                    <Coins className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-semibold">
                    {exam.retakePrice} {t("common.currency")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout: Horizontal arrangement with improved spacing */}
        <div className="hidden sm:block">
          <h3 className="text-lg font-bold leading-tight break-words transition-colors sm:text-xl lg:text-2xl xl:text-3xl text-foreground group-hover:text-primary">
            {exam.title}
          </h3>
        </div>

        {/* Desktop Stats and Price Row - Enhanced responsive grid */}
        <div className="hidden sm:grid sm:grid-cols-[1fr,auto,auto] sm:items-center sm:gap-6 lg:gap-8">
          {/* Statistics with enhanced styling */}
          <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-2 transition-colors rounded-lg bg-muted/20 hover:bg-muted/30">
              <FaQuestionCircle className="flex-shrink-0 w-4 h-4 lg:w-5 lg:h-5 text-orange-600/70" />
              <span className="font-medium whitespace-nowrap">
                {exam.questionsCount} {t("exams.questions")}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 transition-colors rounded-lg bg-muted/20 hover:bg-muted/30">
              <FaHourglassHalf className="flex-shrink-0 w-4 h-4 lg:w-5 lg:h-5 text-blue-600/70" />
              <span className="font-medium whitespace-nowrap">
                {exam.expiryHours} {t("exams.minutes")}
              </span>
            </div>
          </div>

          {/* Badge with enhanced positioning */}
          <div className="flex items-center justify-center flex-shrink-0">
            {getEnrollmentBadge("Available")}
          </div>

          {/* Price Info with enhanced styling */}
          <div className="flex flex-col items-end gap-1 text-right min-w-fit">
            <div className="flex items-center gap-2 text-base font-bold text-orange-600 dark:text-orange-400 lg:text-lg">
              <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full dark:bg-orange-900/30 lg:w-7 lg:h-7">
                <Coins className="w-4 h-4 text-orange-600 dark:text-orange-400 lg:w-5 lg:h-5" />
              </div>
              <span className="whitespace-nowrap">
                {exam.price} {t("common.currency")}
              </span>
            </div>
            {exam.retakePrice > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground lg:text-base">
                <span className="text-xs lg:text-sm">{t("exams.retake")}:</span>
                <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-full dark:bg-orange-900/30 lg:w-5 lg:h-5">
                  <Coins className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400 lg:w-3 lg:h-3" />
                </div>
                <span className="font-semibold whitespace-nowrap">
                  {exam.retakePrice} {t("common.currency")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function ExamAccordionContent({ exam }: { exam: StudentExamDto }) {
  const { t, i18n } = useTranslation();
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  const buyExamMutation = useBuyExamMutation();
  const { openModal } = useModalStore();

  const isRTL = i18n.language === "ar";

  const onBuyClick = () => {
    // Purchase the exam
    buyExamMutation.mutate(
      {
        courseId: courseId!,
        id: exam.id,
      },
      {
        onSuccess: () => {
          toast({
            title: t("exams.purchaseSuccessful"),
            description: t("exams.enrollNow"),
          });
          // Invalidate relevant queries to refresh the data
          queryClient.invalidateQueries({
            queryKey: getGetStudentCourseDetailsQueryKey(courseId!),
          });
        },
        onError: (error) => {
          if (isInsufficientBalanceError(error)) {
            openModal("redeem-credit-modal");
          } else {
            toast({
              title: "Error",
              description: "Failed to purchase exam. Please try again.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  const getButtonConfig = () => {
    return {
      text: t("exams.buttons.takeExam"),
      icon: FaFileAlt,
      variant: "outline" as const,
      className:
        "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 hover:border-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 shadow-md hover:shadow-lg transition-all duration-200",
    };
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div
      className="px-3 pb-4 space-y-4 sm:px-6 sm:pb-8 sm:space-y-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Action Button Section */}
      <div className="space-y-3 sm:space-y-4">
        <PlasticButton
          onClick={onBuyClick}
          size="default"
          disabled={buyExamMutation.isPending}
          className={`w-full h-10 text-sm font-semibold tracking-wide sm:h-11 sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${buttonConfig.className}`}
        >
          <div className="flex items-center justify-center gap-3">
            {buyExamMutation.isPending ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin sm:w-5 sm:h-5" />
                <span>{t("courses.processing")}</span>
              </>
            ) : (
              <>
                <ButtonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{buttonConfig.text}</span>
              </>
            )}
          </div>
        </PlasticButton>

        {/* Price Info */}
        <div className="relative p-4 overflow-hidden transition-all duration-300 border-2 border-orange-200 shadow-lg rounded-xl sm:p-6 bg-gradient-to-br from-orange-50/30 to-orange-100/30 hover:border-orange-300 hover:shadow-xl group dark:from-orange-900/10 dark:to-orange-800/10 dark:border-orange-800/50">
          <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-r from-transparent via-orange-100/20 to-transparent group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold tracking-wide text-orange-700 uppercase dark:text-orange-300">
                  {t("exams.examPrice")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full shadow-md bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900/30 dark:to-orange-800/30">
                  <Coins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-lg font-bold text-transparent bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text dark:from-orange-400 dark:to-orange-500 sm:text-xl">
                  {exam.price} {t("common.currency")}
                </span>
              </div>
            </div>
            {exam.retakePrice > 0 && (
              <div className="text-right">
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  {t("exams.retakePrice")}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-full dark:bg-orange-900/20">
                    <Coins className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    {exam.retakePrice} {t("common.currency")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-orange-600 rounded-full sm:h-6"></div>
          <h4 className="text-base font-semibold text-foreground sm:text-xl">
            {t("courses.description")}
          </h4>
        </div>
        <div className="p-3 border rounded-lg sm:p-4 bg-card/50 border-border/50">
          {exam.description ? (
            <MarkdownWrapper className="text-sm leading-relaxed text-muted-foreground sm:text-base prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-blue-500 prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-blue-600 prose-a:transition-colors prose-a:cursor-pointer [&_a]:pointer-events-auto prose-strong:text-foreground prose-em:text-foreground overflow-hidden break-words" linkLabel={t("lectures.clickHereToViewLink")}>
            </MarkdownWrapper>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("courses.noContentAvailable")}
            </p>
          )}
        </div>
      </div>

      {/* Exam Statistics Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-orange-600 rounded-full sm:h-6"></div>
          <h4 className="text-base font-semibold text-foreground sm:text-xl">
            {t("exams.examInfo")}
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Questions Card */}
          <div className="relative p-3 transition-all duration-200 border rounded-lg group bg-card/50 border-border/50 hover:bg-card/70 hover:border-border/70 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 transition-colors duration-200 bg-orange-100 rounded-full group-hover:bg-orange-200 dark:bg-orange-900/30 dark:group-hover:bg-orange-900/50 sm:w-14 sm:h-14">
                <FaQuestionCircle className="w-4 h-4 text-orange-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-foreground sm:text-3xl">
                  {exam.questionsCount}
                </div>
                <div className="text-sm font-medium text-muted-foreground sm:text-base">
                  {t("exams.questions")}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 transition-opacity duration-200 rounded-lg opacity-0 pointer-events-none bg-gradient-to-br from-orange-600/5 to-transparent group-hover:opacity-100"></div>
          </div>

          {/* Time Limit Card */}
          <div className="relative p-3 transition-all duration-200 border rounded-lg group bg-card/50 border-border/50 hover:bg-card/70 hover:border-border/70 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 transition-colors duration-200 bg-blue-100 rounded-full group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50 sm:w-14 sm:h-14">
                <FaHourglassHalf className="w-4 h-4 text-blue-600 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-foreground sm:text-3xl">
                  {exam.expiryHours}
                </div>
                <div className="text-sm font-medium text-muted-foreground sm:text-base">
                  {t("exams.minutes")}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 transition-opacity duration-200 rounded-lg opacity-0 pointer-events-none bg-gradient-to-br from-blue-600/5 to-transparent group-hover:opacity-100"></div>
          </div>
        </div>
      </div>

      <div className="p-3 border rounded-lg sm:p-4 bg-yellow-50/80 border-yellow-200/80 dark:bg-yellow-900/20 dark:border-yellow-800/50">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-800/30 mt-0.5">
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              ⚠️
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-yellow-800 dark:text-yellow-200">
              {t("exams.importantNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
