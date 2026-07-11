import Footer from "@/components/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GridPattern,
  genRandomPattern,
} from "@/components/ui/grid-feature-cards";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useBuyCourseMutation } from "@/api/courses-api";
import { useModalStore } from "@/store/use-modal-store";
import { isInsufficientBalanceError } from "@/lib/error-utils";
import { useQueryClient } from "@tanstack/react-query";

import CoursesBackground from "@/pages/student/courses/courses-background";
import { Heading } from "@/components/ui/heading";
import {
  Clock,
  Calendar,
  ShoppingCart,
  RotateCcw,
  BookOpen,
  FileText,
  GraduationCap,
  Coins,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { FaUser } from "react-icons/fa";
import { cn } from "@/lib/utils";
import {
  useGetStudentCourses,
  useGetProfile,
  getGetStudentCoursesQueryKey,
} from "@/generated/api";
import { StudentCourseDto, StudentLevel } from "@/generated/model";
import { CoursesGridSkeleton } from "@/components/ui/course-skeleton";

export const StudentCoursesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { levelNum } = useParams();
  const level = levelNum ? (`Level${levelNum}` as StudentLevel) : undefined;

  const { data, isLoading } = useGetStudentCourses({
    level: level || "Level0",
  });

  const getLevelDisplayName = (level: string) => {
    switch (level) {
      case "Level0":
        return t("profile.level3rdPrep");
      case "Level1":
        return t("profile.level1stSecondary");
      case "Level2":
        return t("profile.level2ndSecondary");
      case "Level3":
        return t("profile.level3rdSecondary");
      default:
        return level;
    }
  };

  const headerGridPattern = genRandomPattern(30);

  return (
    <div className="z-10 flex flex-col w-full h-full overflow-x-hidden bg-coursePage">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="relative flex flex-col-reverse items-center justify-between flex-grow px-4 py-10 mt-8 sm:px-8 md:px-12 lg:px-20 md:flex-row md:mt-20"
      >
        <div className="absolute inset-0 z-0 opacity-30">
          <GridPattern
            width={60}
            height={60}
            x="0"
            y="0"
            squares={headerGridPattern}
            className="w-full h-full stroke-primary/10 fill-primary/5"
          />
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <Heading
            className={cn(
              "text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {t("courses.heroTitle")}
          </Heading>
          {level && (
            <div className="flex items-center justify-center gap-2 mt-4 md:justify-start">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold text-primary">
                {getLevelDisplayName(level)}
              </span>
            </div>
          )}
        </div>
        <div className="relative z-10 flex-shrink-0 mb-6 md:mb-0 h-[250px] sm:h-[300px] md:h-[400px] lg:h-[600px] w-fit md:ml-8 lg:ml-auto">
          <CoursesBackground />
        </div>
      </div>

      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-wrap items-center justify-center w-full gap-4 bg-coursePage"
      >
        {isLoading ? (
          <CoursesGridSkeleton count={8} />
        ) : (
          <div className="z-10 grid w-full grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 md:gap-8 md:p-12 lg:p-20 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data?.data?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

function CourseCard({ course }: { course: StudentCourseDto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const buyCourseMutation = useBuyCourseMutation();
  const { openModal } = useModalStore();
  const queryClient = useQueryClient();
  const { data: profile } = useGetProfile();

  const formatPrice = (price: number | undefined) => {
    return `${price} ${t("common.currency")}`;
  };

  const getLevelDisplayName = (level: string) => {
    switch (level) {
      case "Level0":
        return t("profile.level3rdPrep");
      case "Level1":
        return t("profile.level1stSecondary");
      case "Level2":
        return t("profile.level2ndSecondary");
      case "Level3":
        return t("profile.level3rdSecondary");
      default:
        return level?.replace("Level", "Level ");
    }
  };

  const getEnrollmentBadge = (enrollment: string) => {
    switch (enrollment) {
      case "Active":
        return (
          <Badge variant="default" className="text-white bg-emerald-500">
            {t("courses.status.active")}
          </Badge>
        );
      case "Expired":
        return (
          <Badge variant="destructive">{t("courses.status.expired")}</Badge>
        );
      case "NotEnrolled":
        return (
          <Badge
            variant="outline"
            className="text-neutral-200 border-neutral-300"
          >
            {t("courses.status.available")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{enrollment}</Badge>;
    }
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!course.id) return;

    // Only handle enrollment for non-active courses
    if (
      course.enrollment === "NotEnrolled" ||
      course.enrollment === "Expired"
    ) {
      // Check insufficient balance before making the purchase
      const requiredAmount =
        course.enrollment === "Expired" ? course.renewalPrice : course.price;
      const userCredits =
        profile?.data?.$type === "GetStudentProfileResult"
          ? profile.data.credits
          : 0;

      if (userCredits < (requiredAmount || 0)) {
        openModal("redeem-credit-modal");
        return;
      }

      buyCourseMutation.mutate(
        { courseId: course.id },
        {
          onSuccess: () => {
            // Invalidate queries to refresh the course list
            queryClient.invalidateQueries({
              queryKey: getGetStudentCoursesQueryKey({
                level: course.level || "Level0",
              }),
            });
          },
          onError: (error) => {
            if (isInsufficientBalanceError(error)) {
              openModal("redeem-credit-modal");
            }
          },
        }
      );
    }
  };

  const handleViewCourseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (course.id) {
      navigate(`/courses/${course.id}`);
    }
  };

  const getEnrollButton = () => {
    // Check authentication first
    if (!profile?.data || profile.data.$type !== "GetStudentProfileResult") {
      return (
        <Button
          onClick={() => navigate("/sign-in-sign-up")}
          variant="secondary"
          className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 rounded-lg"
        >
          <FaUser className="w-4 h-4" />
          {t("courses.signInToBuyCourse")}
        </Button>
      );
    }

    const userCredits = profile.data.credits || 0;
    const userLevel = profile.data.level;

    // Check if course level matches user level
    const isLevelMismatch =
      userLevel && course.level && userLevel !== course.level;

    if (isLevelMismatch) {
      return (
        <Button
          disabled
          variant="outline"
          className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 rounded-lg cursor-not-allowed text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
        >
          <AlertTriangle className="w-4 h-4" />
          {t("courses.levelMismatch")}
        </Button>
      );
    }

    switch (course.enrollment) {
      case "Active": {
        // For active courses, don't show an enroll button - only view course button is shown
        return null;
      }
      case "Expired": {
        const renewalPrice = course.renewalPrice || 0;
        const hasInsufficientCreditsForRenewal = userCredits < renewalPrice;

        if (hasInsufficientCreditsForRenewal) {
          return (
            <Button
              onClick={() => openModal("redeem-credit-modal")}
              variant="destructive"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4" />
              {t("courses.insufficientBalance")} ({t("courses.buyCredit")})
            </Button>
          );
        }

        return (
          <Button
            onClick={handleEnrollClick}
            disabled={buyCourseMutation.isPending}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-white transition-all duration-200 bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            {buyCourseMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {buyCourseMutation.isPending
              ? t("courses.processing")
              : `${t("courses.renewal")} ${formatPrice(course.renewalPrice)}`}
          </Button>
        );
      }
      case "NotEnrolled": {
        const enrollPrice = course.price || 0;
        const hasInsufficientCreditsForEnroll = userCredits < enrollPrice;

        if (hasInsufficientCreditsForEnroll) {
          return (
            <Button
              onClick={() => openModal("redeem-credit-modal")}
              variant="destructive"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4" />
              {t("courses.insufficientBalance")} ({t("courses.buyCredit")})
            </Button>
          );
        }

        return (
          <Button
        //  onClick={handleEnrollClick}
        //  disabled={buyCourseMutation.isPending}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-white transition-all duration-200 bg-blue-000 rounded-lg hover:bg-blue-000"
          >
        {/*buyCourseMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {buyCourseMutation.isPending
              ? t("courses.processing")
              : `${t("courses.buttons.enroll")} ${formatPrice(course.price)}`}
              */}
          </Button>
        );
      }
      default:
        return null;
    }
  };

  const gridPattern = genRandomPattern(50);

  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto overflow-hidden transition-all duration-300 border shadow-lg group border-border/50 bg-card hover:shadow-2xl rounded-xl hover:-translate-y-1 sm:max-w-none"
      whileHover="hover"
      initial="initial"
    >
      <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
        <div className="flex-1">
          <div className="relative p-3 overflow-hidden sm:p-4 rounded-t-xl">
            <div className="relative overflow-hidden rounded-lg">
              <img
                className="object-cover w-full h-40 transition-all duration-500 sm:h-48 md:h-52"
                src={course.imageUrl || ""}
                alt={`${course.title} ${t("courses.courseImageAlt")}`}
                loading="lazy"
              />
            </div>

            <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
              {getEnrollmentBadge(course.enrollment)}
            </div>
          </div>

          <div className="relative flex flex-col flex-1">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-foreground/1 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
                <GridPattern
                  width={45}
                  height={45}
                  x=""
                  y=""
                  squares={gridPattern}
                  className="absolute inset-0 w-full h-full fill-foreground/5 stroke-foreground/25 mix-blend-overlay"
                />
              </div>
            </div>

            <CardHeader className="relative z-10 px-3 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
              <Heading className="text-base font-bold leading-tight transition-colors duration-300 sm:text-lg md:text-xl lg:text-2xl line-clamp-2">
                {course.title}
              </Heading>
              {course.description && (
                <p className="mt-2 text-xs leading-relaxed sm:mt-3 sm:text-sm text-muted-foreground/80 line-clamp-2 sm:line-clamp-3">
                  {course.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="relative z-10 flex-1 px-3 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Level Display */}
                {course.level && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full sm:w-8 sm:h-8 bg-primary/10">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold sm:text-sm text-foreground">
                      {getLevelDisplayName(course.level)}
                    </span>
                  </div>
                )}

                {/* Price Display with Gold Crown */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full sm:w-8 sm:h-8 bg-amber-100 dark:bg-amber-900/20">
                    <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold sm:text-xl lg:text-2xl text-amber-600 dark:text-amber-500">
                        {formatPrice(course.price)}
                      </span>
                    </div>
                    {course.renewalPrice &&
                      course.renewalPrice !== course.price && (
                        <div className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-amber-600/70 dark:text-amber-400/70" />
                          <span className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">
                            {t("courses.renewal")}:{" "}
                            {formatPrice(course.renewalPrice)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Lectures Count */}
                {course.lecturesCount !== undefined &&
                  course.lecturesCount > 0 && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full sm:w-8 sm:h-8 dark:bg-blue-900/20">
                        <BookOpen className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-semibold text-blue-700 sm:text-sm dark:text-blue-400">
                        {course.lecturesCount} {t("courses.lectures")}
                      </span>
                    </div>
                  )}

                {/* Exams Count */}
                {course.examsCount !== undefined && course.examsCount >= 0 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full sm:w-8 sm:h-8 dark:bg-purple-900/20">
                      <FileText className="w-3 h-3 text-purple-600 sm:w-4 sm:h-4 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-purple-700 sm:text-sm dark:text-purple-400">
                      {course.examsCount} {t("courses.exams")}
                    </span>
                  </div>
                )}

                {course.enrollment === "Expired" && course.expiresAt && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full sm:w-8 sm:h-8 dark:bg-red-900/20">
                      <Calendar className="w-3 h-3 text-red-600 sm:w-4 sm:h-4 dark:text-red-400" />
                    </div>
                    <span className="text-xs font-semibold text-red-700 sm:text-sm dark:text-red-400">
                      {t("courses.expired")}:{" "}
                      {new Date(course.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {course.enrollment === "Active" && course.expirationDays && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full sm:w-8 sm:h-8 dark:bg-orange-900/20">
                      <Clock className="w-3 h-3 text-orange-600 sm:w-4 sm:h-4 dark:text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-orange-700 sm:text-sm dark:text-orange-400">
                      {course.expirationDays} {t("courses.daysRemaining")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="relative z-20 px-3 pb-4 space-y-2 sm:px-6 sm:pb-6">
          {/* For Active courses, show only View Course button */}
          {course.enrollment === "Active" ? (
            <Button
              onClick={handleViewCourseClick}
              variant="outline"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 border-2 rounded-lg hover:bg-primary/10 hover:border-primary"
            >
              <BookOpen className="w-4 h-4" />
              {t("courses.buttons.viewCourse")}
            </Button>
          ) : (
            <>
              {/* View Course Button */}
              <Button
                onClick={handleViewCourseClick}
                variant="outline"
                className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold transition-all duration-200 border-2 rounded-lg hover:bg-primary/10 hover:border-primary"
              >
                <BookOpen className="w-4 h-4" />
                {t("courses.buttons.viewCourse")}
              </Button>

              {/* Enrollment Action Button */}
              {getEnrollButton()}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
